# Cuboid Overhaul Self-Critique Log

## Gate A (Design System Rewrite)
### Scores
- Visual coherence: 4/5
- UX clarity: 4/5
- Reliability: 4/5
- Security: 3/5
- Parity: 4/5

### Top weaknesses
1. Global `border-radius: 0 !important` in `src/index.css` is strict but blunt and may over-constrain third-party widgets.
2. Token usage still needs a full scan across older/auth/settings screens for ad-hoc exceptions.
3. Shadow density on some card surfaces is still heavier than target minimalism.

### Remediation applied
- Added tokenized primitives and migrated all high-traffic screens/components.
- Removed alias classes (`btn-pill-*`, `input-pill`, `selection-pill`, `center-card`) from `src/index.css`.

## Gate B (Core UI Overhaul)
### Scores
- Visual coherence: 4/5
- UX clarity: 4/5
- Reliability: 4/5
- Security: 3/5
- Parity: 4/5

### Top weaknesses
1. `src/ui/EditorPage.tsx` is now orchestration-only but still carries complex compile/action state that may need hook extraction.
2. New shell needs broader real-user validation for navigation density and cognitive load.
3. Browser automation re-capture is still pending for deterministic before/after evidence.

### Remediation applied
- Added new shell component architecture in `src/ui/editor-shell/*` and removed duplicated action surfaces.
- Reworked dashboard IA toward `Continue with AI` and `New agentic session`.

## Gate C (Secondary UI Consistency)
### Scores
- Visual coherence: 4/5
- UX clarity: 4/5
- Reliability: 3/5
- Security: 3/5
- Parity: 3/5

### Top weaknesses
1. Settings and modals are not yet fully normalized to the new shell rhythm.
2. `PillInput` naming remains legacy even though styling is migrated.
3. Unlock flow UX still needs user validation in the new navigation context.

### Remediation applied
- Updated `CenterCard` primitive to `surface-card`.
- Kept consistency work tracked as explicit remaining scope in roadmap.

## Gate D (Core/Backend Operational Refactor)
### Scores
- Visual coherence: 3/5
- UX clarity: 4/5
- Reliability: 4/5
- Security: 4/5
- Parity: 3/5

### Top weaknesses
1. Deterministic local user IDs in `src/core/storage/local.ts` remain a known risk.
2. Social/email key derivation strategy in `src/core/auth/AuthProvider.tsx` is pragmatic for local-first but not production-grade auth crypto.
3. Adapter boundaries are in place but not fully consumed by every future-facing module.

### Remediation applied
- Added `DataStore`, `AuthService`, `CompileService`, `CryptoVault`, provider-id normalization, and parity/gate data types.
- Fixed magic-link token enforcement and tex compiler self-import smell.
- Resolved HKDF extractability regression and made session-key wrapping non-fatal for sign-in continuity.
- Added compile trigger/state/meta modeling for deterministic queued compile behavior.

## Gate E (Security Hardening)
### Scores
- Visual coherence: 3/5
- UX clarity: 3/5
- Reliability: 3/5
- Security: 4/5
- Parity: 3/5

### Top weaknesses
1. Session handling remains client-side and local-first; true server-grade session hardening is deferred.
2. AI interaction logs are still persisted locally, though reduced in sensitivity.
3. Collaboration signaling still defaults to public host allowlist pending dedicated infrastructure.

### Remediation applied
- Added encrypted AI key vault storage and local egress controls.
- Removed remote compile worker script import path.
- Added CSP baseline in `index.html` and serving-layer header guidance docs.
- Aligned editor runtime with local CSP by loading Monaco from local assets.

## Gate F (Prism Core + Near-Term Parity)
### Scores
- Visual coherence: 3/5
- UX clarity: 3/5
- Reliability: 3/5
- Security: 3/5
- Parity: 3/5

### Top weaknesses
1. Several parity items are intentionally `Local Stub` and need backend-era implementations.
2. Evidence capture is documentation-based pending runnable browser/test toolchain.
3. Parity status should be connected to runtime telemetry once available.

### Remediation applied
- Added `Plan/prism_parity_matrix.md` with `Implemented`/`Local Stub`/`Deferred` coverage.
- Reoriented primary editing flow toward agent-led composer model.
