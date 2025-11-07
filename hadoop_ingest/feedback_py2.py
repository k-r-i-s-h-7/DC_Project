#!/usr/bin/env python
import sys
import json

def mapper():
    for line in sys.stdin:
        try:
            data = json.loads(line.strip())
            city = data.get('location', 'unknown')
            rating = float(data.get('rating', 0))
            print "%s\t%s" % (city, rating)
        except Exception as e:
            print >> sys.stderr, "ERROR: %s" % e

def reducer():
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
                avg_rating = total_rating / count
                print "%s\t%.2f\t%d" % (current_city, avg_rating, count)
            
            current_city = city
            total_rating = rating
            count = 1
    
    if current_city:
        avg_rating = total_rating / count
        print "%s\t%.2f\t%d" % (current_city, avg_rating, count)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "reduce":
        reducer()
    else:
        mapper()
