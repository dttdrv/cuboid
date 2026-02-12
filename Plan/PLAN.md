# Cuboid Project Plan

Last updated: 2026-02-10

## Protocol
`Alpha Prime`

## Program Objective
Ship a local-first Prism/Crixet-class writing environment with:
1. Backend-first operational reliability (compile queue, diagnostics, policy controls).
2. Agentic assistance that is optional and explicitly user-controlled (`AI OFF` hard toggle).
3. Model-agnostic architecture (provider abstraction; NVIDIA Build API first in current v1 slice; direct adapters next).
4. UI that stays simple and editor-dominant until backend gates are closed.

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
- Program phase: `p1_backend_foundation_implemented_in_validation`
- Delivery posture: backend-first vertical slice delivered; now hardening and expanding backend ownership
- Runtime model: local-first
- Agent model: assistant/agent boundary is explicit, with backend policy enforcement and hard AI disable path

## Latest Implementation Slice (This Session)
### Backend control plane (TypeScript)
- Added local backend service under `backend/src`:
  - `backend/src/server.ts`
  - `backend/src/types.ts`
  - `backend/src/store/localStore.ts`
  - `backend/src/services/compileQueue.ts`
  - `backend/src/services/aiRouter.ts`
  - `backend/src/services/secrets.ts`
- Added versioned `/v1/*` endpoints for projects/files, compile jobs/events, AI, settings, and AI toggle.

### Rust compile core path
- Added Rust worker crate:
  - `backend/rust/compile_worker/Cargo.toml`
  - `backend/rust/compile_worker/src/main.rs`
- Worker runs `latexmk` with timeout, structured JSON I/O, and artifact/log reporting.

### Local-first storage and security
- No DB introduced; backend persists under `~/.cuboid`.
- Added encrypted-at-rest secret storage for AI API keys (currently NVIDIA Build API key).
- Added AI policy gate: if AI is disabled, backend blocks outbound AI requests.

### Frontend backend wiring
- Added `src/core/backend/client.ts`.
- Rewired editor compile flow in `src/ui/EditorPage.tsx` to backend compile jobs.
- Added AI ON/OFF toggle in composer with backend settings integration:
  - `src/ui/editor-shell/ComposerPane.tsx`
  - `src/ui/editor-shell/contracts.ts`
- Rewired core editor persistence to backend local filesystem store:
  - `src/ui/Dashboard.tsx` uses `/v1/projects` for list/create
  - `src/ui/EditorPage.tsx` reads/writes `main.tex` via `/v1/projects/:id/files/:path`

### Research/dossier initialization
- Added:
  - `research/prism_crixet_feature_matrix.md`
  - `research/stack_alternatives_matrix.md`
  - `research/moat_and_differentiation.md`
  - `research/funding_narrative_mistral.md`
  - `research/source_log.md`

## Verification Evidence
### Build (frontend)
- Command: `C:\Users\deyan\Projects\Cuboid\.agent\tools\node-v20.11.1-win-x64\node.exe node_modules\vite\bin\vite.js build`
- Result: pass
- Timestamp: 2026-02-10

### Build (backend)
- Command: `C:\Users\deyan\Projects\Cuboid\.agent\tools\node-v20.11.1-win-x64\node.exe node_modules\typescript\bin\tsc -p backend\tsconfig.json`
- Result: pass
- Timestamp: 2026-02-10

### Tests
- Command: `C:\Users\deyan\Projects\Cuboid\.agent\tools\node-v20.11.1-win-x64\node.exe node_modules\vitest\vitest.mjs --run`
- Result: pass
- Detail: 4 files, 10 tests passed
- Timestamp: 2026-02-10

### Serve status
- Frontend: `http://127.0.0.1:4174` (`HTTP 200`, checked 2026-02-10).
- Backend: `http://127.0.0.1:4317/v1/health` (`HTTP 200`, checked 2026-02-10).

### Strict typing status
- `npx tsc --noEmit` currently reports pre-existing strict-type errors in legacy core/worker files outside this UI recovery slice.

## Gate Progress
- Gate A (design system rewrite): `IN_REVIEW` (major cleanup done, full cross-screen audit pending)
- Gate B (core UI overhaul): `IN_REVIEW` (new shell shipped, requires user validation pass)
- Gate C (secondary consistency): `IN_REVIEW` (menu/modal/settings normalization still partial)
- Gate D (operational correctness): `IN_REVIEW` (backend compile queue path implemented, edge-case hardening pending)
- Gate E (security hardening): `IN_REVIEW`
- Gate F (Prism parity program): `IN_REVIEW`

