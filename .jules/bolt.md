## 2024-05-24 - [LaTeX Parsing Performance Bottleneck]
**Learning:** `split('\n')` and character-by-character string building `result += content[i]` are significant performance bottlenecks for parsing large LaTeX files, causing high CPU overhead and unnecessary memory allocations.
**Action:** Use single-pass global regular expressions (e.g., `/regex/g` with `exec` or `matchAll`) over the entire file content, coupled with `substring` extraction and lazy newline counting, to parse text efficiently.
