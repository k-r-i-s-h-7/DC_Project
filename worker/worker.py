from confluent_kafka import Consumer, Producer
import json
import sqlite3
import os
import time

# Docker path for DB
DB = os.path.join(os.path.dirname(__file__), "travel.db")

KAFKA_BROKER = "kafka:9092"
REQUEST_TOPIC = "travel_requests"
RESPONSE_TOPIC = "travel_responses"

# Initialize DB if it doesn't exist
def init_db():
    if not os.path.exists(DB):
        conn = sqlite3.connect(DB)
        c = conn.cursor()
        c.execute("""
        CREATE TABLE IF NOT EXISTS hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            city TEXT,
            rating REAL,
            info TEXT
        )
        """)
        # Insert some sample data
        sample_data = [
            ("Hotel A", "Delhi", 4.5, "Luxury hotel"),
            ("Hotel B", "Delhi", 4.2, "Comfortable stay"),
            ("Hotel C", "Mumbai", 4.7, "5-star hotel"),
            ("Hotel D", "Mumbai", 4.0, "Budget hotel"),
            ("Hotel E", "Bangalore", 4.3, "Business-friendly"),
        ]
        c.executemany("INSERT INTO hotels (name, city, rating, info) VALUES (?, ?, ?, ?)", sample_data)
        conn.commit()
        conn.close()
        print("Database initialized with sample hotel data.")

init_db()

# Kafka consumer for requests
consumer = Consumer({
    'bootstrap.servers': KAFKA_BROKER,
    'group.id': 'hotels_group',
    'auto.offset.reset': 'earliest'
})
consumer.subscribe([REQUEST_TOPIC])

# Kafka producer for responses
producer = Producer({'bootstrap.servers': KAFKA_BROKER})

def query_hotels(city, limit=5):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT id, name, city, rating, info FROM hotels WHERE city = ? ORDER BY rating DESC LIMIT ?", (city, limit))
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "city": r[2], "rating": r[3], "info": r[4], "type": "hotel"} for r in rows]

print("Hotels worker running... Waiting for Kafka messages...")

while True:
    try:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            print("Kafka Error:", msg.error())
            continue

        data = json.loads(msg.value().decode('utf-8'))
        city = data.get("city", "")
        limit = data.get("limit", 5)
        print(f"Received request for city={city} limit={limit}")

        results = query_hotels(city, limit)
        response = {"source": "hotels", "results": results}

        producer.produce(RESPONSE_TOPIC, json.dumps(response).encode('utf-8'))
        producer.flush()
        print(f"Sent response with {len(results)} results for city={city}")

    except Exception as e:
        print("Worker exception:", e)
        time.sleep(1)
