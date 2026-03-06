## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-19 - Prevent Prototype Pollution in Extra Body Merge
**Vulnerability:** The `mergeExtraBody` function in `aiRouter.ts` directly assigns keys from an untrusted `extraBody` object to a payload without blocking keys that could lead to prototype pollution, such as `__proto__`, `constructor`, and `prototype`.
**Learning:** Even simple single-level object merges need to restrict special prototype-mutating keys, because `JSON.parse` allows them as strings, and malicious user payloads can pollute object properties.
**Prevention:** Always explicitly block prototype-mutating keys (`__proto__`, `constructor`, `prototype`) in addition to business logic properties during any merging of untrusted input.
