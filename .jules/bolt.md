
## 2023-10-27 - Regex Over Split for Text Parsing
**Learning:** In string parsing utilities dealing with long text like LaTeX documents, using `content.split('\n')` is highly inefficient because it allocates a massive array of strings. We can instead use single-pass regex matching over the whole content to avoid this memory overhead, and compute line numbers efficiently by lazily advancing an `indexOf` pointer.
**Action:** Use global regular expressions (`matchAll` or `exec`) combined with `substring` extraction instead of `split('\n')` and character-by-character iterations for large text processing functions.
