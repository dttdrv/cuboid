## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - Prototype Pollution in mergeExtraBody
**Vulnerability:** The `mergeExtraBody` function in `backend/src/services/aiRouter.ts` iterates over the user-provided `extraBody` object and assigns properties to the `payload` object without blocking prototype properties.
**Learning:** This creates a risk of prototype pollution, allowing an attacker to inject properties into the `payload` object that could unexpectedly alter the behavior of downstream code or JSON serialization.
**Prevention:** To prevent prototype pollution when merging user-controlled objects, always explicitly block sensitive keys such as `__proto__`, `constructor`, and `prototype`.
