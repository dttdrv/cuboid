## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Prototype Pollution via extraBody merging]
**Vulnerability:** The `mergeExtraBody` function in `backend/src/services/aiRouter.ts` recursively merged user-provided `extraBody` parameters into the `payload` object. However, it lacked sanitization for special keys like `__proto__`, `constructor`, and `prototype`, which allowed for potential Prototype Pollution vulnerabilities where global object prototypes could be manipulated.
**Learning:** Merging untrusted, user-controlled JSON objects directly into internal structures is dangerous without strictly omitting or filtering prototype-mutating keys.
**Prevention:** Always block known dangerous keys such as `__proto__`, `constructor`, and `prototype` explicitly during object assignments or merges.
