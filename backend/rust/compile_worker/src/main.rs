use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;
use wait_timeout::ChildExt;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CompileRequest {
    project_root: String,
    main_file: String,
    build_dir: String,
    timeout_ms: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CompileResponse {
    success: bool,
    timed_out: bool,
    exit_code: Option<i32>,
    stdout: String,
    stderr: String,
    pdf_path: Option<String>,
    log_path: Option<String>,
    pdf_bytes: Option<u64>,
    log_bytes: Option<u64>,
    error: Option<String>,
}

fn stem_for_main(main_file: &str) -> String {
    let path = Path::new(main_file);
    match path.file_stem().and_then(|s| s.to_str()) {
        Some(stem) if !stem.trim().is_empty() => stem.to_string(),
        _ => "main".to_string(),
    }
}

fn file_size(path: &PathBuf) -> Option<u64> {
    fs::metadata(path).ok().map(|meta| meta.len())
}

fn build_failure(stdout: String, stderr: String, code: Option<i32>, message: String) -> CompileResponse {
    CompileResponse {
        success: false,
        timed_out: false,
        exit_code: code,
        stdout,
        stderr,
        pdf_path: None,
        log_path: None,
        pdf_bytes: None,
        log_bytes: None,
        error: Some(message),
    }
}

fn run_compile(req: &CompileRequest) -> CompileResponse {
    let build_dir = PathBuf::from(&req.build_dir);
    if let Err(err) = fs::create_dir_all(&build_dir) {
        return build_failure(
            String::new(),
            String::new(),
            None,
            format!("Failed to create build directory: {err}"),
        );
    }

    let mut child = match Command::new("latexmk")
        .arg("-pdf")
        .arg("-interaction=nonstopmode")
        .arg("-halt-on-error")
        .arg("-file-line-error")
        .arg("-output-directory")
        .arg(&req.build_dir)
        .arg(&req.main_file)
        .current_dir(&req.project_root)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(proc) => proc,
        Err(err) => {
            return build_failure(
                String::new(),
                String::new(),
                None,
                format!("Failed to launch latexmk: {err}"),
            )
        }
    };

    let timeout = Duration::from_millis(req.timeout_ms);
    let timed_out = match child.wait_timeout(timeout) {
        Ok(Some(_status)) => false,
        Ok(None) => {
            let _ = child.kill();
            true
        }
        Err(err) => {
            let _ = child.kill();
            return build_failure(
                String::new(),
                String::new(),
                None,
                format!("Failed while waiting for compile process: {err}"),
            );
        }
    };

    let output = match child.wait_with_output() {
        Ok(out) => out,
        Err(err) => {
            return build_failure(
                String::new(),
                String::new(),
                None,
                format!("Failed to collect compile output: {err}"),
            )
        }
    };

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let code = output.status.code();

    let stem = stem_for_main(&req.main_file);
    let pdf_path = build_dir.join(format!("{stem}.pdf"));
    let log_path = build_dir.join(format!("{stem}.log"));

    if timed_out {
        return CompileResponse {
            success: false,
            timed_out: true,
            exit_code: code,
            stdout,
            stderr,
            pdf_path: None,
            log_path: if log_path.exists() {
                Some(log_path.to_string_lossy().to_string())
            } else {
                None
            },
            pdf_bytes: None,
            log_bytes: file_size(&log_path),
            error: Some("Compilation timed out.".to_string()),
        };
    }

    let success = output.status.success() && pdf_path.exists();
    let pdf_path_str = if success {
        Some(pdf_path.to_string_lossy().to_string())
    } else {
        None
    };
    let log_path_str = if log_path.exists() {
        Some(log_path.to_string_lossy().to_string())
    } else {
        None
    };

    CompileResponse {
        success,
        timed_out: false,
        exit_code: code,
        stdout,
        stderr,
        pdf_path: pdf_path_str,
        log_path: log_path_str,
        pdf_bytes: if success { file_size(&pdf_path) } else { None },
        log_bytes: file_size(&log_path),
        error: if success {
            None
        } else {
            Some("latexmk failed to produce a PDF.".to_string())
        },
    }
}

fn main() {
    let mut input = String::new();
    if io::stdin().read_to_string(&mut input).is_err() {
        let response = CompileResponse {
            success: false,
            timed_out: false,
            exit_code: None,
            stdout: String::new(),
            stderr: String::new(),
            pdf_path: None,
            log_path: None,
            pdf_bytes: None,
            log_bytes: None,
            error: Some("Failed to read stdin.".to_string()),
        };
        println!("{}", serde_json::to_string(&response).unwrap_or_else(|_| "{}".to_string()));
        return;
    }

    let request = match serde_json::from_str::<CompileRequest>(&input) {
        Ok(req) => req,
        Err(err) => {
            let response = CompileResponse {
                success: false,
                timed_out: false,
                exit_code: None,
                stdout: String::new(),
                stderr: String::new(),
                pdf_path: None,
                log_path: None,
                pdf_bytes: None,
                log_bytes: None,
                error: Some(format!("Invalid request JSON: {err}")),
            };
            println!("{}", serde_json::to_string(&response).unwrap_or_else(|_| "{}".to_string()));
            return;
        }
    };

    let response = run_compile(&request);
    println!("{}", serde_json::to_string(&response).unwrap_or_else(|_| "{}".to_string()));
}
