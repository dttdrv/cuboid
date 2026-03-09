
## 2024-05-16 - [Optimize JSON Lines Parsing]
**Learning:** Chained array operations like `.map().filter().map()` create multiple intermediate arrays. In functions that process potentially large datasets, such as parsing `.jsonl` files line-by-line, this can lead to excessive memory allocation and GC overhead, creating a performance bottleneck.
**Action:** Replace chained `.map().filter().map()` operations with a single `for...of` loop or a `reduce` operation to avoid allocating multiple intermediate arrays. This significantly reduces CPU overhead and memory pressure during large data processing.
