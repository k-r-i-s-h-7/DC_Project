#!/usr/bin/env python3
import sys
import json
from collections import defaultdict

def mapper():
    """Map function: Extract city and rating from feedback"""
    for line in sys.stdin:
        try:
            data = json.loads(line.strip())
            city = data.get('location', 'unknown')
            rating = float(data.get('rating', 0))
            
            # Emit (city, rating) pairs
            print(f"{city}\t{rating}")
        except Exception as e:
            # Log errors to stderr
            print(f"ERROR: {e}", file=sys.stderr)

def reducer():
    """Reduce function: Calculate average rating per city"""
    current_city = None
    total_rating = 0
    count = 0
    
    for line in sys.stdin:
        city, rating = line.strip().split('\t')
        rating = float(rating)
        
        if current_city == city:
            total_rating += rating
            count += 1
        else:
            if current_city:
                # Emit average for previous city
                avg_rating = total_rating / count
                print(f"City : {current_city}\n\tRating : {avg_rating:.2f}\n\tFeedback Count : {count}")
            
            current_city = city
            total_rating = rating
            count = 1
    
    # Don't forget the last city
    if current_city:
        avg_rating = total_rating / count
        print(f"{current_city}\t{avg_rating:.2f}\t{count}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "reduce":
        reducer()
    else:
        mapper()