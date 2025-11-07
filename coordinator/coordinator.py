from flask import Flask, request, jsonify
from flask_cors import CORS
from confluent_kafka import Producer, Consumer
import json
import time

app = Flask("coordinator")
CORS(app)

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
