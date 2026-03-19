
## 2025-03-19 - Efficient LaTeX Parsing
**Learning:** `content.split('\n')` coupled with line-by-line regex evaluations for LaTeX section parsing is an anti-pattern that creates excessive intermediate string arrays and performs redundant passes.
**Action:** Use a single-pass global regex (`matchAll` or `regex.exec`) to find tags directly, and use `indexOf('\n')` to lazily resolve line numbers. Use `substring` rather than character-by-character building for block extraction.
