## 2025-05-15 - Indexing for Order By
**Learning:** In SQLite, adding an index to a column used in an `ORDER BY` clause can drastically reduce query time from O(N log N) to O(1) for seeking, and it completely avoids the use of a temporary B-TREE for sorting. For a 100k records table, this reduced query time from ~170ms to ~2ms when fetching with a LIMIT.
**Action:** Always check `EXPLAIN QUERY PLAN` when a dashboard or list view sorts by a non-indexed column, especially timestamps.

## 2025-05-20 - SQLite Synchronous Mode for Write Performance
**Learning:** In SQLite's WAL mode, `PRAGMA synchronous=NORMAL` provides a massive performance boost for write operations compared to the default `FULL`. It reduces the number of `fsync()` operations by not syncing the WAL file after every transaction, while still maintaining integrity against application crashes (though not power failures). In this app, it reduced write latency by ~70% (from 1.08s to 0.32s for 500 commits).
**Action:** Use `PRAGMA synchronous=NORMAL` in conjunction with `WAL` mode for SQLite databases where high write throughput is needed and power-loss data loss is an acceptable risk for the performance gain.

## 2025-06-25 - Dynamic Gzip Compression Impact
**Learning:** Implementing dynamic Gzip compression in the Flask `after_request` hook for text-based mimetypes (HTML, CSS, JS, JSON) provided a ~73% reduction in the home page payload (from 13.3KB to 3.6KB). Using `response.vary.add('Accept-Encoding')` is safer than direct header assignment as it correctly handles existing Vary values.
**Action:** Always implement Gzip compression for text-heavy applications to significantly reduce TTFB and bandwidth usage, especially when serving through a reverse proxy might not be an option.

## 2026-07-09 - Frontend Script Consolidation & Reveal Animation Optimization
**Learning:** Consolidating multiple redundant copies of the same logic (like mobile menu toggles) significantly reduces the JavaScript bundle size (~30% in this case) and decreases parse/execution time. Additionally, using `observer.unobserve(entry.target)` in IntersectionObservers for reveal animations ensures that the browser stops tracking elements once they are visible, reducing runtime main-thread overhead. Removing `setTimeout`-based `getBoundingClientRect` checks for initial visibility avoids layout thrashing during the critical path of page load.
**Action:** Always audit `script.js` for redundant event listeners and logic. Prefer `IntersectionObserver` for all scroll-based visibility checks and always `unobserve` targets that only need to animate once.
