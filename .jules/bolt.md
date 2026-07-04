## 2025-05-15 - Indexing for Order By
**Learning:** In SQLite, adding an index to a column used in an `ORDER BY` clause can drastically reduce query time from O(N log N) to O(1) for seeking, and it completely avoids the use of a temporary B-TREE for sorting. For a 100k records table, this reduced query time from ~170ms to ~2ms when fetching with a LIMIT.
**Action:** Always check `EXPLAIN QUERY PLAN` when a dashboard or list view sorts by a non-indexed column, especially timestamps.

## 2025-05-20 - SQLite Synchronous Mode for Write Performance
**Learning:** In SQLite's WAL mode, `PRAGMA synchronous=NORMAL` provides a massive performance boost for write operations compared to the default `FULL`. It reduces the number of `fsync()` operations by not syncing the WAL file after every transaction, while still maintaining integrity against application crashes (though not power failures). In this app, it reduced write latency by ~70% (from 1.08s to 0.32s for 500 commits).
**Action:** Use `PRAGMA synchronous=NORMAL` in conjunction with `WAL` mode for SQLite databases where high write throughput is needed and power-loss data loss is an acceptable risk for the performance gain.

## 2025-06-25 - Dynamic Gzip Compression Impact
**Learning:** Implementing dynamic Gzip compression in the Flask `after_request` hook for text-based mimetypes (HTML, CSS, JS, JSON) provided a ~73% reduction in the home page payload (from 13.3KB to 3.6KB). Using `response.vary.add('Accept-Encoding')` is safer than direct header assignment as it correctly handles existing Vary values.
**Action:** Always implement Gzip compression for text-heavy applications to significantly reduce TTFB and bandwidth usage, especially when serving through a reverse proxy might not be an option.

## 2026-07-04 - IntersectionObserver and Script Consolidation
**Learning:** Replacing manual `setTimeout` and `getBoundingClientRect` visibility checks with `IntersectionObserver` for scroll-reveal animations eliminated layout thrashing during page load. Using `observer.unobserve(entry.target)` further reduced runtime CPU usage. Consolidating five redundant and conflicting versions of the same UI logic (mobile menu) into a single optimized function reduced the JS payload by ~31% and minimized memory footprint by reducing the number of event listeners.
**Action:** Always prefer `IntersectionObserver` for visibility-based logic and proactively audit scripts for redundant event listeners or duplicate logic blocks that can be consolidated.
