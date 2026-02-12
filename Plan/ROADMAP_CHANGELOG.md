# Cuboid Roadmap + Changelog

Last updated: 2026-02-10
Purpose: meticulous execution history plus forward roadmap while backend-first competitor implementation is in active validation.

## 1) Program Snapshot
- Product direction: backend-first local-first Prism/Crixet-class writing environment with explicit user control.
- Runtime mode: local-first.
- Program phase: `p1_backend_foundation_implemented_in_validation`.
- Current gate posture: UI recovery complete enough for baseline, now shifted to backend ownership and reliability closure.
- External benchmark status:
  - `https://openai.com/prism` reachable (checked 2026-02-10)
  - `https://openai.com/index/prism` still unstable (`404` observed 2026-02-10)

## 2) Health Snapshot
### Build
- Command: `set PATH=C:\Progra~1\nodejs;%PATH% && C:\Progra~1\nodejs\npm.cmd run build`
- Status: pass
- Verified: 2026-02-10

### Backend build
- Command: `set PATH=C:\Progra~1\nodejs;%PATH% && C:\Progra~1\nodejs\npm.cmd run build:backend`
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
- Frontend validated server: `http://127.0.0.1:4174` (`HTTP 200`)
- Backend validated server: `http://127.0.0.1:4317/v1/health` (`HTTP 200`)

## 3) Completed Work (Detailed)
### Backend-first foundation
- Added local control plane under `backend/src` with `/v1/*` API surface:
  - health, projects/files, compile jobs/events, AI endpoints, settings and AI toggle
- Added compile queue orchestration service:
  - `backend/src/services/compileQueue.ts`
- Added local filesystem storage model under `~/.cuboid`:
  - projects, compile jobs/events, build artifacts, settings
- Added encrypted local secret store:
  - `backend/src/services/secrets.ts`
- Added AI policy gate with hard AI disable behavior:
  - `backend/src/services/aiRouter.ts`

### Rust compile worker path
- Added Rust worker crate:
  - `backend/rust/compile_worker/Cargo.toml`
  - `backend/rust/compile_worker/src/main.rs`
- Worker invocation model wired from TypeScript backend.
- Compile command path: `latexmk` with timeout and JSON result envelope.

### Frontend integration with backend
- Added backend API client:
  - `src/core/backend/client.ts`
- Rewired compile flow in editor to backend compile jobs:
  - `src/ui/EditorPage.tsx`
- Added backend-driven AI ON/OFF toggle in composer:
  - `src/ui/editor-shell/ComposerPane.tsx`
  - `src/ui/editor-shell/contracts.ts`

### Research package initialized
- Added:
  - `research/prism_crixet_feature_matrix.md`
  - `research/stack_alternatives_matrix.md`
  - `research/moat_and_differentiation.md`
  - `research/funding_narrative_mistral.md`
  - `research/source_log.md`

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

## 5) Roadmap (Next Phases)
### Phase A: Backend ownership closure
1. Route all project/file interactions through backend APIs.
2. Remove remaining frontend-local compile assumptions.
3. Add robust compile event polling/streaming in editor UX.

### Phase B: Compile hardening and parity
1. Harden Rust worker for multi-file/bibliography-heavy project cases.
2. Implement queue bounds, cancellation semantics, retry policy.
3. Add compile fixture suite and failure-classification tests.

### Phase C: AI router hardening (NVIDIA-first, provider-agnostic)
1. Harden NVIDIA response normalization and error handling (`/v1/chat/completions`).
2. Document model ID flexibility and keep it user-configurable.
3. Expand AI policy + redaction test coverage (AI OFF blocks all outbound calls).
4. Introduce explicit provider adapter interface so OpenRouter/direct providers can be added later without refactor.
5. Add multimodal request support path for models that accept images (OpenAI-compatible content arrays).

### Phase D: Prism-ahead parity closure (backend-first)
1. SyncTeX pipeline for “go to PDF / go to LaTeX” navigation.
2. Project context index (labels/refs graph, citations list, section graph).
3. Compiler-log-aware diagnostics enrichment (AI optional).
4. Import parity (zip/folder) and “move selection to subfile” refactor proposals.
5. Comments persistence (local-only v1; cloud deferred).

