#!/usr/bin/env python3
"""
Generate sample feedback JSON files in **line-delimited format** 
so they can be processed correctly by Hadoop Streaming.
"""

import json
import os
import random
import sqlite3
import time
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB = "travel.db"
INGEST_FOLDER = "./hadoop_ingest"
os.makedirs(INGEST_FOLDER, exist_ok=True)

def get_city_data():
    """Fetch city-wise data from travel.db"""
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    
    cities = {}
    for table in ["restaurants", "events", "transport", "hotels"]:
        c.execute(f"SELECT id, name, city, rating, info FROM {table}")
        for row in c.fetchall():
            city = row[2]
            item = {
                "id": row[0],
                "name": row[1],
                "city": city,
                "rating": row[3],
                "info": row[4],
                "type": table
            }
            cities.setdefault(city, []).append(item)
    conn.close()
    return cities


def generate_itinerary(city, city_data, max_items=4):
    """Generate a realistic itinerary for a given city"""
    available_items = [item for item in city_data[city]]
    categories = ["restaurants", "hotels", "transport", "events"]
    itinerary = []
    
    for cat in categories:
        options = [i for i in available_items if i["type"] == cat]
        if options:
            chosen = random.choice(options)
            itinerary.append(chosen)
    
    random.shuffle(itinerary)
    return itinerary[:max_items]


def generate_feedback_files(num_records=100):
    """Generate feedback JSON files in line-delimited format"""
    city_data = get_city_data()
    cities = list(city_data.keys())
    
    print(f"Generating {num_records} feedback records from {len(cities)} cities...")
    
    for i in range(num_records):
        city = random.choice(cities)
        itinerary = generate_itinerary(city, city_data)
        
        feedback = {
            "user_id": f"user_{random.randint(1, 1000)}",
            "location": city,
            "itinerary": itinerary,
            "rating": round(random.uniform(2.5, 5.0), 1),
            "comment": random.choice([
                "Fantastic trip!",
                "Good but could be improved",
                "Loved every moment",
                "Food was excellent",
                "Stay was comfortable and clean",
                "Would recommend this itinerary!"
            ]),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        filename = f"feedback_{datetime.utcnow().strftime('%Y%m%dT%H%M%S%f')}.json"
        filepath = os.path.join(INGEST_FOLDER, filename)
        
        # Write as a single line
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(json.dumps(feedback, ensure_ascii=False) + "\n")
        
        print(f"✓ Saved feedback {i+1}/{num_records} → {filename}")
        time.sleep(0.01)  # slight delay for unique timestamps

    print("\n✅ Feedback generation complete.")
    print(f"🗂 Files saved in: {INGEST_FOLDER}")
    print(f"📊 Next steps:")
    print(f"1. Upload data to Hadoop: ./upload_feedback.sh")
    print(f"2. Run MapReduce job: ./run_mapreduce.sh")


if __name__ == "__main__":
    import sys
    num = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    generate_feedback_files(num)
