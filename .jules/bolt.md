## 2024-03-24 - [Avoid `listFilesRecursive` for shallow searches]
**Learning:** Finding files at known shallow depths (like `manifest.json` in project root directories) using `listFilesRecursive` on the entire disk store is extremely slow and scales poorly as project files increase (O(N) operation based on total file count rather than O(1 depth) directory count).
**Action:** Use shallow directory reads with `readdir({ withFileTypes: true })` and read the targeted files directly and concurrently via `Promise.all` instead.