### Phase E: Research dossier completion
1. Complete verified/inferred/unknown matrix by subsystem.
2. Finalize alternatives pass/fail and technical selection evidence.
3. Finalize partner-focused positioning and funding narrative pack.

### Phase F: UI re-polish only after backend gates
1. Keep simple 3-pane editor.
2. Improve compile diagnostics affordances and AI toggle clarity.
3. Delay non-core UI complexity until backend acceptance criteria pass.

### Phase G: Cloud-ready option (post-local v1, Cloudflare/VPS-friendly)
1. Containerize compile worker and enforce strict sandboxing and quotas.
2. Split services (API, worker pool, artifact store).
3. Add object storage integration for projects/artifacts (Cloudflare R2 or S3).
4. Add DB when multi-user lands (Postgres/SQLite).
5. Add auth + invites + permissions.

## 6) Immediate Priorities While User Tests
1. Collect concrete UX friction notes from live testing.
2. Patch high-friction interaction points first (navigation, compile feedback, drawer friction).
3. Keep docs synchronized after every material UI/flow change.

## 7) Compact Changelog
### 2026-02-10
- Implemented backend-first control plane (`backend/src`) with `/v1/*` API surface.
- Added Rust compile worker scaffold and queue integration path (`backend/rust/compile_worker`).
- Rewired frontend editor compile flow to backend jobs (`src/core/backend/client.ts`, `src/ui/EditorPage.tsx`).
- Added backend policy-driven AI ON/OFF toggle path in composer.
- Added research dossier baseline docs under `research/`.
- Verified `build:backend`, `build`, `test`, and backend health endpoint.

### 2026-02-10 (later)
- Completed backend ownership for core editor loop:
  - Dashboard lists/creates projects via backend (`/v1/projects`).
  - Editor loads/saves `main.tex` via backend file endpoints.
- Added backend file read endpoint:
  - `GET /v1/projects/:id/files/:path`
- Added compile cancellation endpoint + bounded queue:
  - `PUT /v1/compile/jobs/:id/cancel`
- Added `scripts/validate_local.ps1` local validation runbook (health, settings, AI-off gate, project create, file read).

### 2026-02-10 (earlier)
- Implemented P0 hard-reset editor shell architecture with agent-led composer center.
- Rewrote `EditorPage` orchestration with compile queue/debounce model and UI session persistence.
- Added local Monaco loader path and shipped `public/monaco/vs` assets.
- Reworked dashboard toward `Continue with AI` and `New agentic session` actions.
- Removed deprecated alias style classes and migrated card primitive naming.
- Verified build/tests pass and documented active runtime link on `127.0.0.1:4174`.

### 2026-02-09 to 2026-02-10 (prior)
- Completed multi-phase overhaul scaffolding, sign-in incident fixes, parity artifacts, and security/docs baseline updates.

### 2026-02-11
- Completed Kimi/NVIDIA in-app chat path for the bottom "Ask anything" composer:
  - `src/ui/EditorPage.tsx`
  - `src/ui/editor-shell/ComposerPane.tsx`
  - `src/ui/editor-shell/contracts.ts`
  - `src/core/backend/client.ts`
- Added multimodal compose support in UI:
  - image attach/remove in composer,
  - request payload as OpenAI-compatible content arrays.
- Preserved editor-first control:
  - AI remains hard-toggleable (`AI OFF`) and compile/editor flows remain fully usable without AI.
- Hardened response normalization for NVIDIA Kimi reasoning-heavy outputs:
  - fallback parsing now reads `reasoning` when `message.content` is null.
- Validation refresh:
  - `npm run build:backend` pass
  - `npm run build` pass
  - `npm test -- --run` pass (4 files, 10 tests)
  - `scripts/validate_local.ps1` pass
  - `scripts/test_kimi.ps1` pass (models + text + image + edits smoke)
