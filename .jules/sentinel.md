## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Command Injection via Option-like Filenames]
**Vulnerability:** The Rust compilation worker (`backend/rust/compile_worker`) executes `latexmk` passing the user-controlled `mainFile` string directly as an argument without validating if it starts with a hyphen. This could allow users to provide `-shell-escape` as the filename, which would run arbitrary shell commands on the system.
**Learning:** Passing unsanitized input directly into system command arguments can be vulnerable even if path traversal is mitigated, because values starting with a hyphen (like `-shell-escape`) are interpreted as command options.
**Prevention:** Strictly validate any string value that will be used as a filename argument to reject option-like prefixes (e.g. starting with `-`).
