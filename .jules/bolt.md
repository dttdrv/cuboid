## 2026-03-30 - [Optimize LocalStore.listProjectFiles]
**Learning:** Sequential fs.stat calls in a for-loop create a significant bottleneck when listing large directories (e.g., projects with 1000+ files). Node.js can handle concurrent fs.stat operations much more efficiently.
**Action:** Use Promise.all with Array.prototype.map to perform fs.stat operations concurrently instead of sequentially for file listing operations.
