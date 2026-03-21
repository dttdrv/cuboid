## 2025-03-21 - [Optimize listProjects]
**Learning:** listFilesRecursive traverses entire project directories including files/ folders to find manifest.json, which becomes extremely slow (O(N) files) as projects grow. Since manifests are always at `<projectsDir>/<projectId>/manifest.json`, we can use `readdir` with `withFileTypes: true` to get only the immediate project directories and read the manifests directly using `Promise.all`.
**Action:** Use direct directory reading + concurrent map instead of full recursive tree traversal when the file structure is known.
