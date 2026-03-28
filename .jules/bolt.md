## 2025-03-28 - [Performance Optimization in LocalStore listProjects]
**Learning:** Found an O(N) scaling bottleneck where `localStore.ts` used `listFilesRecursive` to find `manifest.json` across all files in a project workspace instead of directly reading immediate subdirectories.
**Action:** Avoid `listFilesRecursive` for well-known shallow paths. Use `readdir({ withFileTypes: true })` and read target files concurrently with `Promise.all` to significantly improve performance, especially on workspaces with many nested files.
