## 2024-05-18 - Single-Pass Regular Expression Optimization for LaTeX Parsing
**Learning:** For heavy text parsing like extracting sections from massive LaTeX documents, using `.split('\n')` coupled with line-by-line character accumulation operations generates significant CPU overhead and array allocations.
**Action:** Use a single-pass global regular expression (e.g., `matchAll` or `exec` with the `/g` flag) alongside `indexOf('\n')` for lazy newline tracking and `.substring()` for string extraction. This approach is 2-3x faster and avoids creating intermediate arrays representing lines.
