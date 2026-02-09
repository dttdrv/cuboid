# Cuboid Project Plan

Last updated: 2026-02-10

## Protocol
`Alpha Prime`

## Program Objective
Deliver a local-first Prism-direction writing platform with:
1. Strict hard-square industrial UI consistency.
2. User-controlled assistant/agent behavior (agentic when explicitly needed, assistive by default).
3. Hardened local security posture with explicit boundaries for later cloud-era integration.

## Canonical Artifacts
- `Plan/acceptance_thresholds.md`
- `Plan/gate_scorecard.md`
- `Plan/gate_self_critique.md`
- `Plan/prism_parity_matrix.md`
- `Plan/prism_parity_checklist.md`
- `Plan/security_headers_and_csp.md`
- `Plan/baseline_behavior_map.md`

## Current Status Snapshot
- Program phase: `overhaul_phase_execution_in_review`
- Delivery model: phased gates (A-F), each with mandatory critique
- Runtime mode: local-first with explicit parity stubs for deferred distributed/cloud capabilities
- Agent direction: narrow assistant/agent boundary with user-controlled escalation of autonomy

## External Prism Benchmark Notes
- Verified benchmark URL: `https://openai.com/prism` (reachable on 2026-02-10 UTC)
- Legacy/unstable benchmark URL from prior plan: `https://openai.com/index/prism` (returned `404` when checked on 2026-02-10 UTC)
- Change-tracking source: `https://help.openai.com/en/articles/6825453-chatgpt-release-notes`
- Planning implication: parity should track capabilities/UX patterns, not a single unstable URL path.

## Gate Progress (Execution Complete, Evidence Closure Pending)
- Gate A (design system rewrite): implemented, `IN_REVIEW`
- Gate B (core UI overhaul): implemented, `IN_REVIEW`
- Gate C (secondary UI consistency): implemented, `IN_REVIEW`
- Gate D (core/backend operational refactor): implemented, `IN_REVIEW`
- Gate E (security hardening): implemented, `IN_REVIEW`
- Gate F (Prism parity matrix + checklist): implemented, `IN_REVIEW`

## Completed Work (Consolidated)
### UI System and Product Surfaces
- Enforced square-edge visual language and tokenized primitives in `src/index.css` plus `tailwind.config.js` radius normalization.
- Reworked primary surfaces (`Dashboard`, `EditorPage`, `MonacoEditor`, `PdfViewer`) to consistent shell/rail/toolbar patterns.
- Reworked secondary surfaces (auth/workspace/components/modals/consent/AI command palette) for visual and interaction consistency.
- Added unlock-session route and flow to separate locked-state recovery from sign-in.

### Core/Backend Boundaries and Correctness
- Added explicit contracts/adapters: `DataStore`, `AuthService`, `CompileService`, `CryptoVault`.
- Standardized AI provider ID normalization (`AIProviderId`) and activation behavior.
- Fixed magic-link token validation and removed tex compiler self-import/type smell.
- Consolidated compile worker path toward local trusted assets.

### Security and Reliability
- Added encrypted-at-rest vault flow for provider keys in local mode.
- Added explicit AI egress controls and CSP baseline guidance.
- Removed remote compile `importScripts` dependency path in worker flow.
- Resolved sign-in regression caused by HKDF extractability mismatch.
- Made wrapped master-key persistence best-effort/non-fatal.
- Added admin mode entry path for local testing continuity.

## Verification Evidence (Most Recent)
### Build
- Command: `set PATH=C:\Progra~1\nodejs;%PATH% && C:\Progra~1\nodejs\npm.cmd run build`
- Result: pass
- Timestamp: 2026-02-10 (local session)

### Tests
- Command: `set PATH=C:\Progra~1\nodejs;%PATH% && C:\Progra~1\nodejs\npm.cmd test -- --run`
- Result: pass
- Detail: 4 files, 10 tests passed
- Timestamp: 2026-02-10 (local session)

### Local Preview Reachability
- Endpoint check: `http://127.0.0.1:4173`
- HTTP check result: `200 OK`
- Port status: listener present on `127.0.0.1:4173`
- Operational note: if `4173` is already occupied, run dev server on alternate port to avoid false startup failures.

## Active Risks
1. Some gates are still documentation-verified rather than full browser-automation verified.
2. Local auth model remains intentionally simplified and not production-grade for multi-tenant cloud deployment.
3. Legacy style alias cleanup is incomplete until final consumer migration is fully validated.
4. Prism parity benchmark path is not fully stable across OpenAI URL structures; matrix must stay source-audited.

## Remaining Work Before Marking Gates `PASSED`
1. Capture fresh post-overhaul screenshots in `showcase/after` tied to gate evidence lines.
2. Run full responsive QA pass and split oversized modules (notably `src/ui/EditorPage.tsx`).
3. Finish removal of compatibility aliases once no call sites remain.
4. Tighten local auth identity/session assumptions for fewer edge-case failures.
5. Convert each gate from `IN_REVIEW` to `PASSED` only after evidence and critique remediation are both updated.

## Direction While User Tests
1. Keep assistant/agent line thin: user remains in control of autonomy level and action scope.
2. Prioritize sign-in/session reliability and preview startup predictability first.
3. Continue local-first with explicit stubs/contracts for deferred parity items until backend expansion is approved.
