#!/usr/bin/env python
import sys
import json

def emit(city, rating):
    """Emit a tab-separated city and rating."""
    try:
        rating = float(rating)
        print "%s\t%s" % (city, rating)
    except Exception as e:
        print >> sys.stderr, "ERROR converting rating:", e

def mapper():
    buffer = ""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        buffer += line
        try:
            data = json.loads(buffer)
            buffer = ""  # clear buffer if parsed successfully

            # Emit the top-level rating
            city = data.get('location', 'unknown')
            emit(city, data.get('rating', 0))

            # Emit ratings for itinerary items
            for item in data.get('itinerary', []):
                item_city = item.get('city', city)
                emit(item_city, item.get('rating', 0))
        except Exception:
            # If JSON is incomplete (multi-line), keep reading next lines
            buffer += " "
            continue

def reducer():
    current_city = None
    total_rating = 0
    count = 0

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            city, rating = line.split("\t")
            rating = float(rating)
        except Exception:
            continue

        if current_city == city:
            total_rating += rating
            count += 1
        else:
            if current_city:
                avg_rating = total_rating / count
                print "City: %s" % current_city
                print "  Average Rating: %.2f" % avg_rating
                print "  Feedback Count: %d" % count
                print "---"
            current_city = city
            total_rating = rating
            count = 1

    if current_city:
        avg_rating = total_rating / count
        print "City: %s" % current_city
        print "  Average Rating: %.2f" % avg_rating
        print "  Feedback Count: %d" % count

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "reduce":
        reducer()
    else:
        mapper()
