
## 2024-05-24 - [Optimize LaTeX Section Parsing]
**Learning:** For heavy text parsing in this codebase (like LaTeX section extraction), single-pass global regular expressions (e.g., using `matchAll` or `regex.exec`) combined with `substring` extraction are significantly faster and use much less memory compared to line-by-line splitting (`split('\n')`) and character-by-character string building. Using `indexOf('\n', lastNewlineIndex)` allows lazy computation of line numbers without splitting the whole document.
**Action:** Prefer single-pass regexes and substring methods over splitting whole documents into arrays for textual analysis or extraction where performance is critical.
