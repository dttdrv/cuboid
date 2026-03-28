## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2025-03-28 - [Command Option Injection in compileQueue]
**Vulnerability:** The `mainFile` parameter in `backend/src/services/compileQueue.ts` was used directly in a `latexmk` shell command within the Rust compile worker without sanitizing for malicious option flags (e.g., `-shell-escape`).
**Learning:** External processes executed with array-based arguments (like `Command::new().arg()` or Node's `spawn`) are still vulnerable to Option Injection if user-provided positional arguments start with a hyphen (`-`) and are interpreted as flags by the underlying binary.
**Prevention:** Explicitly validate and reject any user-provided inputs that start with a hyphen (`-`) when they are intended to be used as positional arguments (such as filenames) in external binary execution.
