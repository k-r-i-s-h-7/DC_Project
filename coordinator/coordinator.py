from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import time
import sqlite3
from datetime import datetime
import subprocess

from confluent_kafka import Producer, Consumer

# --------------------------------------------------------
#   FLASK + CORS
# --------------------------------------------------------
app = Flask("coordinator")
CORS(app, resources={r"/*": {"origins": "*"}})

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB = os.path.join(ROOT, "travel.db")
INGEST_FOLDER = os.path.join(ROOT, "hadoop_ingest")
os.makedirs(INGEST_FOLDER, exist_ok=True)

# --------------------------------------------------------
#   Kafka Topics for all 4 workers
# --------------------------------------------------------
KAFKA_BROKER = "kafka:9092"

WORKER_TOPICS = {
    "hotels": ("travel_hotels_requests", "travel_hotels_responses"),
    "restaurants": ("travel_restaurants_requests", "travel_restaurants_responses"),
    "events": ("travel_events_requests", "travel_events_responses"),
    "transport": ("travel_transport_requests", "travel_transport_responses"),
}

# Kafka Producers & Consumers
producer = Producer({"bootstrap.servers": KAFKA_BROKER})

consumer = Consumer({
    "bootstrap.servers": KAFKA_BROKER,
    "group.id": "coordinator_group",
    "auto.offset.reset": "earliest"
})

# Subscribe to ALL response topics
consumer.subscribe([t[1] for t in WORKER_TOPICS.values()])


# --------------------------------------------------------
#   Kafka Request Sender
# --------------------------------------------------------
def send_kafka_request(city, limit):
    """Send request to all 4 worker topics."""
    payload = json.dumps({"location": city, "limit": limit}).encode()

    for worker, (req_topic, _) in WORKER_TOPICS.items():
        print(f"[→] Sending {worker} request")
        producer.produce(req_topic, payload)
        producer.flush()


# --------------------------------------------------------
#   Kafka Response Collector
# --------------------------------------------------------
def wait_for_all_responses(required=4, timeout=6):
    """Collect exactly `required` worker responses."""
    results = []
    end = time.time() + timeout

    while len(results) < required and time.time() < end:
        msg = consumer.poll(1.0)
        if not msg or msg.error():
            continue
        response = json.loads(msg.value().decode())
        print(f"[✓] Received from {response.get('source')}")
        results.append(response)

    return results


# --------------------------------------------------------
#   Aggregator
# --------------------------------------------------------
def merge_itinerary(responses):
    """Combine hotels + restaurants + events + transport."""
    itinerary = []

    for r in responses:
        items = r.get("results", [])
        itinerary.extend(items)

    return itinerary


# --------------------------------------------------------
#   PLAN ENDPOINT (MAIN)
# --------------------------------------------------------
@app.route("/plan")
def plan():
    city = request.args.get("city")
    if not city:
        return jsonify({"error": "city parameter required"}), 400

    limit = int(request.args.get("limit", 3))

    # Send parallel Kafka requests
    send_kafka_request(city, limit)

    # Collect responses
    responses = wait_for_all_responses(required=4)

    # Merge into unified itinerary
    itinerary = merge_itinerary(responses)

    return jsonify({
        "city": city,
        "itinerary": itinerary,
        "node_responses": responses
    })


# --------------------------------------------------------
#   FEEDBACK STORAGE + HADOOP INGEST
# --------------------------------------------------------
@app.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json()
    required = ["user_id", "location", "itinerary", "rating"]

    if not all(k in data for k in required):
        return jsonify({"error": f"Required: {required}"}), 400

    user_id = data["user_id"]
    location = data["location"]
    itinerary = json.dumps(data["itinerary"])
    rating = float(data["rating"])
    comment = data.get("comment", "")
    timestamp = datetime.utcnow().isoformat()

    # Store in SQLite
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("""
        INSERT INTO feedback (user_id, location, itinerary, rating, comment, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, location, itinerary, rating, comment, timestamp))
    conn.commit()
    conn.close()

    # Store in JSON for Hadoop
    file = f"feedback_{datetime.utcnow().strftime('%Y%m%dT%H%M%S%f')}.json"
    path = os.path.join(INGEST_FOLDER, file)

    with open(path, "w") as f:
        json.dump({
            "user_id": user_id,
            "location": location,
            "itinerary": json.loads(itinerary),
            "rating": rating,
            "comment": comment,
            "timestamp": timestamp,
        }, f)

    return jsonify({"status": "ok", "file": path})


# --------------------------------------------------------
#   RUN MAPREDUCE JOB
# --------------------------------------------------------
def run_mapreduce_analysis():
    try:
        subprocess.run([
            "docker", "exec", "hadoop-single-node",
            "hdfs", "dfs", "-mkdir", "-p", "/user/travel/feedback"
        ], check=True)

        subprocess.run([
            "docker", "exec", "hadoop-single-node",
            "hdfs", "dfs", "-put", "-f", "/tmp/ingest/*.json", "/user/travel/feedback/"
        ], check=True)

        result = subprocess.run([
            "docker", "exec", "hadoop-single-node",
            "hadoop", "jar",
            "/opt/hadoop/share/hadoop/tools/lib/hadoop-streaming-3.2.1.jar",
            "-files", "/tmp/mapreduce/feedback_analysis.py",
            "-mapper", "python feedback_analysis.py",
            "-reducer", "python feedback_analysis.py reduce",
            "-input", "/user/travel/feedback/*.json",
            "-output", "/user/travel/output"
        ], capture_output=True, text=True, check=True)

        return {"status": "success", "output": result.stdout}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.route("/analytics/feedback")
def feedback_analytics():
    return jsonify(run_mapreduce_analysis())


# --------------------------------------------------------
#   RUN
# --------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
