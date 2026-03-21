## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2025-03-21 - [Option Injection in Compile Queue]
**Vulnerability:** The `mainFile` parameter in `backend/src/services/compileQueue.ts` was passed without checking if it starts with a hyphen. This could lead to Option Injection, where an attacker could provide a malicious filename like `-shell-escape` that gets interpreted as an argument to `latexmk` by the compile worker (`backend/rust/compile_worker`).
**Learning:** Whenever taking user-provided input that is intended to be a positional argument (like a filename) to a command-line utility, you must ensure the input cannot be parsed as a command-line option.
**Prevention:** Always validate and reject input starting with hyphens (`-`) when they are meant to be strictly positional arguments, or use explicit end-of-options markers (like `--`) if the target utility supports it.
