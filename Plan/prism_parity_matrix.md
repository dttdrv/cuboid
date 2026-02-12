# Cuboid vs Prism Parity Matrix

## Benchmarks
- OpenAI Prism baseline (current): https://openai.com/prism
- OpenAI Prism legacy path (observed unstable on 2026-02-10 UTC): https://openai.com/index/prism
- OpenAI release notes: https://help.openai.com/en/articles/6825453-chatgpt-release-notes

## Status values
- `Implemented`: working in current local-first runtime
- `Local Stub`: contract/UI present, backend integration intentionally deferred
- `Deferred`: explicit future work item

| Capability | Status | Evidence | Gap / Next step |
| --- | --- | --- | --- |
| Workspace routing continuity | Implemented | `src/App.tsx`, `src/core/auth/AuthProvider.tsx` | Hardening of invalid workspace edge paths |
| Project list + project entry | Implemented | `src/ui/Dashboard.tsx` | Improve import/connect experiences |
| Editor + assistant panel loop | Implemented | `src/ui/EditorPage.tsx` | Deepen assistant execution model |
| Diagnostics and activity rails | Implemented | `src/ui/EditorPage.tsx`, `src/core/activity/ActivityStore.ts` | Link events to richer operations |
| Compile -> PDF preview | Implemented | `backend/src/services/compileQueue.ts`, `backend/rust/compile_worker`, `src/core/backend/client.ts`, `src/ui/EditorPage.tsx` | Improve compile engine observability and add fixtures |
| Inline diffs/comments workflow | Implemented | `src/ui/EditorPage.tsx`, `src/ui/editor/MonacoEditor.tsx` | Persist collaboration state |
| Multi-user collaboration at scale | Local Stub | `src/core/collab/CollaborationManager.ts` | Add authenticated signaling and sync authority |
| Citation/reference workflows | Local Stub | `src/core/ai/tools.ts` | Add end-to-end citation UX flow |
| Data-to-table/spreadsheet workflows | Local Stub | `src/core/parity/featureStubs.ts` | Add adapter contract + UI flow |
| External integration connectors (e.g. Zotero-like) | Local Stub | `src/core/parity/featureStubs.ts` | Define provider adapter contracts |
| Cloud-backed operational telemetry | Deferred | N/A | Add backend event pipeline when runtime expands |
