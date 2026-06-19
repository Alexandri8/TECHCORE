## 2025-05-15 - Indexing for Order By
**Learning:** In SQLite, adding an index to a column used in an `ORDER BY` clause can drastically reduce query time from O(N log N) to O(1) for seeking, and it completely avoids the use of a temporary B-TREE for sorting. For a 100k records table, this reduced query time from ~170ms to ~2ms when fetching with a LIMIT.
**Action:** Always check `EXPLAIN QUERY PLAN` when a dashboard or list view sorts by a non-indexed column, especially timestamps.

## 2025-05-16 - SQLite Synchronous NORMAL in WAL Mode
**Learning:** Setting `PRAGMA synchronous=NORMAL` in SQLite WAL mode demonstrated a measurable ~58% reduction in commit latency in this environment (from ~0.17s to ~0.07s for 100 sequential inserts). In WAL mode, NORMAL is still safe against database corruption and only risks losing the very last transaction in case of power failure, making it an excellent trade-off for performance.
**Action:** Use `sqlalchemy.event.listens_for(Engine, "connect")` to globally apply `PRAGMA synchronous=NORMAL` and `PRAGMA journal_mode=WAL` for all SQLite connections to ensure maximum concurrency and write speed.
