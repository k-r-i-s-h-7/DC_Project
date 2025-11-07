import sqlite3
import os

# Path where the DB will be created
DB_PATH = os.path.join(os.path.dirname(__file__), "travel.db")

def create_db():
    if os.path.exists(DB_PATH):
        print(f"Database already exists at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Create hotels table
    c.execute("""
    CREATE TABLE hotels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        city TEXT,
        rating REAL,
        info TEXT
    )
    """)

    # Insert sample data
    sample_hotels = [
        ("Hotel A", "Delhi", 4.5, "Luxury hotel"),
        ("Hotel B", "Delhi", 4.2, "Comfortable stay"),
        ("Hotel C", "Mumbai", 4.7, "5-star hotel"),
        ("Hotel D", "Mumbai", 4.0, "Budget hotel"),
        ("Hotel E", "Bangalore", 4.3, "Business-friendly"),
    ]

    c.executemany(
        "INSERT INTO hotels (name, city, rating, info) VALUES (?, ?, ?, ?)",
        sample_hotels
    )

    conn.commit()
    conn.close()
    print(f"Database created successfully at {DB_PATH}")

if __name__ == "__main__":
    create_db()
