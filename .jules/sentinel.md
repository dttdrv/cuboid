## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Prototype Pollution via Object Merging]
**Vulnerability:** In `backend/src/services/aiRouter.ts`, the `mergeExtraBody` function copied all keys from a user-supplied object (`extraBody`) into a `payload` object. The function failed to block special object keys (`__proto__`, `constructor`, `prototype`), creating a prototype pollution vulnerability.
**Learning:** Functions that merge user-controlled properties into existing objects must be specifically hardened against prototype pollution. Iterating over keys using `Object.entries` or `for...in` will happily copy `__proto__` and `constructor` keys if the payload was properly crafted (e.g. using `JSON.parse`).
**Prevention:** To prevent prototype pollution, any object-merging or key-copying utility must explicitly validate or deny-list sensitive keys like `__proto__`, `constructor`, and `prototype` before assignment.
