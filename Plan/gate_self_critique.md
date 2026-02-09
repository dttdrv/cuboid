# Cuboid Overhaul Self-Critique Log

## Gate A (Design System Rewrite)
### Scores
- Visual coherence: 4/5
- UX clarity: 4/5
- Reliability: 3/5
- Security: 3/5
- Parity: 3/5

### Top weaknesses
1. Global `border-radius: 0 !important` in `src/index.css` is strict but blunt and may over-constrain third-party widgets.
2. Some legacy aliases (`btn-pill-*`, `input-pill`) remain in `src/index.css` for compatibility and should be removed after final migration.
3. Not all older utility classes have been audited with automated style-policy linting yet.

### Remediation applied
- Added tokenized primitives and migrated all high-traffic screens/components.
- Added gate and threshold docs for explicit follow-up checks.

## Gate B (Core UI Overhaul)
### Scores
- Visual coherence: 4/5
- UX clarity: 4/5
- Reliability: 3/5
- Security: 3/5
- Parity: 4/5

### Top weaknesses
1. `src/ui/EditorPage.tsx` remains a very large component and should be split by panel concern.
2. Some hard-coded styling fragments remain (`bg-black/30`) and should be tokenized in a cleanup pass.
3. Browser automation re-capture is still pending for deterministic before/after evidence.

### Remediation applied
- Migrated `Dashboard`, `EditorPage`, `MonacoEditor`, and `PdfViewer` to shared square-edge classes.

## Gate C (Secondary UI Consistency)
### Scores
- Visual coherence: 4/5
- UX clarity: 4/5
- Reliability: 3/5
- Security: 3/5
- Parity: 3/5

### Top weaknesses
1. Naming legacy (`PillInput`) persists even after visual migration.
2. `CenterCard` still uses broad shadow usage and may need a flatter variant for strict minimalism.
3. Unlock flow UX is newly introduced and not yet user-tested.

### Remediation applied
- Migrated auth/workspace/modals/shared controls to common design primitives.

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
