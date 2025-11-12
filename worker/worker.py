# travel_worker_with_replication.py
from confluent_kafka import Consumer, Producer
import json
import sqlite3
import os
import time
from concurrent.futures import ThreadPoolExecutor
import threading
import random
import socket
import psycopg2

# --- Replication manager (inspired by your example) ---
class TravelDBReplicationManager:
    def __init__(self):
        self.databases = []        # list[str]
        self.crashed_nodes = set() # set[str]
        self.lock = threading.Lock()

    def add_node(self):
        db_name = f"travel_node_{len(self.databases) + 1}.sqlite"
        self.databases.append(db_name)

        conn = sqlite3.connect(db_name)
        cursor = conn.cursor()

        # Create hotels table (plus other tables optionally)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hotels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                city TEXT NOT NULL,
                rating REAL,
                info TEXT
            )
        """)
        # Optional: create other tables the original example had
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS restaurants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                location TEXT,
                price INTEGER
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transport_routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_location TEXT NOT NULL,
                end_location TEXT NOT NULL,
                airline TEXT NOT NULL,
                price INTEGER NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                date DATE NOT NULL,
                category TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attractions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                category TEXT NOT NULL
            )
        """)

        conn.commit()
        conn.close()
        print(f"[+] Created new node: {db_name}")
        return db_name

    def initialize_data(self):
        """Populate initial data across all nodes (hotels + example data)."""
        hotels = [
            ("Hotel A", "Delhi", 4.5, "Luxury hotel"),
            ("Hotel B", "Delhi", 4.2, "Comfortable stay"),
            ("Hotel C", "Mumbai", 4.7, "5-star hotel"),
            ("Hotel D", "Mumbai", 4.0, "Budget hotel"),
            ("Hotel E", "Bangalore", 4.3, "Business-friendly"),
            ("Hotel F", "Bangalore", 4.6, "Top-rated business hotel"),
            ("Hotel G", "Pune", 4.1, "Cozy & affordable")
        ]

        # example other datasets (shortened)
        restaurants = [
            ("XYZ Cafe", "Mumbai", 200),
            ("ABC Diner", "Delhi", 500),
            ("Wada Pav Express", "Pune", 50)
        ]
        transport_routes = [
            ("Mumbai", "Delhi", "IndiGo", 3500),
            ("Delhi", "Bangalore", "IndiGo", 5000)
        ]
        events = [
            ("Bollywood Nights", "Mumbai", "2025-09-15", "Concert"),
            ("Tech Expo", "Bangalore", "2025-07-18", "Exhibition")
        ]
        attractions = [
            ("Gateway of India", "Mumbai", "Historical Monument"),
            ("Cubbon Park", "Bangalore", "Nature")
        ]

        for db in list(self.databases):
            if db in self.crashed_nodes:
                continue
            conn = sqlite3.connect(db)
            cursor = conn.cursor()
            # Clear existing hotels to avoid duplicates on re-run
            cursor.execute("DELETE FROM hotels")
            cursor.executemany("INSERT INTO hotels (name, city, rating, info) VALUES (?, ?, ?, ?)", hotels)

            # optional other data
            cursor.execute("DELETE FROM restaurants")
            cursor.executemany("INSERT INTO restaurants (name, location, price) VALUES (?, ?, ?)", restaurants)

            cursor.execute("DELETE FROM transport_routes")
            cursor.executemany("INSERT INTO transport_routes (start_location, end_location, airline, price) VALUES (?, ?, ?, ?)", transport_routes)

            cursor.execute("DELETE FROM events")
            cursor.executemany("INSERT INTO events (name, location, date, category) VALUES (?, ?, ?, ?)", events)

            cursor.execute("DELETE FROM attractions")
            cursor.executemany("INSERT INTO attractions (name, location, category) VALUES (?, ?, ?)", attractions)

            conn.commit()
            conn.close()

        print("[✓] Initial data replicated across all nodes")

    def query_by_location(self, table_name, location, limit=5):
        """Read from a random healthy node. Simulate random node crash occasionally."""
        if not self.databases:
            return {"error": "No nodes available"}

        # simulate crash with small probability
        if random.random() < 0.05 and self.databases:
            healthy = [db for db in self.databases if db not in self.crashed_nodes]
            if healthy:
                crashed = random.choice(healthy)
                self.crashed_nodes.add(crashed)
                print(f"[!] Simulated node crash: {crashed}")

        attempts = 0
        while attempts < len(self.databases):
            db_choice = random.choice(self.databases)
            if db_choice in self.crashed_nodes:
                attempts += 1
                continue
            return self._execute_location_query(db_choice, table_name, location, limit)
        return {"error": "All nodes crashed! No data available."}

    def _execute_location_query(self, db, table_name, location, limit=5):
        try:
            conn = sqlite3.connect(db)
            cursor = conn.cursor()

            if table_name == "hotels":
                # read top hotels by rating
                cursor.execute("SELECT id, name, city, rating, info FROM hotels WHERE city=? ORDER BY rating DESC LIMIT ?", (location, limit))
                columns = ["id", "name", "city", "rating", "info"]
            elif table_name == "restaurants":
                cursor.execute("SELECT name, location, price FROM restaurants WHERE location=?", (location,))
                columns = ["name", "location", "price"]
            elif table_name == "events":
                cursor.execute("SELECT name, location, date, category FROM events WHERE location=?", (location,))
                columns = ["name", "location", "date", "category"]
            elif table_name == "attractions":
                cursor.execute("SELECT name, location, category FROM attractions WHERE location=?", (location,))
                columns = ["name", "location", "category"]
            elif table_name == "transport":
                cursor.execute("SELECT start_location, end_location, airline, price FROM transport_routes WHERE start_location=? OR end_location=?", (location, location))
                columns = ["start_location", "end_location", "airline", "price"]
            else:
                conn.close()
                return {"error": f"Invalid table: {table_name}"}

            rows = cursor.fetchall()
            conn.close()

            results = [dict(zip(columns, row)) for row in rows]
            print(f"[✓] Read from {db}: Found {len(results)} results for {table_name} in {location}")
            return {"node": db, "results": results}
        except Exception as e:
            return {"error": str(e)}

    def replicate_node(self, target_db):
        """Create a full backup copy of target_db as a new node."""
        if target_db not in self.databases:
            raise ValueError(f"Node {target_db} does not exist")
        if target_db in self.crashed_nodes:
            raise ValueError(f"Cannot replicate crashed node {target_db}")

        new_number = len(self.databases) + 1
        new_node = f"travel_node_{new_number}.sqlite"

        source_conn = sqlite3.connect(target_db)
        dest_conn = sqlite3.connect(new_node)
        with source_conn:
            source_conn.backup(dest_conn)
        source_conn.close()
        dest_conn.close()

        self.databases.append(new_node)
        print(f"[✓] Node {target_db} replicated to {new_node}")
        return new_node

    def get_status(self):
        return {
            "total_nodes": len(self.databases),
            "active_nodes": len([db for db in self.databases if db not in self.crashed_nodes]),
            "crashed_nodes": list(self.crashed_nodes),
            "node_list": self.databases
        }

