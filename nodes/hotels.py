# nodes/hotels.py
from flask import Flask, request, jsonify
import sqlite3
import os

DB = os.path.join(os.path.dirname(__file__), "..", "travel.db")
DB = os.path.normpath(DB)

app = Flask("hotels_node")

def query_hotels(city, limit=5):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT id, name, city, rating, info FROM hotels WHERE city = ? ORDER BY rating DESC LIMIT ?", (city, limit))
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "city": r[2], "rating": r[3], "info": r[4], "type": "hotel"} for r in rows]

@app.route("/search")
def search():
    city = request.args.get("city", "")
    limit = int(request.args.get("limit", 5))
    results = query_hotels(city, limit)
    return jsonify({"source": "hotels", "results": results})

if __name__ == "__main__":
    app.run(port=5004, debug=True)
