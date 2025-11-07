# db_setup.py
import sqlite3
import os
from datetime import datetime

DB = "travel.db"

if os.path.exists(DB):
    print("Removing existing DB for fresh setup...")
    os.remove(DB)

conn = sqlite3.connect(DB)
c = conn.cursor()

c.executescript("""
CREATE TABLE restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    city TEXT,
    rating REAL,
    info TEXT
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    city TEXT,
    start_time TEXT,
    rating REAL,
    info TEXT
);

CREATE TABLE transport (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    city TEXT,
    type TEXT,
    rating REAL,
    info TEXT
);

CREATE TABLE hotels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    city TEXT,
    rating REAL,
    info TEXT
);

CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    location TEXT,
    itinerary TEXT,
    rating REAL,
    comment TEXT,
    timestamp TEXT
);
""")

restaurants = [
    ("Tandoori Palace", "Jaipur", 4.6, "Famous for tandoori"),
    ("Cafe Nirvana", "Jaipur", 4.2, "Cozy cafe"),
    ("The Spice Route", "Jaipur", 4.8, "Top-rated fine dining"),
    ("Street Bites", "Jaipur", 4.0, "Local street food"),

    ("Beach Shack Delight", "Goa", 4.7, "Seafood and beach vibes"),
    ("Café de Goa", "Goa", 4.5, "Coffee with ocean view"),
    ("Tropical Treats", "Goa", 4.3, "Fusion cuisine with tropical drinks"),

    ("Mountain Café", "Himachal", 4.4, "Scenic café overlooking hills"),
    ("The Apple Orchard", "Himachal", 4.6, "Organic Himachali food"),
    ("Snowline Dine", "Himachal", 4.2, "Warm soups and local dishes"),

    ("Connaught Kitchen", "Delhi", 4.5, "Trendy central spot"),
    ("Dilli Zaika", "Delhi", 4.3, "Traditional North Indian meals"),
    ("Street Treats", "Delhi", 4.1, "Authentic Delhi street food"),

    ("Backwater Bites", "Kerala", 4.7, "Seafood by the houseboats"),
    ("Coconut Grove", "Kerala", 4.4, "Kerala thali and local desserts"),
    ("Spice Harbour", "Kerala", 4.6, "Luxury waterfront dining"),
    
    ("Bay View Café", "Mumbai", 4.5, "Chic seaside restaurant"),
    ("Bollywood Bistro", "Mumbai", 4.3, "Modern Indian fusion"),
    ("Marine Masala", "Mumbai", 4.6, "Best tandoori with ocean breeze"),
]

events = [
    # JAIPUR
    ("Amber Fort Light Show", "Jaipur", "19:00", 4.7, "Historic light show at Amber Fort"),
    ("Rajasthan Folk Night", "Jaipur", "20:30", 4.5, "Local music and dance"),
    ("Hot Air Balloon", "Jaipur", "05:30", 4.9, "Sunrise balloon flights"),

    # GOA
    ("Sunburn Festival", "Goa", "18:00", 4.8, "India's biggest EDM festival"),
    ("Beach Yoga Morning", "Goa", "06:30", 4.6, "Yoga on the beach"),
    ("Carnival Parade", "Goa", "17:00", 4.7, "Colorful floats and live music"),

    # HIMACHAL
    ("Paragliding Festival", "Himachal", "10:00", 4.8, "Bir-Billing adventure event"),
    ("Apple Blossom Fair", "Himachal", "11:00", 4.5, "Local handicrafts and produce"),
    ("Snow Trek Meetup", "Himachal", "07:00", 4.7, "Guided winter treks"),

    # DELHI
    ("Delhi Food Walk", "Delhi", "16:00", 4.6, "Street food exploration"),
    ("India Gate Light Show", "Delhi", "20:00", 4.5, "Spectacular night illumination"),
    ("Old Delhi Heritage Walk", "Delhi", "09:00", 4.4, "Historical walking tour"),

    # KERALA
    ("Boat Race Festival", "Kerala", "14:00", 4.8, "Famous snake boat race"),
    ("Kathakali Night", "Kerala", "19:30", 4.6, "Traditional dance performance"),
    ("Backwater Cruise", "Kerala", "10:00", 4.7, "Day-long houseboat experience"),

    # MUMBAI
    ("Gateway Light Show", "Mumbai", "19:30", 4.5, "Evening laser show"),
    ("Bollywood Tour", "Mumbai", "11:00", 4.7, "Behind-the-scenes experience"),
    ("Marine Drive Marathon", "Mumbai", "06:00", 4.6, "Scenic early morning run"),
]

