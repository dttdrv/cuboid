## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-06-25 - [Command Injection in LaTeX Compilation Worker]
**Vulnerability:** The Rust compilation worker (`backend/rust/compile_worker`) executes `latexmk` with a user-provided `mainFile`. Malicious users could supply a `mainFile` starting with a hyphen (e.g., `-shell-escape`) to inject command-line arguments to `latexmk`, potentially leading to Remote Code Execution (RCE).
**Learning:** Command-line tools (like `latexmk`) often interpret arguments starting with a hyphen as options rather than filenames, even if they are intended to be positional arguments. This is a common pattern for Argument Injection.
**Prevention:** Strictly reject user-provided filenames that start with a hyphen (`-`) when they are passed to command-line execution tools, or prefix them with `--` or `./` if the tool supports it.
