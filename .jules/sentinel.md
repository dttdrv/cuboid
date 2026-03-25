## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Option Injection in Compile Worker]
**Vulnerability:** The `mainFile` parameter in `backend/src/services/compileQueue.ts` was passed directly to the `latexmk` binary via array-based argument passing (`Command::new("latexmk").arg(&req.main_file)`) without validating if the filename started with a hyphen (`-`). This allowed attackers to perform option injection (command injection) by providing filenames like `-shell-escape` or `-interaction=...`, which `latexmk` would interpret as command-line flags.
**Learning:** Even when using array-based argument passing (which prevents standard shell injection), user-provided values intended to be positional arguments (like filenames) can still be interpreted as options if they start with a hyphen.
**Prevention:** Always explicitly validate and reject user-provided arguments intended to be positional (like filenames) if they start with a hyphen (`-`) when executing external binaries.
