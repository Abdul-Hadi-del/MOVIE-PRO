"""One-time script: SQLite (movies.db) se movies ko Firestore mein copy karta hai.
Isko sirf EK BAAR chalana hai."""

import sqlite3
from firebase_config import db

conn = sqlite3.connect("movies.db")
cursor = conn.cursor()
cursor.execute("SELECT title, year, rating, genre FROM movies")
rows = cursor.fetchall()
conn.close()

movies_ref = db.collection("movies")

count = 0
for title, year, rating, genre in rows:
    # Firestore mein document ID khud movie ka title-based rakhte hain (lowercase, spaces hata ke)
    doc_id = title.lower().replace(" ", "_").replace(":", "")
    movies_ref.document(doc_id).set({
        "title": title,
        "year": year,
        "rating": rating,
        "genre": genre,
    })
    count += 1
    print(f"Added: {title}")

print(f"\n✅ Done! {count} movies migrated to Firestore.")