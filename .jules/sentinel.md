## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - Prototype Pollution in `mergeExtraBody`
**Vulnerability:** In `backend/src/services/aiRouter.ts`, the `mergeExtraBody` function directly merged an untrusted `extraBody` object into the request payload. It blocked `model`, `messages`, and `stream`, but it allowed sensitive prototype properties (`__proto__`, `constructor`, `prototype`). This could have led to Prototype Pollution if an attacker crafted a payload with these keys.
**Learning:** Although `blocked` keys check for exact property names, it didn't include JavaScript's internal mechanism properties that dictate object creation. Even if `isPlainObject` is used to filter, it does not stop standard property merging logic from executing if prototype keys are submitted.
**Prevention:** To prevent this, include `__proto__`, `constructor`, and `prototype` in the `blocked` Set.
