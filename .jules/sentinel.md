## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Prototype Pollution via Object Merging]
**Vulnerability:** The `mergeExtraBody` function in `backend/src/services/aiRouter.ts` accepted user-provided objects (`extraBody` from `AiChatRequest` payload) and copied properties without filtering prototype-mutating keys (`__proto__`, `constructor`, `prototype`). This allowed attackers to perform prototype pollution, potentially altering global object behavior and leading to RCE or bypasses.
**Learning:** Functions that merge user-controlled objects must explicitly block sensitive prototype keys, even if they use functions like `Object.entries()`, because JSON inputs can still map these properties.
**Prevention:** Always use safe merge functions or explicitly sanitize input objects by ensuring keys like `__proto__`, `constructor`, and `prototype` are filtered out or ignored during any object property copy or merge loop.
