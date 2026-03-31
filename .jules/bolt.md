
## 2024-03-31 - [Optimize File Stats Fetching]
**Learning:** Sequential `for...of` loops performing I/O operations (like `await stat(absolutePath)`) scale poorly in local disk stores for projects containing many files, leading to performance bottlenecks.
**Action:** Use concurrent `Promise.all` with mapping over files to significantly improve processing speed when listing project files or performing batched independent disk operations.
