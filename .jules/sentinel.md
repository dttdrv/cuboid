## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2026-03-20 - [Command Injection via Option-like Filenames]
**Vulnerability:** The Rust compilation worker executed `latexmk` with a user-provided `main_file`. Command injection via option-like filenames (e.g., `-shell-escape`) was possible because `mainFile` inputs starting with a hyphen were not rejected in `compileQueue.ts`.
**Learning:** Even when delegating execution to a worker, all user-provided inputs must be validated to prevent injection attacks.
**Prevention:** Strictly reject inputs like filenames that begin with option-like characters (e.g., `-`) in the backend before passing them to the worker process.
