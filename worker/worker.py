import os
import json
import random
import socket
import sqlite3
import threading
from concurrent.futures import ThreadPoolExecutor
from confluent_kafka import Consumer, Producer


# ---------------------------------------------------------
#   TRAVEL DB REPLICATION MANAGER  (unchanged, cleaned)
# ---------------------------------------------------------
class TravelDBReplicationManager:
    def __init__(self):
        self.databases = []
        self.crashed_nodes = set()
        self.lock = threading.Lock()

    def add_node(self):
        db_name = f"travel_node_{len(self.databases) + 1}.sqlite"
        self.databases.append(db_name)

        conn = sqlite3.connect(db_name)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hotels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                city TEXT NOT NULL,
                rating REAL,
                info TEXT
            )
        """)

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
        hotels = [
            ("Hotel A", "Delhi", 4.5, "Luxury hotel"),
            ("Hotel B", "Delhi", 4.2, "Comfortable stay"),
            ("Hotel C", "Mumbai", 4.7, "5-star hotel"),
            ("Hotel D", "Mumbai", 4.0, "Budget hotel"),
            ("Hotel E", "Bangalore", 4.3, "Business-friendly"),
            ("Hotel F", "Bangalore", 4.6, "Top-rated business hotel"),
            ("Hotel G", "Pune", 4.1, "Cozy & affordable")
        ]

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

        for db in self.databases:
            if db in self.crashed_nodes:
                continue

            conn = sqlite3.connect(db)
            cursor = conn.cursor()

            cursor.execute("DELETE FROM hotels")
            cursor.executemany(
                "INSERT INTO hotels (name, city, rating, info) VALUES (?, ?, ?, ?)",
                hotels
            )

            cursor.execute("DELETE FROM restaurants")
            cursor.executemany(
                "INSERT INTO restaurants (name, location, price) VALUES (?, ?, ?)",
                restaurants
            )

            cursor.execute("DELETE FROM transport_routes")
            cursor.executemany(
                "INSERT INTO transport_routes (start_location, end_location, airline, price) VALUES (?, ?, ?, ?)",
                transport_routes
            )

            cursor.execute("DELETE FROM events")
            cursor.executemany(
                "INSERT INTO events (name, location, date, category) VALUES (?, ?, ?, ?)",
                events
            )

            cursor.execute("DELETE FROM attractions")
            cursor.executemany(
                "INSERT INTO attractions (name, location, category) VALUES (?, ?, ?)",
                attractions
            )

            conn.commit()
            conn.close()

        print("[✓] Initial data replicated across nodes")

    def query_by_location(self, table, location, limit=5):
        if not self.databases:
            return {"error": "No nodes available"}

        if random.random() < 0.05:  # simulate node crash
            healthy = [db for db in self.databases if db not in self.crashed_nodes]
            if healthy:
                crashed = random.choice(healthy)
                self.crashed_nodes.add(crashed)
                print(f"[!] Simulated crash: {crashed}")

        attempts = 0
        while attempts < len(self.databases):
            node = random.choice(self.databases)
            if node in self.crashed_nodes:
                attempts += 1
                continue
            return self._execute_query(node, table, location, limit)

        return {"error": "All nodes crashed"}

    def _execute_query(self, db, table, location, limit=5):
        try:
            conn = sqlite3.connect(db)
            cursor = conn.cursor()

            queries = {
                "hotels": (
                    "SELECT id, name, city, rating, info FROM hotels WHERE city=? ORDER BY rating DESC LIMIT ?",
                    ["id", "name", "city", "rating", "info"]
                ),
                "restaurants": (
                    "SELECT name, location, price FROM restaurants WHERE location=?",
                    ["name", "location", "price"]
                ),
                "events": (
                    "SELECT name, location, date, category FROM events WHERE location=?",
                    ["name", "location", "date", "category"]
                ),
                "transport": (
                    "SELECT start_location, end_location, airline, price FROM transport_routes WHERE start_location=? OR end_location=?",
                    ["start_location", "end_location", "airline", "price"]
                )
            }

            if table not in queries:
                return {"error": "Invalid table"}

            query, cols = queries[table]

            if table == "transport":
                cursor.execute(query, (location, location))
            else:
                cursor.execute(query, (location,))

            rows = cursor.fetchall()
            conn.close()

            print(f"[✓] {db} → {len(rows)} rows for {table}")

            return {
                "node": db,
                "results": [dict(zip(cols, row)) for row in rows]
            }

        except Exception as e:
            return {"error": str(e)}

    def replicate_node(self, source_db):
        if source_db not in self.databases:
            raise ValueError("Node does not exist")
        if source_db in self.crashed_nodes:
            raise ValueError("Cannot replicate crashed node")

        new_node = f"travel_node_{len(self.databases) + 1}.sqlite"

        src = sqlite3.connect(source_db)
        dst = sqlite3.connect(new_node)

        with src:
            src.backup(dst)

        src.close()
        dst.close()

        self.databases.append(new_node)
        print(f"[✓] Replicated {source_db} → {new_node}")

        return new_node

    def get_status(self):
        return {
            "total_nodes": len(self.databases),
            "active_nodes": len([db for db in self.databases if db not in self.crashed_nodes]),
            "crashed_nodes": list(self.crashed_nodes),
            "nodes": self.databases
        }


# ---------------------------------------------------------
#   CREATE REPLICATION MANAGER + SEED NODES
# ---------------------------------------------------------
rm = TravelDBReplicationManager()
rm.add_node()
rm.add_node()
rm.add_node()
rm.initialize_data()


# ---------------------------------------------------------
#   ADMIN TCP SERVER
# ---------------------------------------------------------
HOST = "127.0.0.1"
PORT = 65432

def handle_client(conn, addr):
    print(f"[+] Admin connected: {addr}")

    try:
        while True:
            data = conn.recv(4096)
            if not data:
                break

            req = json.loads(data.decode())
            action = req.get("action")
            response = {"status": "error"}

            try:
                if action == "query":
                    table = req["table"]
                    location = req["location"]
                    limit = req.get("limit", 5)
                    response = {"status": "success", "result": rm.query_by_location(table, location, limit)}

                elif action == "status":
                    response = {"status": "success", "result": rm.get_status()}

                elif action == "replicate":
                    new_node = rm.replicate_node(req["node"])
                    response = {"status": "success", "result": new_node}

                else:
                    response = {"status": "error", "result": "Invalid action"}

            except Exception as e:
                response = {"status": "error", "result": str(e)}

            conn.sendall(json.dumps(response).encode())

    finally:
        conn.close()
        print(f"[-] Admin disconnected: {addr}")


def start_admin_server():
    server = socket.socket()
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, PORT))
    server.listen()
    print(f"[+] Admin server listening on {HOST}:{PORT}")

    while True:
        conn, addr = server.accept()
        threading.Thread(target=handle_client, args=(conn, addr), daemon=True).start()


threading.Thread(target=start_admin_server, daemon=True).start()


# ---------------------------------------------------------
#   GENERIC KAFKA WORKER (HOTELS / RESTAURANTS / EVENTS / TRANSPORT)
# ---------------------------------------------------------
WORKER_TYPE = os.getenv("WORKER_TYPE", "hotels")

TOPICS = {
    "hotels": ("travel_hotels_requests", "travel_hotels_responses"),
    "restaurants": ("travel_restaurants_requests", "travel_restaurants_responses"),
    "events": ("travel_events_requests", "travel_events_responses"),
    "transport": ("travel_transport_requests", "travel_transport_responses")
}

REQ_TOPIC, RES_TOPIC = TOPICS[WORKER_TYPE]

consumer = Consumer({
    "bootstrap.servers": "kafka:9092",
    "group.id": f"{WORKER_TYPE}_group",
    "auto.offset.reset": "earliest"
})

producer = Producer({"bootstrap.servers": "kafka:9092"})

consumer.subscribe([REQ_TOPIC])

executor = ThreadPoolExecutor(max_workers=5)


def format_results(table, results):
    formatted = []

    if table == "hotels":
        for r in results:
            formatted.append({
                "id": r["id"],
                "name": r["name"],
                "city": r["city"],
                "rating": r["rating"],
                "info": r["info"],
                "type": "hotel"
            })

    if table == "restaurants":
        for r in results:
            formatted.append({
                "name": r["name"],
                "location": r["location"],
                "price": r["price"],
                "type": "restaurant"
            })

    if table == "events":
        for r in results:
            formatted.append({
                "name": r["name"],
                "location": r["location"],
                "date": r["date"],
                "category": r["category"],
                "type": "event"
            })

    if table == "transport":
        for r in results:
            formatted.append({
                "start": r["start_location"],
                "end": r["end_location"],
                "airline": r["airline"],
                "price": r["price"],
                "type": "transport"
            })

    return formatted


def process_message(msg):
    try:
        req = json.loads(msg.value().decode())
        location = req.get("location")
        limit = req.get("limit", 5)

        print(f"[{WORKER_TYPE}] request → {location}")

        db_result = rm.query_by_location(WORKER_TYPE, location, limit)

        if "results" in db_result:
            response = {
                "source": WORKER_TYPE,
                "results": format_results(WORKER_TYPE, db_result["results"])
            }
        else:
            response = {"source": WORKER_TYPE, "error": db_result.get("error")}

        producer.produce(RES_TOPIC, json.dumps(response).encode())
        producer.flush()

        print(f"[{WORKER_TYPE}] response sent")

    except Exception as e:
        print(f"[{WORKER_TYPE}] worker error: {e}")


print(f"[✓] {WORKER_TYPE.upper()} WORKER ONLINE → {REQ_TOPIC}")

while True:
    msg = consumer.poll(1)
    if msg and not msg.error():
        executor.submit(process_message, msg)
