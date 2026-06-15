## 2025-05-15 - Indexing for Order By
**Learning:** In SQLite, adding an index to a column used in an `ORDER BY` clause can drastically reduce query time from O(N log N) to O(1) for seeking, and it completely avoids the use of a temporary B-TREE for sorting. For a 100k records table, this reduced query time from ~170ms to ~2ms when fetching with a LIMIT.
**Action:** Always check `EXPLAIN QUERY PLAN` when a dashboard or list view sorts by a non-indexed column, especially timestamps.

## 2026-06-15 - SQLite synchronous=NORMAL in WAL Mode
**Learning:** In SQLite WAL mode, the default `synchronous=FULL` is redundant and significantly slower. Setting `synchronous=NORMAL` reduces the number of `fsync()` calls by only syncing to disk at checkpoints, rather than every transaction. This is still safe against application crashes, making it an ideal performance win for web applications with moderate write frequency.
**Action:** Always use `PRAGMA synchronous=NORMAL` when `journal_mode=WAL` is enabled in SQLite to improve write throughput.
