## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2025-02-18 - [Command Option Injection in Compilation Worker]
**Vulnerability:** The `mainFile` parameter in `backend/src/services/compileQueue.ts` was not validated to ensure it didn't start with a hyphen (`-`). This allowed an attacker to inject command options (e.g., `-shell-escape`) to the `latexmk` command spawned by the Rust compile worker, leading to potential command execution or server compromise.
**Learning:** Always validate user-provided input that is passed as positional arguments to external commands or processes, explicitly rejecting inputs that look like options/flags (starting with `-` or `--`).
**Prevention:** Explicitly reject `mainFile` values starting with a hyphen in the compilation queue service before they reach the compile worker.
