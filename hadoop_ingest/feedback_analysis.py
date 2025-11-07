#!/usr/bin/env python3
"""
MapReduce job to analyze travel feedback data
Calculates average ratings per location and item type
"""
import sys
import json

def mapper():
    """
    Reads JSON feedback records and emits key-value pairs
    Key format: location|item_type
    Value: rating
    """
    for line in sys.stdin:
        try:
            data = json.loads(line.strip())
            location = data.get("location", "unknown")
            rating = float(data.get("rating", 0))
            itinerary = data.get("itinerary", [])
            
            # Emit location-level rating
            print(f"{location}\t{rating}")
            
            # Emit ratings for each item type in itinerary
            for item in itinerary:
                item_type = item.get("type", "unknown")
                item_name = item.get("name", "unknown")
                key = f"{location}|{item_type}"
                print(f"{key}\t{rating}")
                
                # Also track individual item ratings
                item_key = f"{location}|{item_type}|{item_name}"
                print(f"{item_key}\t{rating}")
                
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            # Log errors to stderr (will appear in Hadoop logs)
            print(f"ERROR: {e} - Line: {line}", file=sys.stderr)
            continue

def reducer():
    """
    Aggregates ratings by key and calculates averages
    Output format: key TAB count TAB avg_rating
    """
    current_key = None
    ratings = []
    
    for line in sys.stdin:
        try:
            key, rating = line.strip().split('\t')
            rating = float(rating)
            
            if current_key == key:
                ratings.append(rating)
            else:
                if current_key is not None:
                    avg = sum(ratings) / len(ratings)
                    count = len(ratings)
                    print(f"{current_key}\t{count}\t{avg:.2f}")
                
                current_key = key
                ratings = [rating]
                
        except (ValueError, IndexError) as e:
            print(f"ERROR: {e} - Line: {line}", file=sys.stderr)
            continue
    
    # Don't forget the last key
    if current_key is not None:
        avg = sum(ratings) / len(ratings)
        count = len(ratings)
        print(f"{current_key}\t{count}\t{avg:.2f}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "map":
            mapper()
        elif sys.argv[1] == "reduce":
            reducer()
        else:
            print("Usage: feedback_analysis.py [map|reduce]")
            sys.exit(1)
    else:
        # Default to mapper for Hadoop Streaming
        mapper()