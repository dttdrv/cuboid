## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2024-05-24 - [Prototype Pollution in AI Router]
**Vulnerability:** The `mergeExtraBody` function in `backend/src/services/aiRouter.ts` merged user-provided JSON (`extraBody`) into a `payload` object. While it filtered out some blocked keys like `model`, `messages`, and `stream`, it failed to block `__proto__`, `constructor`, and `prototype`, making the application vulnerable to prototype pollution when `payload[key] = value` was executed.
**Learning:** When merging objects from user input, filtering only known application-specific keys is insufficient; JavaScript prototype-related keys must always be explicitly denied to prevent prototype pollution attacks.
**Prevention:** Always block sensitive JavaScript keys like `__proto__`, `constructor`, and `prototype` when performing object merging or assigning properties dynamically using user-supplied keys.
