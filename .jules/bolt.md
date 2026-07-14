## 2025-05-15 - Indexing for Order By
**Learning:** In SQLite, adding an index to a column used in an `ORDER BY` clause can drastically reduce query time from O(N log N) to O(1) for seeking, and it completely avoids the use of a temporary B-TREE for sorting. For a 100k records table, this reduced query time from ~170ms to ~2ms when fetching with a LIMIT.
**Action:** Always check `EXPLAIN QUERY PLAN` when a dashboard or list view sorts by a non-indexed column, especially timestamps.

## 2025-05-20 - SQLite Synchronous Mode for Write Performance
**Learning:** In SQLite's WAL mode, `PRAGMA synchronous=NORMAL` provides a massive performance boost for write operations compared to the default `FULL`. It reduces the number of `fsync()` operations by not syncing the WAL file after every transaction, while still maintaining integrity against application crashes (though not power failures). In this app, it reduced write latency by ~70% (from 1.08s to 0.32s for 500 commits).
**Action:** Use `PRAGMA synchronous=NORMAL` in conjunction with `WAL` mode for SQLite databases where high write throughput is needed and power-loss data loss is an acceptable risk for the performance gain.

## 2025-06-25 - Dynamic Gzip Compression Impact
**Learning:** Implementing dynamic Gzip compression in the Flask `after_request` hook for text-based mimetypes (HTML, CSS, JS, JSON) provided a ~73% reduction in the home page payload (from 13.3KB to 3.6KB). Using `response.vary.add('Accept-Encoding')` is safer than direct header assignment as it correctly handles existing Vary values.
**Action:** Always implement Gzip compression for text-heavy applications to significantly reduce TTFB and bandwidth usage, especially when serving through a reverse proxy might not be an option.

## 2025-07-14 - Flask Gzip and direct_passthrough
**Learning:** Flask's `Response.get_data()` can raise a `RuntimeError` if `direct_passthrough` is enabled (common for static files). Disabling it in `after_request` allows compressing static assets dynamically. Combining this with `Cache-Control: max-age=31536000` for the `static/` path ensures that the compression overhead only occurs once per asset version for each client.
**Action:** In Flask `after_request`, set `response.direct_passthrough = False` before calling `get_data()` to safely compress static assets.
