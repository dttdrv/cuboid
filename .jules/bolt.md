## 2026-03-25 - [Performance: Shallow Read over Recursive Listing]
**Learning:** Found a major performance bottleneck where `listFilesRecursive` was used to find `manifest.json` files in known shallow subdirectories. This scaled poorly (O(N) files per project), taking excessive time for large projects.
**Action:** Replaced it with a concurrent shallow `readdir` approach. Always prefer reading specific files if their exact relative location in immediate subdirectories is known rather than scanning the entire file tree. Avoid generic recursive lists for metadata checks.
