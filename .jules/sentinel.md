## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Prevent Option Injection in latexmk Compilation Worker]
**Vulnerability:** The Rust compilation worker uses `latexmk` and passes the API-provided `main_file` as an argument without checking if it acts as a command-line flag. A filename starting with `-` could execute arbitrary arguments (e.g. `-shell-escape`).
**Learning:** Command line argument injection can occur not just through unescaped shells, but by applications correctly executing standard arrays of arguments if the first character of user input mimics an option flag.
**Prevention:** Validate input strings that represent filenames or parameters going into child processes to ensure they do not start with a hyphen (`-`) or match known tool option schemas.
