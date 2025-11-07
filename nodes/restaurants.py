# nodes/restaurants.py
from flask import Flask, request, jsonify
import sqlite3
import os

# DB path relative to where you run the script. If running from project root, change to "travel.db"
DB = os.path.join(os.path.dirname(__file__), "..", "travel.db")
DB = os.path.normpath(DB)

app = Flask("restaurants_node")

def query_restaurants(city, limit=5):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT id, name, city, rating, info FROM restaurants WHERE city = ? ORDER BY rating DESC LIMIT ?", (city, limit))
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "city": r[2], "rating": r[3], "info": r[4], "type": "restaurant"} for r in rows]

@app.route("/search")
def search():
    city = request.args.get("city", "")
    limit = int(request.args.get("limit", 5))
    results = query_restaurants(city, limit)
    return jsonify({"source": "restaurants", "results": results})

if __name__ == "__main__":
    app.run(port=5001, debug=True)