transports = [
    # JAIPUR
    ("City Taxi Co", "Jaipur", "taxi", 4.1, "Local taxis"),
    ("Pink Metro", "Jaipur", "metro", 4.4, "Convenient metro"),
    ("Heritage Cycle Tours", "Jaipur", "cycle", 4.3, "Guided cycle tours"),

    # GOA
    ("Coastal Cabs", "Goa", "taxi", 4.2, "Beachside taxi service"),
    ("Goa Scooters", "Goa", "scooter", 4.5, "Rent scooters for local travel"),
    ("Ferry Connect", "Goa", "ferry", 4.4, "Inter-island ferry rides"),

    # HIMACHAL
    ("Hillway Cabs", "Himachal", "taxi", 4.3, "Reliable mountain rides"),
    ("Toy Train", "Himachal", "train", 4.8, "Scenic heritage railway"),
    ("Mountain Bikers", "Himachal", "bike", 4.4, "Adventure mountain tours"),

    # DELHI
    ("Delhi Metro", "Delhi", "metro", 4.7, "Fastest city transport"),
    ("RideEasy Cabs", "Delhi", "taxi", 4.2, "Airport and intercity rides"),
    ("Cycle Delhi", "Delhi", "cycle", 4.0, "Green mobility initiative"),

    # KERALA
    ("Backwater Ferry", "Kerala", "ferry", 4.6, "Houseboat transfers"),
    ("Kerala Roadways", "Kerala", "bus", 4.2, "Local and intercity buses"),
    ("Eco Tuk Tuk", "Kerala", "auto", 4.3, "Electric autos for local commute"),

    # MUMBAI
    ("Mumbai Metro", "Mumbai", "metro", 4.5, "Efficient urban travel"),
    ("SeaLink Taxi", "Mumbai", "taxi", 4.4, "Coastal express rides"),
    ("Local Train Express", "Mumbai", "train", 4.6, "Iconic Mumbai suburban trains"),
]

hotels = [
    # JAIPUR
    ("Royal Stay", "Jaipur", 4.3, "Mid-range hotel"),
    ("Heritage Haveli", "Jaipur", 4.7, "Boutique heritage property"),
    ("Budget Inn", "Jaipur", 3.8, "Cheap and cheerful"),

    # GOA
    ("Sea Breeze Resort", "Goa", 4.6, "Beachfront stay"),
    ("Tropical Retreat", "Goa", 4.4, "Luxury villas by the sea"),
    ("Goa Hostel", "Goa", 4.0, "Backpacker-friendly lodging"),

    # HIMACHAL
    ("SnowView Resort", "Himachal", 4.5, "Overlooking the Himalayas"),
    ("Mountain Bliss", "Himachal", 4.3, "Cozy wooden cottages"),
    ("Chill Inn", "Himachal", 4.0, "Budget hotel near main bazaar"),

    # DELHI
    ("Capital Comfort", "Delhi", 4.4, "Centrally located business hotel"),
    ("Luxe Residency", "Delhi", 4.6, "Upscale with premium dining"),
    ("Traveler's Nest", "Delhi", 3.9, "Affordable stay near metro"),

    # KERALA
    ("Lotus Lake Resort", "Kerala", 4.7, "Backwater luxury"),
    ("Coconut Palm Stay", "Kerala", 4.5, "Eco-friendly resort"),
    ("Budget Bay Inn", "Kerala", 4.0, "Value for money rooms"),

    # MUMBAI
    ("Skyline Suites", "Mumbai", 4.6, "Modern comfort downtown"),
    ("Marine Residency", "Mumbai", 4.4, "Great sea view rooms"),
    ("Urban Capsule", "Mumbai", 4.1, "Trendy capsule hostel"),
]

c.executemany("INSERT INTO restaurants (name, city, rating, info) VALUES (?, ?, ?, ?)", restaurants)
c.executemany("INSERT INTO events (name, city, start_time, rating, info) VALUES (?, ?, ?, ?, ?)", events)
c.executemany("INSERT INTO transport (name, city, type, rating, info) VALUES (?, ?, ?, ?, ?)", transports)
c.executemany("INSERT INTO hotels (name, city, rating, info) VALUES (?, ?, ?, ?)", hotels)

conn.commit()
conn.close()

os.makedirs("hadoop_ingest", exist_ok=True)
print("✅ Setup complete. Database created: travel.db with multiple cities.")