# --- instantiate and prepare nodes ---
rm = TravelDBReplicationManager()
rm.add_node()
rm.add_node()
rm.add_node()
rm.initialize_data()

# Optional: small admin TCP server (copy/paste from your example)
HOST = '127.0.0.1'
PORT = 65432

def handle_client(conn, addr):
    print(f"[+] Admin connected: {addr}")
    try:
        while True:
            data = conn.recv(4096)
            if not data:
                break
            request = json.loads(data.decode())
            action = request.get("action")
            response = {"status": "error", "result": None}
            try:
                if action == "query":
                    table_name = request.get("table")
                    location = request.get("location")
                    limit = request.get("limit", 5)
                    result = rm.query_by_location(table_name, location, limit)
                    response = {"status": "success", "result": result}
                elif action == "replicate_node":
                    target_db = request.get("target_db")
                    new_node = rm.replicate_node(target_db)
                    response = {"status": "success", "result": f"Node replicated to {new_node}"}
                elif action == "status":
                    status = rm.get_status()
                    response = {"status": "success", "result": status}
                else:
                    response = {"status": "error", "result": "Invalid action"}
            except Exception as e:
                response = {"status": "error", "result": str(e)}
            conn.sendall(json.dumps(response).encode())
    except Exception as e:
        print(f"[!] Admin connection error: {e}")
    finally:
        conn.close()
        print(f"[-] Admin disconnected: {addr}")

def start_admin_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, PORT))
    server.listen()
    print(f"[+] Travel DB Replication Admin listening on {HOST}:{PORT}")
    while True:
        conn, addr = server.accept()
        thread = threading.Thread(target=handle_client, args=(conn, addr), daemon=True)
        thread.start()

# start admin server in background thread (daemon)
admin_thread = threading.Thread(target=start_admin_server, daemon=True)
admin_thread.start()

# --- Kafka worker (multithreaded) using the replication manager ---
KAFKA_BROKER = "kafka:9092"
REQUEST_TOPIC = "travel_requests"
RESPONSE_TOPIC = "travel_responses"

consumer = Consumer({
    'bootstrap.servers': KAFKA_BROKER,
    'group.id': 'hotels_group',
    'auto.offset.reset': 'earliest'
})
consumer.subscribe([REQUEST_TOPIC])
producer = Producer({'bootstrap.servers': KAFKA_BROKER})

def process_message(msg):
    try:
        data = json.loads(msg.value().decode('utf-8'))
        city = data.get("city", "")
        limit = data.get("limit", 5)
        print(f"[Thread] Received request for city={city} limit={limit}")
        result = rm.query_by_location("hotels", city, limit)
        if "results" in result:
            # map manager's results into your original response format (type: hotel)
            hotels = []
            for r in result["results"]:
                hotels.append({
                    "id": r.get("id"),
                    "name": r.get("name"),
                    "city": r.get("city"),
                    "rating": r.get("rating"),
                    "info": r.get("info"),
                    "type": "hotel"
                })
            response = {"source": "hotels", "results": hotels}
        else:
            # error from manager
            response = {"source": "hotels", "error": result.get("error", "unknown")}

        producer.produce(RESPONSE_TOPIC, json.dumps(response).encode('utf-8'))
        producer.flush()
        print(f"[Thread] Sent response for city={city}")

    except Exception as e:
        print("Worker exception:", e)

print("Hotels worker running with multithreading + multi-node replication... Waiting for Kafka messages...")

executor = ThreadPoolExecutor(max_workers=5)

try:
    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            print("Kafka Error:", msg.error())
            continue
        executor.submit(process_message, msg)
except KeyboardInterrupt:
    print("Shutting down gracefully...")
finally:
    consumer.close()
    executor.shutdown(wait=True)
