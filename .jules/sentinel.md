## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Command Injection via Option Injection]
**Vulnerability:** The Rust compile worker directly passed `req.main_file` to `latexmk` without validation. Attackers could supply filenames starting with a hyphen (e.g., `-shell-escape`) to inject arguments via array-based argument passing (`spawn`).
**Learning:** Even when using safer array-based argument passing instead of shell interpolation, user input intended as positional arguments (like filenames) can be misinterpreted as options if they start with hyphens.
**Prevention:** Explicitly validate and reject user-provided filenames or paths that start with a hyphen (`-`) if they are to be passed as positional arguments to command line tools.
