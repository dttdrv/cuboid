## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.
## 2024-05-24 - [Prototype Pollution in AI Body Merge]
**Vulnerability:** The `mergeExtraBody` function in `backend/src/services/aiRouter.ts` merged user-provided JSON body (`extraBody`) into a target object literal without filtering out prototype properties like `__proto__`, `constructor`, or `prototype`.
**Learning:** Merging uncontrolled user objects into internal structures (even object literals) can inadvertently modify the object prototype, causing unexpected behavior or enabling prototype pollution vectors.
**Prevention:** Always explicitly block prototype keys (`__proto__`, `constructor`, `prototype`) when iterating over and assigning properties from user-provided objects.
