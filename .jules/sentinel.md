## 2025-02-12 - Missing Rate Limiting on Expensive Endpoints
**Vulnerability:** AI and Compilation endpoints exposed without rate limits, allowing potential DoS and API quota exhaustion.
**Learning:** The `server.ts` handles raw request routing without middleware, requiring manual injection of security controls into the `deps` object.
**Prevention:** Ensure all resource-intensive handlers check a rate limiter injected via `deps` before processing.
