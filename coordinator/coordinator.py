from flask import Flask, request, jsonify
from flask_cors import CORS   # ✅ Import CORS
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import sqlite3
import os
import json
from confluent_kafka import Producer, Consumer
from datetime import datetime
import subprocess
import time
app = Flask("coordinator")

CORS(app, resources={r"/*": {"origins": "*"}})

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB = os.path.join(ROOT, "travel.db")
INGEST_FOLDER = os.path.join(ROOT, "hadoop_ingest")
os.makedirs(INGEST_FOLDER, exist_ok=True)

NODES = {
    "restaurants": "http://localhost:5001/search",
    "events": "http://localhost:5002/search",
    "transport": "http://localhost:5003/search",
    "hotels": "http://localhost:5004/search"
}

# Docker-aware Kafka broker
KAFKA_BROKER = "kafka:9092"
REQUEST_TOPIC = "travel_requests"
RESPONSE_TOPIC = "travel_responses"

# Kafka producer
producer = Producer({'bootstrap.servers': KAFKA_BROKER})

# Kafka consumer (for responses)
consumer = Consumer({
    'bootstrap.servers': KAFKA_BROKER,
    'group.id': 'coordinator_group',
    'auto.offset.reset': 'earliest'
})
consumer.subscribe([RESPONSE_TOPIC])

def send_request(city, max_per_node=3):
    msg = {"city": city, "limit": max_per_node}
    producer.produce(REQUEST_TOPIC, json.dumps(msg).encode('utf-8'))
    producer.flush()

def get_responses(timeout=5):
    """Poll Kafka for worker responses for `timeout` seconds"""
    end_time = time.time() + timeout
    responses = []
    while time.time() < end_time:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            continue
        responses.append(json.loads(msg.value().decode('utf-8')))
    return responses

def call_node(url, params):
    try:
        r = requests.get(url, params=params, timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"source": url, "error": str(e), "results": []}

def aggregate_results(node_responses, max_items=3):
    """Combine results and tag each item with its node source."""
    lists = []
    for nr in node_responses:
        source = nr.get("source", "unknown")
        results = nr.get("results", [])
        tagged_results = []
        for item in results[:max_items]:
            
            tagged_results.append({**item, "category": source})
        lists.append(tagged_results)
    itinerary = []
    for i in range(max_items):
        for lst in lists:
            if i < len(lst):
                itinerary.append(lst[i])
    return itinerary

@app.route("/plan")
def plan():
    city = request.args.get("city", "")
    if not city:
        return jsonify({"error": "city parameter required"}), 400
    max_per_node = int(request.args.get("max_per_node", 3))

    send_request(city, max_per_node)
    # Wait and collect worker responses
    responses = get_responses(timeout=5)
    
    # Aggregate results (simple merge)
    itinerary = []
    for r in responses:
        itinerary.extend(r.get("results", []))

    return jsonify({"city": city, "itinerary": itinerary, "node_responses": responses})

@app.route("/plan_old")
def plan_old():
    city = request.args.get("city", "")
    if not city:
        return jsonify({"error": "city parameter required"}), 400
    max_per_node = int(request.args.get("max_per_node", 3))
    params = {"city": city, "limit": max_per_node}
    responses = []
    with ThreadPoolExecutor(max_workers=len(NODES)) as ex:
        futures = {ex.submit(call_node, url, params): name for name, url in NODES.items()}
        for future in as_completed(futures):
            name = futures[future]
            result = future.result()
            result["category"] = name
            responses.append(result)
    
    itinerary = aggregate_results(responses, max_items=max_per_node)
    print(itinerary)
    return jsonify({"city": city, "itinerary": itinerary, "node_responses": responses})

@app.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json()
    required = ["user_id", "location", "itinerary", "rating"]
    if not data or not all(k in data for k in required):
        return jsonify({"error": f"Required fields: {required}"}), 400

    user_id = data["user_id"]
    location = data["location"]
    itinerary = data["itinerary"]
    rating = float(data["rating"])
    comment = data.get("comment", "")
    timestamp = datetime.utcnow().isoformat()

    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("INSERT INTO feedback (user_id, location, itinerary, rating, comment, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
              (user_id, location, json.dumps(itinerary), rating, comment, timestamp))
    conn.commit()
    conn.close()

    filename = f"feedback_{datetime.utcnow().strftime('%Y%m%dT%H%M%S%f')}.json"
    filepath = os.path.join(INGEST_FOLDER, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump({
            "user_id": user_id,
            "location": location,
            "itinerary": itinerary,
            "rating": rating,
            "comment": comment,
            "timestamp": timestamp
        }, f, ensure_ascii=False)

    return jsonify({"status": "ok", "stored": True, "ingest_file": filepath})

import subprocess
def run_mapreduce_analysis():
    """Run MapReduce job on feedback data"""
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
            "hadoop", "jar", "/opt/hadoop/share/hadoop/tools/lib/hadoop-streaming-3.2.1.jar",
            "-files", "/tmp/mapreduce/feedback_analysis.py",
            "-mapper", "python feedback_analysis.py",
            "-reducer", "python feedback_analysis.py reduce",
            "-input", "/user/travel/feedback/*.json",
            "-output", "/user/travel/output"
        ], capture_output=True, text=True, check=True)
        
        subprocess.run([
            "docker", "exec", "hadoop-single-node",
            "hdfs", "dfs", "-cat", "/user/travel/output/part-00000"
        ], check=True)
        
        return {"status": "success", "message": "MapReduce job completed"}
        
    except subprocess.CalledProcessError as e:
        return {"status": "error", "message": f"MapReduce failed: {e}"}

@app.route("/analytics/feedback")
def feedback_analytics():
    result = run_mapreduce_analysis()
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

