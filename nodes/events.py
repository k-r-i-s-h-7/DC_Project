# nodes/events.py
from flask import Flask, request, jsonify
import sqlite3
import os

DB = os.path.join(os.path.dirname(__file__), "..", "travel.db")
DB = os.path.normpath(DB)

app = Flask("events_node")

def query_events(city, limit=5):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT id, name, city, start_time, rating, info FROM events WHERE city = ? ORDER BY rating DESC LIMIT ?", (city, limit))
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "city": r[2], "start_time": r[3], "rating": r[4], "info": r[5], "type": "event"} for r in rows]

@app.route("/search")
def search():
    city = request.args.get("city", "")
    limit = int(request.args.get("limit", 5))
    results = query_events(city, limit)
    return jsonify({"source": "events", "results": results})

if __name__ == "__main__":
    app.run(port=5002, debug=True)
