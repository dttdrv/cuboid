
## 2024-03-23 - Fast LaTeX Section Parsing
**Learning:** For heavy text parsing in this codebase (like LaTeX section extraction), using a single-pass global regular expression (via `regex.exec`) and lazy newline counting (`indexOf('\n')`) is vastly faster (~10x for large files) than splitting the entire document into an array of lines (`split('\n')`). Furthermore, using `substring()` to extract brace content avoids character-by-character string building and inherently handles escaped backslashes exactly like the original.
**Action:** Always prefer global regex parsing and `substring` extraction over line-by-line splitting and character-by-character string building for heavy text parsing.
