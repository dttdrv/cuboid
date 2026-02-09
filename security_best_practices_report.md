# Security Best Practices Report - Cuboid (Frontend/React/TypeScript) 

## Executive Summary
This audit focused on local-first frontend patterns and React/TypeScript security posture. The primary risks are secrets and session tokens persisted in `localStorage`, and third-party code execution paths (CDN-loaded worker script, public WebRTC signaling). These are exploitable if an attacker gains XSS or if a dependency or CDN is compromised. Production hardening (CSP/security headers) is not visible in the repo and should be verified at the edge/runtime.

## Critical Findings
None identified in the current frontend code.

## High Findings

### F1 - Client-stored API keys (localStorage) and direct browser calls to Mistral
- Rule ID: REACT-CONFIG-001, JS-STORAGE-001
- Severity: High
- Location: `C:\Users\deyan\Projects\Cuboid\src\core\ai\AIService.ts:48`, `C:\Users\deyan\Projects\Cuboid\src\core\ai\AIService.ts:59`, `C:\Users\deyan\Projects\Cuboid\src\core\ai\AIService.ts:125`, `C:\Users\deyan\Projects\Cuboid\src\core\ai\providers\MistralProvider.ts:48`
  - AI config is read/written from `localStorage` and `apiKeys` persisted.
- Evidence:
  - `Authorization: Bearer ${this.apiKey}` is sent from the browser.
- Impact: Any XSS, malicious extension, or shared device access can exfiltrate API keys, enabling account takeover of the AI provider and billing abuse.
- Fix: Move AI requests to a backend/BFF and keep provider keys server-side. If staying local-first, store keys only in memory or encrypt at rest with a key derived from the user password (WebCrypto) and require re-entry each session.
- Mitigation: Apply strict CSP, reduce third-party script surface, and provide an opt-out toggle for key persistence.
- False positive notes: If this is intentionally a purely local app and keys are user-supplied and ephemeral, document the risk and avoid persistence.

### F2 - Session tokens persisted in `localStorage`
- Rule ID: JS-STORAGE-001
- Severity: High
- Location: `C:\Users\deyan\Projects\Cuboid\src\core\storage\local.ts:105`, `C:\Users\deyan\Projects\Cuboid\src\core\storage\local.ts:106`, `C:\Users\deyan\Projects\Cuboid\src\core\storage\local.ts:111`
- Evidence:
  - `access_token` / `refresh_token` are stored in a session object and persisted to `localStorage`.
- Impact: Any XSS or malicious extension can steal tokens and impersonate the user. This risk scales to full account takeover if real auth is used.
- Mitigation: Short-lived tokens, re-authentication on sensitive actions, and a strict CSP.
- Fix: Use HTTP-only, same-site cookies for sessions (if server-backed), or keep session in memory only. For local-first offline flows, encrypt session at rest with a key derived from the user password and rotate on sign-out.
- False positive notes: If the local adapter is only a demo and never handles real credentials, document it and ensure production adapters do not persist tokens in `localStorage`.

## Medium Findings

### F3 - Worker loads SwiftLaTeX engine from CDN without integrity controls
- Rule ID: JS-SUPPLY-001, JS-SRI-001
- Severity: Medium
- Location: `C:\Users\deyan\Projects\Cuboid\src\workers\tex-worker.ts:44`
- Evidence:
  - `importScripts('https://cdn.jsdelivr.net/npm/swiftlatex@0.0.2/PdfTeXEngine.js');`
- Impact: If the CDN is compromised or a network attacker can tamper with the script, arbitrary code runs in the origin (worker still has access to same-origin storage via messaging and can exfiltrate data).
- Fix: Bundle the worker dependency locally and serve from your own origin. Alternatively, download and pin the script with hash verification before execution (requires custom loader).
- Mitigation: Strict CSP `script-src 'self'` and eliminate remote `importScripts` in production.
- False positive notes: If this is dev-only, gate the CDN load behind a dev flag and ship a local asset for production.

### F4 - Public WebRTC signaling server for collaboration
- Rule ID: REACT-3P-001 (Third-party services), REACT-NET-001
- Severity: Medium
- Location: `C:\Users\deyan\Projects\Cuboid\src\core\collab\CollaborationManager.ts:23`
- Evidence:
  - `signaling: ['wss://signaling.yjs.dev']`
- Impact: Room metadata and connection info are exposed to a public third-party service. If room names/passwords are guessable or reused, unauthorized peers may join or observe traffic patterns.
- Fix: Self-host the signaling server, enforce strong random room IDs, and keep encryption keys separate from room names. Consider authenticated signaling for private workspaces.
- Mitigation: Rotate room identifiers and require explicit user confirmation before joining sessions.
- False positive notes: If collaboration is only used for public or demo content, document the privacy tradeoff.

### F5 - AI prompts and interaction logs stored in `localStorage`
- Rule ID: JS-STORAGE-001
- Severity: Medium
- Location: `C:\Users\deyan\Projects\Cuboid\src\core\ai\AIService.ts:70`, `C:\Users\deyan\Projects\Cuboid\src\core\ai\AIService.ts:77`
- Evidence:
  - Interaction logs (prompt + completion preview) are persisted in `localStorage`.
- Impact: Sensitive user content can be exfiltrated via XSS or on shared devices; long-term retention increases exposure.
- Fix: Store logs in memory only by default, add explicit opt-in, and/or encrypt at rest using a key derived from the user password.
- Mitigation: Cap retention tightly and provide a clear-logs UI.
- False positive notes: If prompts are guaranteed non-sensitive in this deployment, document this assumption.

### F6 - CSP/security headers not visible in repo
- Rule ID: REACT-HEADERS-001, JS-CSP-001
- Severity: Medium
- Location: `C:\Users\deyan\Projects\Cuboid\index.html:1`, `C:\Users\deyan\Projects\Cuboid\vite.config.ts:1`
- Evidence:
  - No CSP meta tag or header configuration is present in repo code.
