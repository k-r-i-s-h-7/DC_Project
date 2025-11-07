# nodes/transport.py
from flask import Flask, request, jsonify
import sqlite3
import os

DB = os.path.join(os.path.dirname(__file__), "..", "travel.db")
DB = os.path.normpath(DB)

app = Flask("transport_node")

def query_transport(city, limit=5):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT id, name, city, type, rating, info FROM transport WHERE city = ? ORDER BY rating DESC LIMIT ?", (city, limit))
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "city": r[2], "transport_type": r[3], "rating": r[4], "info": r[5], "type": "transport"} for r in rows]

@app.route("/search")
def search():
    city = request.args.get("city", "")
    limit = int(request.args.get("limit", 5))
    results = query_transport(city, limit)
    return jsonify({"source": "transport", "results": results})

if __name__ == "__main__":
    app.run(port=5003, debug=True)
