## 2025-05-15 - Indexing for Order By
**Learning:** In SQLite, adding an index to a column used in an `ORDER BY` clause can drastically reduce query time from O(N log N) to O(1) for seeking, and it completely avoids the use of a temporary B-TREE for sorting. For a 100k records table, this reduced query time from ~170ms to ~2ms when fetching with a LIMIT.
**Action:** Always check `EXPLAIN QUERY PLAN` when a dashboard or list view sorts by a non-indexed column, especially timestamps.

## 2025-05-16 - SQLite PRAGMA Persistence in Pooled Connections
**Learning:** SQLite PRAGMAs like `synchronous` are connection-scoped and not persistent in the database file. In a Flask/SQLAlchemy environment with connection pooling, setting them once at startup (e.g., within an `app_context` block) will NOT affect future connections in the pool.
**Action:** Use an SQLAlchemy event listener on the `Engine` class (`@event.listens_for(Engine, "connect")`) to ensure these PRAGMAs are applied to every new connection created.
