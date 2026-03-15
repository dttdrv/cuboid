## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.
## 2025-02-12 - [Command Injection in Compile Worker]
**Vulnerability:** The compile queue service (`backend/src/services/compileQueue.ts`) accepted `mainFile` names without validation and passed them directly to a Rust compilation worker that spawned `latexmk`. This could allow command injection via flag injection by providing option-like filenames (e.g., `-shell-escape`).
**Learning:** Command line utilities can interpret filenames as option flags if they begin with a hyphen, leading to potentially dangerous executions.
**Prevention:** Always validate and sanitize user-provided filenames, explicitly rejecting any filename that starts with a hyphen or other suspicious characters before passing them to external processes or workers.
