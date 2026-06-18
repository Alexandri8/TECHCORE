## 2025-05-15 - Indexing for Order By
**Learning:** In SQLite, adding an index to a column used in an `ORDER BY` clause can drastically reduce query time from O(N log N) to O(1) for seeking, and it completely avoids the use of a temporary B-TREE for sorting. For a 100k records table, this reduced query time from ~170ms to ~2ms when fetching with a LIMIT.
**Action:** Always check `EXPLAIN QUERY PLAN` when a dashboard or list view sorts by a non-indexed column, especially timestamps.
## 2025-05-22 - Optimizing SQLite Commit Latency
**Learning:** Setting  when using SQLite in  mode significantly reduces commit latency (benchmarked ~98% reduction for sequential inserts) by reducing the frequency of full disk synchronizations while remaining safe against application-level crashes.
**Action:** Always combine  with  for SQLite-backed web applications to ensure high write performance without sacrificing core data integrity.

## 2025-05-22 - Optimizing SQLite Commit Latency
**Learning:** Setting `PRAGMA synchronous=NORMAL` when using SQLite in `WAL` mode significantly reduces commit latency (benchmarked ~98% reduction for sequential inserts) by reducing the frequency of full disk synchronizations while remaining safe against application-level crashes.
**Action:** Always combine `PRAGMA journal_mode=WAL` with `PRAGMA synchronous=NORMAL` for SQLite-backed web applications to ensure high write performance without sacrificing core data integrity.
