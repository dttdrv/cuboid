## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - Command Injection via Option-like Filenames
**Vulnerability:** The Rust compilation worker (`backend/rust/compile_worker`) executes `latexmk` passing `mainFile` as an argument without validating if it starts with a hyphen. This allows command injection if a user supplies a filename like `-shell-escape`.
**Learning:** Even when using array-based argument passing (which prevents shell meta-character injection like `;` or `|`), arguments that start with `-` can still be interpreted as command options by the executed binary, leading to unintended behavior or execution of arbitrary code if the binary supports such options.
**Prevention:** Always validate user-provided input that will be used as a command argument to ensure it does not start with a hyphen (`-`) when it's expected to be a positional argument like a filename.
