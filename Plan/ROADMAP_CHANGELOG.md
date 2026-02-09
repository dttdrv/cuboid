# Cuboid Roadmap + Changelog

Last updated: 2026-02-10
Purpose: meticulous execution history + forward roadmap while overhaul is under active verification.

## 1) Program Snapshot
- Product direction: Prism-style platform with user-controlled assistant/agent boundary.
- Runtime mode: local-first, parity stubs for near-term cloud-era capabilities.
- Program phase: `overhaul_phase_execution_in_review`.
- Gate status: A-F implemented, currently `IN_REVIEW` pending final evidence closure.
- External benchmark status: `openai.com/prism` reachable; legacy `openai.com/index/prism` path is unstable (`404` observed on 2026-02-10 UTC).

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

### Local serving and link status
- Link under test: `http://127.0.0.1:4173`
- HTTP probe: `200 OK` (checked 2026-02-10 local session)
- Port state: listener confirmed on `127.0.0.1:4173` (`node.exe` process observed)
- Known issue pattern: startup can still fail if a stale preview process holds the port.

## 3) Completed Work (Detailed)
### Design system and UI overhaul
- Migrated to hard-square visual system and unified class primitives.
- Reworked dashboard/editor/auth/workspace/modals to shared style language.
- Added consistency artifacts and gate scoring docs under `Plan/`.

### Core architecture refactor
- Added data/auth/compile/security adapter seams:
  - `DataStore`
  - `AuthService`
  - `CompileService`
  - `CryptoVault`
- Added AI provider normalization (`AIProviderId`) and egress controls.

### Security and reliability hardening
- Enforced token-bound magic link consumption.
- Switched compile worker path from remote dependency to local script.
- Added CSP baseline in `index.html`.
- Fixed sign-in regression caused by HKDF extractability assumptions.
- Added local admin mode entry path for guaranteed testing access.

## 4) Critical Incident Log
### 2026-02-10: sign-in failure after refactor
- Symptom: sign-in error during local testing.
- Root cause: HKDF key import/export constraints were violated by extractability assumptions in session key wrapping flow.
- Fixes applied:
  1. Restored non-extractable HKDF master key behavior.
  2. Made wrapped master-key persistence best-effort/non-fatal.
  3. Kept unlock flow support without allowing wrapping failure to break auth.
  4. Added admin entry mode on login to preserve test continuity.
- Post-fix status: build/test pass.

### 2026-02-10: preview/startup confusion on port 4173
- Symptom: user unable to access expected preview route.
- Findings:
  1. Listener exists on `127.0.0.1:4173`.
  2. Direct HTTP probe returns `200 OK`.
  3. Failure mode likely process/port collision or stale process state, not absent build artifacts.
- Operational handling:
  1. Confirm active listener and response before re-running preview.
  2. Use strict host/port launch if needed.
  3. Fall back to alternate port when collision persists.

## 5) Roadmap (Next 3 Sprints)
### Sprint 1: Gate closure and evidence
1. Capture post-overhaul screenshots in `showcase/after`.
2. Close Gate A-C with explicit visual evidence.
3. Close Gate D-E with runtime behavior notes from manual QA.

### Sprint 2: Agentic UX control model
1. Keep assistant/agent boundary thin and user-directed.
2. Add explicit action modes:
   - Suggest-only
   - Guided apply
   - Autonomous run (scoped and reversible)
3. Add clearer run transparency in activity timelines.

### Sprint 3: Security/model hardening follow-up
1. Replace deterministic local user ID model.
2. Tighten AI logs retention policy (optional in-memory mode).
3. Add stricter collaboration signaling controls when infra is available.

## 6) Immediate Priorities While User Tests
1. Resolve any remaining login/session edge cases quickly.
2. Stabilize preview/dev startup instructions per-machine.
3. Keep roadmap/docs in lockstep with every tested fix.
4. Continue tightening agentic controls so autonomy remains explicitly user-scoped.

## 7) Compact Changelog
### 2026-02-10
- Verified build and tests with explicit Node PATH override.
- Fixed sign-in failure from HKDF key handling mismatch.
- Added admin mode entry for local testing continuity.
- Verified local endpoint response at `127.0.0.1:4173` and documented port collision behavior.
- Updated plan/roadmap/changelog/state docs for current overhaul status and benchmark-source stability.

### 2026-02-09
- Implemented phased overhaul program across UI/core/security/parity.
- Added gate scoring and self-critique artifacts.
- Added parity matrix/checklist and baseline behavior map.
