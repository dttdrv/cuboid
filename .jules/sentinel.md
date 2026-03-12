## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Command Injection via option-like filenames]
**Vulnerability:** In `backend/src/services/compileQueue.ts`, user-provided `mainFile` names were directly passed to `latexmk` via the compile worker without verifying if they began with a hyphen. This could lead to a command injection vulnerability where a filename like `-shell-escape` is interpreted as an option by the compiler rather than a filename.
**Learning:** Even when executing external tools with separated arguments, user input representing filenames must be validated to ensure it cannot be mistaken for command-line flags or options by the underlying tool.
**Prevention:** Explicitly reject inputs that start with hyphens (e.g., `-`) or use `--` as an argument separator where supported by the underlying command-line tool, to disambiguate options from positional arguments.
