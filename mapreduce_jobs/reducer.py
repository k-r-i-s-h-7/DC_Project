#!/usr/bin/env python3
import sys

current_location = None
sum_rating = 0
count = 0

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    parts = line.split("\t")
    if len(parts) != 2:
        continue
    location, rating_str = parts
    try:
        rating = float(rating_str)
    except:
        continue

    if current_location == location:
        sum_rating += rating
        count += 1
    else:
        if current_location:
            print(f"{current_location}\t{sum_rating / count:.2f}")
        current_location = location
        sum_rating = rating
        count = 1

if current_location:
    print(f"{current_location}\t{sum_rating / count:.2f}")
