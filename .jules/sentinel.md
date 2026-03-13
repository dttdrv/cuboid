## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Command Injection in LaTeX Compilation]
**Vulnerability:** User-controlled filename (`mainFile`) in `backend/src/services/compileQueue.ts` was passed without sanitization to a Rust compile worker, which passed it directly to `latexmk`. If a user provided a filename starting with `-`, it could be interpreted as a command-line option by `latexmk` leading to potential command injection.
**Learning:** Even when using a wrapper or worker for subprocess execution, all user-provided arguments must be validated. Specifically, filenames starting with `-` are dangerous when passed to shell utilities.
**Prevention:** Strictly sanitize or validate all user-controlled strings passed to external command execution contexts. Block inputs that resemble options (e.g. starting with `-`).
