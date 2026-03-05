## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2025-05-24 - [Prototype Pollution in API extraBody]
**Vulnerability:** The `mergeExtraBody` function in `backend/src/services/aiRouter.ts` accepted untrusted input (`extraBody`) and blindly merged its properties into the payload. It did not block built-in JavaScript properties `__proto__`, `constructor`, or `prototype`, which could lead to a prototype pollution vulnerability.
**Learning:** Even when performing seemingly safe operations like filtering specific keys (`model`, `messages`, `stream`), all user-controlled object merging must explicitly protect against prototype pollution by blocking dangerous keys (`__proto__`, `constructor`, `prototype`).
**Prevention:** Always sanitize keys during object merges by explicitly blocking `__proto__`, `constructor`, and `prototype`.
