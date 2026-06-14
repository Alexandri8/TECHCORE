from app import app, db
import sqlalchemy

with app.app_context():
    # Force a transaction to start
    db.session.execute(sqlalchemy.text("SELECT 1"))
    try:
        print("Attempting to change journal_mode inside transaction...")
        db.session.execute(sqlalchemy.text("PRAGMA journal_mode=DELETE;"))
        db.session.commit()
        print("Success (unexpected based on review)")
    except Exception as e:
        print(f"Failed as expected: {e}")

    # Now try outside a transaction (fresh session)
    db.session.remove()
    print("Attempting to change journal_mode in a fresh session...")
    db.session.execute(sqlalchemy.text("PRAGMA journal_mode=WAL;"))
    db.session.commit()
    print("Success")
