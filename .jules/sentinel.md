## 2025-02-28 - Missing Rate Limits on AI and Compile Endpoints
**Vulnerability:** The application was missing rate limits on sensitive endpoints (`/v1/ai/*`, `/v1/compile/jobs`, `/v1/projects`), exposing it to application-level DoS attacks and potential API quota exhaustion.
**Learning:** The application uses a custom, lightweight `node:http` backend rather than a standard web framework like Express. Because of this architectural choice, standard rate limiting middleware packages couldn't simply be dropped in.
**Prevention:** We must explicitly design and inject security controls (like the `RateLimiter` class) into the dependency injection object (`deps`) and manually verify the client IP from raw socket and proxy headers in the custom request handler.
