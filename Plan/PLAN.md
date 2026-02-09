# Cuboid Project Plan

Last updated: 2026-02-10

## Protocol
`Alpha Prime`

## Program Objective
Ship a local-first Prism-direction writing environment with:
1. A clear agent-led workflow shell that preserves explicit user control.
2. Hard-square visual consistency across all product surfaces.
3. Reliable compile/editor/session behavior before deep feature expansion.

## Canonical Artifacts
- `Plan/acceptance_thresholds.md`
- `Plan/gate_scorecard.md`
- `Plan/gate_self_critique.md`
- `Plan/prism_parity_matrix.md`
- `Plan/prism_parity_checklist.md`
- `Plan/security_headers_and_csp.md`
- `Plan/baseline_behavior_map.md`

## External Reference Baseline
- Prism page (re-validated 2026-02-10): `https://openai.com/prism`
- Legacy Prism URL (still unstable/404 when checked 2026-02-10): `https://openai.com/index/prism`
- Change tracker: `https://help.openai.com/en/articles/6825453-chatgpt-release-notes`

## Current Program Status
- Program phase: `p0_recovery_implemented_in_validation`
- Delivery posture: hard-reset core shells first, then consistency polish and deferred seams
- Runtime model: local-first
- Agent model: assistant/agent boundary is thin and explicitly user-scoped

## Latest Implementation Slice (This Session)
### Editor architecture reset
- Rebuilt `src/ui/EditorPage.tsx` as orchestration container.
- Added shell surfaces:
  - `src/ui/editor-shell/EditorShell.tsx`
  - `src/ui/editor-shell/LeftRail.tsx`
  - `src/ui/editor-shell/ComposerPane.tsx`
  - `src/ui/editor-shell/ArtifactPane.tsx`
  - `src/ui/editor-shell/RunStatusBar.tsx`
  - `src/ui/editor-shell/RightDrawer.tsx`
  - `src/ui/editor-shell/contracts.ts`

### Compile/reliability reset
- Added compile run typing for trigger/state/meta in `src/core/compile/types.ts`.
- Implemented queued + debounced auto compile model in `src/ui/EditorPage.tsx`:
  - states: `idle`, `queued`, `compiling`, `success`, `error`
  - triggers: `auto`, `manual`, `retry`
  - debounce: 1200ms
- Added first-actionable diagnostic jump on compile failure.

### Monaco stability under CSP/local runtime
- Configured local Monaco loader path in `src/ui/editor/MonacoEditor.tsx`.
- Added local Monaco runtime assets under `public/monaco/vs`.
- Added explicit editor loading fallback UI.

### Dashboard direction reset
- Reworked `src/ui/Dashboard.tsx` to foreground:
  - `Continue with AI`
  - `New agentic session`
- Collapsed low-value sort/filter controls into compact combined selector.

### Design debt cleanup
- Removed deprecated alias utilities from `src/index.css`:
  - `btn-pill-primary`
  - `btn-pill-secondary`
  - `btn-pill-tertiary`
  - `input-pill`
  - `selection-pill`
  - `center-card`
- Replaced card primitive usage in `src/ui/components/CenterCard.tsx` with `surface-card`.

### Types/contracts added
- `src/core/editor/types.ts`
- `src/core/ai/agenticTypes.ts`
- `src/ui/editor-shell/contracts.ts`
- Extended `src/core/data/types.ts` with `UiSessionState`.

## Verification Evidence
### Build
- Command: `set PATH=C:\Progra~1\nodejs;%PATH% && C:\Progra~1\nodejs\npm.cmd run build`
- Result: pass
- Timestamp: 2026-02-10

### Tests
- Command: `set PATH=C:\Progra~1\nodejs;%PATH% && C:\Progra~1\nodejs\npm.cmd test -- --run`
- Result: pass
- Detail: 4 files, 10 tests passed
- Timestamp: 2026-02-10

### Serve status
- `4173`: occupied by existing process in this environment.
- Active validated dev URL: `http://127.0.0.1:4174` (`HTTP 200`, checked 2026-02-10).

### Strict typing status
- `npx tsc --noEmit` currently reports pre-existing strict-type errors in legacy core/worker files outside this UI recovery slice.

## Gate Progress
- Gate A (design system rewrite): `IN_REVIEW` (major cleanup done, full cross-screen audit pending)
- Gate B (core UI overhaul): `IN_REVIEW` (new shell shipped, requires user validation pass)
- Gate C (secondary consistency): `IN_REVIEW` (menu/modal/settings normalization still partial)
- Gate D (operational correctness): `IN_REVIEW` (compile/session flow improved, full edge-case pass pending)
- Gate E (security hardening): `IN_REVIEW`
- Gate F (Prism parity program): `IN_REVIEW`

## Remaining Work Before Gate Closures
1. Capture fresh `showcase/after` screenshots for new agent-led shell.
2. Run manual UX pass for composer/editor/preview flow transitions.
3. Finish menu/modal/settings consistency sweep (P1.2 scope).
4. Resolve pre-existing strict TypeScript errors to restore `tsc --noEmit` green status.
5. Update gate artifacts from `IN_REVIEW` to `PASSED` only with explicit evidence.

## Direction While User Tests
1. Keep tightening “AI-native but user-controlled” behavior.
2. Prioritize functional trust (editor mounts, compile determinism, session continuity) over feature breadth.
3. Keep deferred features (`Image to LaTeX`, `Voicemode`) visible but explicitly non-primary until implemented.
