## 2025-05-15 - Indexing for Order By
**Learning:** In SQLite, adding an index to a column used in an `ORDER BY` clause can drastically reduce query time from O(N log N) to O(1) for seeking, and it completely avoids the use of a temporary B-TREE for sorting. For a 100k records table, this reduced query time from ~170ms to ~2ms when fetching with a LIMIT.
**Action:** Always check `EXPLAIN QUERY PLAN` when a dashboard or list view sorts by a non-indexed column, especially timestamps.

## 2025-05-20 - SQLite Synchronous Mode for Write Performance
**Learning:** In SQLite's WAL mode, `PRAGMA synchronous=NORMAL` provides a massive performance boost for write operations compared to the default `FULL`. It reduces the number of `fsync()` operations by not syncing the WAL file after every transaction, while still maintaining integrity against application crashes (though not power failures). In this app, it reduced write latency by ~70% (from 1.08s to 0.32s for 500 commits).
**Action:** Use `PRAGMA synchronous=NORMAL` in conjunction with `WAL` mode for SQLite databases where high write throughput is needed and power-loss data loss is an acceptable risk for the performance gain.

## 2026-06-20 - Gzip Compression for Flask Responses
**Learning:** Implementing Gzip compression via a Flask `@app.after_request` hook significantly reduces the payload size of text-based responses (HTML, CSS, JS) by ~70%. However, it's critical to check `response.direct_passthrough` before attempting to compress; if true (common for static file serving in dev), calling `response.get_data()` will raise a RuntimeError.
**Action:** Always verify `direct_passthrough` is false and capture `get_data()` in a local variable once before compression to avoid redundant processing.