## Roadmap (Next Phases)
### Phase 1.1: Backend ownership completion
1. Move project/file read-write fully through backend APIs.
2. Replace remaining frontend-local compile assumptions with backend-only job lifecycle.
3. Add compile job event streaming/polling UI states.

### Phase 1.2: Compile hardening
1. Harden Rust worker behavior for multi-file projects and bibliography-heavy docs.
2. Add cancellation, bounded queue policy, and clearer compile failure taxonomy.
3. Add compile integration tests against representative TeX fixtures.

### Phase 1.3: AI routing hardening (OpenRouter-first)
### Phase 1.3: AI routing hardening (NVIDIA-first, provider-agnostic)
1. Harden NVIDIA response normalization, error mapping, and timeout behavior.
2. Confirm model ID flexibility (e.g. `moonshotai/kimi-k2.5`) via configuration and document it.
3. Add request redaction + policy test coverage (AI OFF must block all outbound calls).
4. Introduce provider adapter interface explicitly (so OpenRouter/direct providers can be added later without refactor).
5. Add multimodal request support (images) via OpenAI-compatible content arrays.
6. Keep multimodal optional: editor must remain fully usable with AI disabled.

### Phase 1.4: Prism-ahead parity closure (backend-first)
1. SyncTeX pipeline for “go to PDF / go to LaTeX” navigation (Crixet parity).
2. Project context index (labels/refs graph, citations list, section graph) for diagnostics and AI context packs.
3. Compiler-log-aware diagnostics enrichment (ranked root cause + fix suggestions, AI optional).
4. Import parity: folder + zip import, and “move selection to subfile” refactor proposals.
5. Comments persistence (local-only v1; cloud deferred): anchored threads to file/line ranges.

### Phase 1.5: Research dossier completion
1. Expand competitor matrix with verified/inferred/unknown labeling per subsystem.
2. Complete alternatives pass/fail criteria and benchmark harness.
3. Finalize partner-facing funding/positioning narrative.

### Phase 1.6: UI alignment after backend gates
1. Keep simple 3-pane shell.
2. Polish compile/diagnostic affordances and AI toggle clarity.
3. Defer non-core UI complexity until backend acceptance criteria are met.

### Phase 2: Cloud-ready option (post-local v1, Cloudflare/VPS-friendly)
Goal: make the backend deployable without rewriting core logic.
1. Containerize compile worker (TeX Live + latexmk) with strict sandboxing, timeouts, and quotas.
2. Split into services: API control plane + compile worker pool (job queue) + artifact storage.
3. Storage:
   - source projects in object storage (e.g. Cloudflare R2 / S3) or mounted volumes
   - metadata in a real DB (Postgres/SQLite) when multi-user arrives
4. Realtime:
   - websocket/SSE event channel for compile/AI/status
   - collaboration substrate (Yjs/CRDT) when multi-user is in scope
5. Auth:
   - user accounts + invite links
   - per-project permission model
6. Secrets:
   - managed secret store (not filesystem) and strict egress allowlists

## Direction While User Tests
1. Keep NVIDIA Build API as the single active AI backend for now.
2. Prioritize backend determinism over feature breadth.
3. Keep AI fully optional and policy-controlled.

## 2026-02-11 Session Update
### What shipped
1. Prism-style ambient composer behavior was completed in the current simple 3-pane shell:
   - bottom-right "Ask anything" transcript,
   - optional image attachment for multimodal prompts,
   - AI ON/OFF hard toggle preserved.
2. Editor orchestration now sends conversational requests through `/v1/ai/chat` and keeps `/v1/ai/edits` for explicit edit/fix intents.
3. Parsing was hardened for NVIDIA Kimi where `message.content` can be null and output can arrive in `reasoning`.

### Verification
1. `npm run build:backend` -> pass
2. `npm run build` -> pass
3. `npm test -- --run` -> pass (4 files, 10 tests)
4. `scripts/validate_local.ps1` -> pass
5. `scripts/test_kimi.ps1` -> pass (models, text chat, image chat, edits)
