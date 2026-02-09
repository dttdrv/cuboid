# Cuboid Roadmap + Changelog

Last updated: 2026-02-10
Purpose: meticulous execution history plus forward roadmap while recovery implementation is under active user validation.

## 1) Program Snapshot
- Product direction: Prism-style AI-native writing flow with explicit user control.
- Runtime mode: local-first.
- Program phase: `p0_recovery_implemented_in_validation`.
- Current gate posture: A-F implemented at least once, now in targeted re-validation after hard reset.
- External benchmark status:
  - `https://openai.com/prism` reachable (checked 2026-02-10)
  - `https://openai.com/index/prism` still unstable (`404` observed 2026-02-10)

## 2) Health Snapshot
### Build
- Command: `set PATH=C:\Progra~1\nodejs;%PATH% && C:\Progra~1\nodejs\npm.cmd run build`
- Status: pass
- Verified: 2026-02-10

### Tests
- Command: `set PATH=C:\Progra~1\nodejs;%PATH% && C:\Progra~1\nodejs\npm.cmd test -- --run`
- Status: pass
- Verified: 2026-02-10
- Result: 4 test files, 10 tests passing

### Typecheck
- Command: `set PATH=C:\Progra~1\nodejs;%PATH% && C:\Progra~1\nodejs\npx.cmd tsc --noEmit`
- Status: fail (pre-existing strict-type baseline issues in legacy core/worker files)
- Impact: does not block Vite build/test but blocks strict TS hygiene closure.

### Local serving status
- Port `4173`: occupied by existing process in this environment.
- Active validated server: `http://127.0.0.1:4174`
- Probe result: `HTTP 200` (2026-02-10)

## 3) Completed Work (Detailed)
### P0 hard reset implementation
- Replaced monolithic editor layout with shell-based composition:
  - `src/ui/editor-shell/EditorShell.tsx`
  - `src/ui/editor-shell/LeftRail.tsx`
  - `src/ui/editor-shell/ComposerPane.tsx`
  - `src/ui/editor-shell/ArtifactPane.tsx`
  - `src/ui/editor-shell/RunStatusBar.tsx`
  - `src/ui/editor-shell/RightDrawer.tsx`
  - `src/ui/editor-shell/contracts.ts`
- Rebuilt `src/ui/EditorPage.tsx` as orchestration container with persistent UI session state.

### Compile and operation behavior
- Added compile trigger/state/meta types in `src/core/compile/types.ts`.
- Implemented hybrid compile flow (auto debounce + manual) with queue semantics.
- Added first actionable compile error jump logic and activity logging integration.

### Reliability and runtime fixes
- Stabilized Monaco runtime loading with local loader path in `src/ui/editor/MonacoEditor.tsx`.
- Added local Monaco assets under `public/monaco/vs`.
- Removed ambiguous editor loading dead-state by adding explicit loading fallback.

### Dashboard direction correction
- Reworked `src/ui/Dashboard.tsx` to emphasize:
  - `Continue with AI`
  - `New agentic session`
- Reduced header control clutter by compacting filter/sort controls.

### Design system debt reduction
- Removed legacy alias classes from `src/index.css`:
  - `btn-pill-primary`, `btn-pill-secondary`, `btn-pill-tertiary`
  - `input-pill`, `selection-pill`, `center-card`
- Updated `src/ui/components/CenterCard.tsx` to `surface-card`.

### New type surfaces
- Added:
  - `src/core/editor/types.ts`
  - `src/core/ai/agenticTypes.ts`
- Extended:
  - `src/core/data/types.ts` with `UiSessionState`

## 4) Critical Incident Log
### 2026-02-10: direction mismatch and clutter correction
- Symptom: editor perceived as cluttered, non-sensical, not working reliably.
- Root cause cluster:
  1. Monolithic editor component ownership.
  2. Duplicated control surfaces with no hierarchy.
  3. AI workflow treated as secondary tab instead of primary interaction model.
- Resolution:
  1. P0 shell split and orchestration rewrite.
  2. Compile state machine + debounce queue.
  3. Agent-led composer centralization with explicit apply/reject flow.

### 2026-02-10: Monaco mount reliability under CSP/local mode
- Symptom: editor could present prolonged loading behavior in strict runtime contexts.
- Fix:
  1. Forced local loader path (`/monaco/vs`) in Monaco setup.
  2. Shipped local monaco assets in `public/monaco/vs`.
  3. Added deterministic loading fallback UI.

### 2026-02-10: 4173 port collision while serving
- Symptom: user requested run but strict port startup failed.
- Findings:
  1. `4173` already bound by another node process.
  2. Launching on `4174` succeeds and serves expected app.
- Operational handling:
  1. keep 4173 collision note in docs,
  2. default to alternate explicit port when occupied.

## 5) Roadmap (Next 3 Sprints)
### Sprint 1: Validation and gate evidence closure
1. Capture fresh screenshots for new shell in `showcase/after`.
2. Close Gate B with user-validated workflow feedback.
3. Close Gate A/C after final style and modal consistency checks.

### Sprint 2: Agentic UX polish
1. Improve proposal explainability and action trace quality.
2. Refine right-drawer interaction density and information hierarchy.
3. Add richer activity timeline grouping and filters.

### Sprint 3: Technical debt and strictness closure
1. Resolve pre-existing `tsc --noEmit` failures in core/worker paths.
2. Finalize menu/modal/settings consistency pass.
3. Re-run full validation matrix and mark eligible gates `PASSED`.

## 6) Immediate Priorities While User Tests
1. Collect concrete UX friction notes from live testing.
2. Patch high-friction interaction points first (navigation, compile feedback, drawer friction).
3. Keep docs synchronized after every material UI/flow change.

## 7) Compact Changelog
### 2026-02-10
- Implemented P0 hard-reset editor shell architecture with agent-led composer center.
- Rewrote `EditorPage` orchestration with compile queue/debounce model and UI session persistence.
- Added local Monaco loader path and shipped `public/monaco/vs` assets.
- Reworked dashboard toward `Continue with AI` and `New agentic session` actions.
- Removed deprecated alias style classes and migrated card primitive naming.
- Verified build/tests pass and documented active runtime link on `127.0.0.1:4174`.

### 2026-02-09 to 2026-02-10 (prior)
- Completed multi-phase overhaul scaffolding, sign-in incident fixes, parity artifacts, and security/docs baseline updates.
