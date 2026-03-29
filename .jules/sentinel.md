## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Prototype Pollution in Object Merging]
**Vulnerability:** In `backend/src/services/aiRouter.ts`, the `mergeExtraBody` function copied properties from a user-provided JSON payload `extraBody` into a target object `payload` without explicitly filtering out `__proto__`, `constructor`, or `prototype` keys. This could allow an attacker to pollute the prototype chain of the target object.
**Learning:** Functions that merge or copy properties from user-provided objects (especially JSON-parsed bodies) must proactively block or filter keys that can manipulate object prototypes (`__proto__`, `constructor`, `prototype`) to prevent Prototype Pollution vulnerabilities.
**Prevention:** Always explicitly define a blocklist of dangerous keys, or safely construct objects using `Object.create(null)` when accepting arbitrary key-value pairs from external inputs.
