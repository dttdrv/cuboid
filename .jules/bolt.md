## 2024-05-24 - Efficient Regex Parsing for LaTeX Sections
**Learning:** Found that `parseSections` in `src/utils/parseSections.ts` was extremely inefficient. It split the string line-by-line using `.split('\n')`, built a regex per line, checked string by string via string appending and substrings. Memory allocations for many small strings are heavy, taking an average of 9 seconds on 1M strings.
**Action:** Use a single global `RegExp` to identify headers (like `/(sub)*section\*?\{/g`), and extract contents using indices, taking roughly half the time by avoiding line-by-line array splitting.
