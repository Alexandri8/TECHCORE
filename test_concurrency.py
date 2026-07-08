import sqlite3
import threading
import time
import os

db_path = 'instance/database.db'

def reader():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    print("Reader started")
    for i in range(5):
        cursor.execute("SELECT COUNT(*) FROM payment")
        print(f"Reader count: {cursor.fetchone()[0]}")
        time.sleep(0.1)
    conn.close()

def writer():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    print("Writer started")
    for i in range(5):
        cursor.execute("INSERT INTO payment (email, amount, reference, status, timestamp) VALUES (?, ?, ?, ?, datetime('now'))",
                       (f'test{i}@example.com', 100.0, f'ref{time.time()}{i}', 'success'))
        conn.commit()
        print(f"Writer inserted {i}")
        time.sleep(0.1)
    conn.close()

# Ensure directory exists and WAL mode is set
os.makedirs(os.path.dirname(db_path), exist_ok=True)
conn = sqlite3.connect(db_path)
conn.execute("PRAGMA journal_mode=WAL;")
conn.execute("""
    CREATE TABLE IF NOT EXISTS payment (
        id INTEGER PRIMARY KEY,
        email TEXT NOT NULL,
        amount REAL NOT NULL,
        reference TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'pending',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
conn.close()

t1 = threading.Thread(target=reader)
t2 = threading.Thread(target=writer)

t1.start()
t2.start()

t1.join()
t2.join()
