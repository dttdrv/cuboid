## 2024-05-24 - [Path Traversal in API]
**Vulnerability:** API endpoints in `backend/src/server.ts` taking user input (`projectId`, `jobId`) were directly joined with paths using `join` in `backend/src/store/localStore.ts` without proper sanitization. This allowed attackers to escape the project directory context and overwrite or read arbitrary files by sending payload containing `../` sequences.
**Learning:** Even internal backend services handling project resources must securely sanitize all parameter values used for file operations to prevent path traversal outside expected boundaries.
**Prevention:** Always use safe path sanitization utilities, like the implemented `safeJoin` and `toSafeRelativePath` in `backend/src/utils/path.ts`, to securely construct file paths and ensure the final path remains within the intended boundaries.

## 2025-03-01 - [Prevent Token Leakage via sessionStorage Fallback]
**Vulnerability:** `src/core/storage/local.ts` fell back to persistent `localStorage` when `sessionStorage` was unavailable, leaking sensitive short-lived tokens to disk.
**Learning:** Fallbacks must respect the security properties of the original storage mechanism. Additionally, using a module-level singleton for an in-memory fallback creates a severe cross-request data leak vulnerability in Server-Side Rendering (SSR) environments.
**Prevention:** Implement a localized `MemoryStorage` class that instantiates per-session or avoids module-scoped singletons to ensure data isolation. Never downgrade volatile storage to persistent storage.
