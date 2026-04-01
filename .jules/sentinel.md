## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Command Option Injection in Rust Worker]
**Vulnerability:** The `mainFile` input provided in `backend/src/services/compileQueue.ts` was passed directly to the `latexmk` command within the Rust worker without validation. This allowed an attacker to start the string with a hyphen (`-`), executing malicious options such as `-shell-escape`.
**Learning:** Command arguments dynamically generated from user input and passed natively (e.g. via Node.js `spawn` or Rust's `Command::new`) are vulnerable to Command Option Injection (also known as Flag Injection) if they are supposed to be positional parameters (like a filename) but start with a dash.
**Prevention:** Explicitly validate and reject user-provided arguments intended as positional inputs if they begin with a hyphen (`-`).
