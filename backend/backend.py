from firebase_config import db
from firebase_admin import firestore

MOVIES_COLLECTION = "movies"


def _doc_id(title):
    """Movie title ko Firestore-safe document ID mein convert karta hai."""
    return title.lower().replace(" ", "_").replace(":", "")


def add_movie(title, year, rating, genre, added_by=None):
    year = int(year)
    rating = float(rating)

    doc_id = _doc_id(title)
    data = {
        "title": title,
        "year": year,
        "rating": rating,
        "genre": genre,
    }
    if added_by:
        data["added_by"] = added_by

    db.collection(MOVIES_COLLECTION).document(doc_id).set(data)


def delete_movie(title):
    doc_id = _doc_id(title)
    doc_ref = db.collection(MOVIES_COLLECTION).document(doc_id)

    if doc_ref.get().exists:
        doc_ref.delete()
        return True
    return False


def view_movies():
    docs = db.collection(MOVIES_COLLECTION).stream()
    return [doc.to_dict() for doc in docs]


def bubble_sort(key="title"):
    movies = view_movies()
    n = len(movies)
    for i in range(n):
        for j in range(0, n - i - 1):
            if str(movies[j][key]).lower() > str(movies[j + 1][key]).lower():
                movies[j], movies[j + 1] = movies[j + 1], movies[j]
    return movies


def linear_search(title):
    movies = view_movies()
    for movie in movies:
        if movie["title"].lower() == title.lower():
            return movie
    return None


def filter_movies(search="", genre="", min_year=None, max_year=None, min_rating=None, max_rating=None):
    """Movies ko multiple filters ke basis pe filter karta hai."""
    movies = view_movies()
    result = []

    for m in movies:
        if search and search.lower() not in m["title"].lower():
            continue
        if genre and genre.lower() != m["genre"].lower():
            continue
        if min_year is not None and m["year"] < min_year:
            continue
        if max_year is not None and m["year"] > max_year:
            continue
        if min_rating is not None and m["rating"] < min_rating:
            continue
        if max_rating is not None and m["rating"] > max_rating:
            continue
        result.append(m)

    return result


def get_all_genres():
    """Saari unique genres ki list deta hai (dropdown ke liye)."""
    movies = view_movies()
    genres = sorted(set(m["genre"] for m in movies))
    return genres


# ---------------- Watchlist ----------------

def add_to_watchlist(user_id, movie_title):
    doc_id = _doc_id(movie_title)
    db.collection("users").document(user_id).collection("watchlist").document(doc_id).set({
        "title": movie_title,
        "added_at": firestore.SERVER_TIMESTAMP,
    })


def remove_from_watchlist(user_id, movie_title):
    doc_id = _doc_id(movie_title)
    ref = db.collection("users").document(user_id).collection("watchlist").document(doc_id)
    if ref.get().exists:
        ref.delete()
        return True
    return False


def get_watchlist(user_id):
    docs = db.collection("users").document(user_id).collection("watchlist").stream()
    titles = [doc.to_dict()["title"] for doc in docs]
    all_movies = view_movies()
    return [m for m in all_movies if m["title"] in titles]


# ---------------- Watched ----------------

def mark_as_watched(user_id, movie_title):
    doc_id = _doc_id(movie_title)
    db.collection("users").document(user_id).collection("watched").document(doc_id).set({
        "title": movie_title,
        "watched_at": firestore.SERVER_TIMESTAMP,
    })


def unmark_watched(user_id, movie_title):
    doc_id = _doc_id(movie_title)
    ref = db.collection("users").document(user_id).collection("watched").document(doc_id)
    if ref.get().exists:
        ref.delete()
        return True
    return False


def get_watched(user_id):
    docs = db.collection("users").document(user_id).collection("watched").stream()
    titles = [doc.to_dict()["title"] for doc in docs]
    all_movies = view_movies()
    return [m for m in all_movies if m["title"] in titles]


# ---------------- Reviews ----------------

def add_review(user_id, user_email, movie_title, rating, review_text):
    doc_id = _doc_id(movie_title)
    review_ref = (
        db.collection(MOVIES_COLLECTION)
        .document(doc_id)
        .collection("reviews")
        .document(user_id)
    )
    review_ref.set({
        "user_email": user_email,
        "rating": int(rating),
        "review_text": review_text,
        "created_at": firestore.SERVER_TIMESTAMP,
    })


def get_reviews(movie_title):
    doc_id = _doc_id(movie_title)
    docs = (
        db.collection(MOVIES_COLLECTION)
        .document(doc_id)
        .collection("reviews")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .stream()
    )
    reviews = [doc.to_dict() | {"user_id": doc.id} for doc in docs]

    if reviews:
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    else:
        avg_rating = None

    return {"reviews": reviews, "average_rating": avg_rating, "count": len(reviews)}


def delete_review(user_id, movie_title):
    doc_id = _doc_id(movie_title)
    ref = (
        db.collection(MOVIES_COLLECTION)
        .document(doc_id)
        .collection("reviews")
        .document(user_id)
    )
    if ref.get().exists:
        ref.delete()
        return True
    return False


# ---------------- Profile: Stats ----------------

def get_user_stats(user_id):
    """User ke liye profile stats calculate karta hai."""
    watched = get_watched(user_id)
    watchlist = get_watchlist(user_id)

    genre_counts = {}
    for m in watched:
        genre_counts[m["genre"]] = genre_counts.get(m["genre"], 0) + 1
    favorite_genre = max(genre_counts, key=genre_counts.get) if genre_counts else None

    all_movies = view_movies()
    user_ratings = []
    for m in all_movies:
        doc_id = _doc_id(m["title"])
        review_doc = (
            db.collection(MOVIES_COLLECTION)
            .document(doc_id)
            .collection("reviews")
            .document(user_id)
            .get()
        )
        if review_doc.exists:
            user_ratings.append(review_doc.to_dict()["rating"])

    avg_rating_given = sum(user_ratings) / len(user_ratings) if user_ratings else None

    return {
        "total_watched": len(watched),
        "total_watchlist": len(watchlist),
        "total_reviews": len(user_ratings),
        "favorite_genre": favorite_genre,
        "avg_rating_given": round(avg_rating_given, 1) if avg_rating_given else None,
    }


# ---------------- Profile: Badges ----------------

def _tier_badge(count, thresholds, category_name, icon_base):
    """count aur thresholds (bronze, silver, gold) dekh kar highest earned tier deta hai."""
    bronze, silver, gold = thresholds
    if count >= gold:
        return {"name": f"{category_name}", "tier": "Gold", "icon": "🥇", "emoji": icon_base, "count": count, "next": None}
    elif count >= silver:
        return {"name": f"{category_name}", "tier": "Silver", "icon": "🥈", "emoji": icon_base, "count": count, "next": gold}
    elif count >= bronze:
        return {"name": f"{category_name}", "tier": "Bronze", "icon": "🥉", "emoji": icon_base, "count": count, "next": silver}
    return None


def get_user_badges(user_id):
    """User ki activity ke basis pe tiered badges (Bronze/Silver/Gold) calculate karta hai."""
    watched = get_watched(user_id)

    all_movies = view_movies()
    user_review_count = 0
    for m in all_movies:
        doc_id = _doc_id(m["title"])
        review_doc = (
            db.collection(MOVIES_COLLECTION)
            .document(doc_id)
            .collection("reviews")
            .document(user_id)
            .get()
        )
        if review_doc.exists:
            user_review_count += 1

    genre_counts = {}
    for m in watched:
        genre_counts[m["genre"]] = genre_counts.get(m["genre"], 0) + 1

    badges = []

    watch_badge = _tier_badge(len(watched), (5, 15, 30), "Movie Buff", "🍿")
    if watch_badge:
        badges.append(watch_badge)

    review_badge = _tier_badge(user_review_count, (3, 10, 20), "Critic", "✍️")
    if review_badge:
        badges.append(review_badge)

    genre_icons = {
        "Sci-Fi": "🚀", "Horror": "👻", "Action": "💥", "Drama": "🎭",
        "Comedy": "😂", "Animation": "🎨", "Romance": "💝",
        "Crime": "🔍", "Thriller": "😱", "Adventure": "🗺️",
        "Fantasy": "🧙", "Family": "👨‍👩‍👧",
    }
    for genre, count in genre_counts.items():
        icon = genre_icons.get(genre, "🎬")
        genre_badge = _tier_badge(count, (3, 7, 15), f"{genre} Master", icon)
        if genre_badge:
            badges.append(genre_badge)

    return badges


# ---------------- Group Watch Rooms ----------------

import random
import string


def _generate_room_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def create_room(host_id, host_email, duration_seconds=120):
    code = _generate_room_code()
    room_ref = db.collection("rooms").document(code)

    # Ensure code is unique (very unlikely clash, but safe)
    while room_ref.get().exists:
        code = _generate_room_code()
        room_ref = db.collection("rooms").document(code)

    room_ref.set({
        "code": code,
        "host_id": host_id,
        "host_email": host_email,
        "status": "open",  # open -> voting -> closed
        "duration_seconds": duration_seconds,
        "created_at": firestore.SERVER_TIMESTAMP,
        "winner": None,
    })
    return code


def get_room(code):
    doc = db.collection("rooms").document(code).get()
    if not doc.exists:
        return None
    room = doc.to_dict()

    picks_docs = db.collection("rooms").document(code).collection("picks").stream()
    picks = [p.to_dict() | {"pick_id": p.id} for p in picks_docs]

    votes_docs = db.collection("rooms").document(code).collection("votes").stream()
    votes = [v.to_dict() for v in votes_docs]

    vote_counts = {}
    for v in votes:
        vote_counts[v["pick_id"]] = vote_counts.get(v["pick_id"], 0) + 1

    for p in picks:
        p["vote_count"] = vote_counts.get(p["pick_id"], 0)

    room["picks"] = picks
    room["total_votes"] = len(votes)
    return room


def add_pick_to_room(code, user_id, user_email, title, poster, year, genre):
    doc_id = _doc_id(title)
    db.collection("rooms").document(code).collection("picks").document(doc_id).set({
        "title": title,
        "poster": poster,
        "year": year,
        "genre": genre,
        "added_by": user_email,
        "added_by_id": user_id,
    })


def cast_vote(code, user_id, pick_id):
    # Ek user ek hi vote de sakta hai (overwrite hoga agar dobara vote kare)
    db.collection("rooms").document(code).collection("votes").document(user_id).set({
        "pick_id": pick_id,
        "voted_at": firestore.SERVER_TIMESTAMP,
    })


def close_room_voting(code):
    """Voting close karke winner decide karta hai. Transaction-safe hai duplicate calls ke against."""
    room_ref = db.collection("rooms").document(code)

    @firestore.transactional
    def _close_transaction(transaction):
        snapshot = room_ref.get(transaction=transaction)
        if not snapshot.exists:
            return None
        data = snapshot.to_dict()
        if data["status"] == "closed":
            return "already_closed"
        transaction.update(room_ref, {"status": "closing"})  # lock immediately
        return "proceed"

    transaction = db.transaction()
    result = _close_transaction(transaction)

    if result is None:
        return None

    room = get_room(code)
    if not room or not room["picks"]:
        return None

    if result == "already_closed":
        winner_pick = next((p for p in room["picks"] if p["title"] == room["winner"]), room["picks"][0])
        return {"winner": winner_pick, "was_tie": False, "tied_picks": [], "already_closed": True}

    max_votes = max(p["vote_count"] for p in room["picks"])
    top_picks = [p for p in room["picks"] if p["vote_count"] == max_votes]

    winner = random.choice(top_picks)
    is_tie = len(top_picks) > 1

    room_ref.update({
        "status": "closed",
        "winner": winner["title"],
    })

    votes_docs = db.collection("rooms").document(code).collection("votes").stream()
    participant_ids = {v.id for v in votes_docs}
    for pick in room["picks"]:
        if pick.get("added_by_id"):
            participant_ids.add(pick["added_by_id"])

    for uid in participant_ids:
        db.collection("users").document(uid).collection("room_history").add({
            "room_code": code,
            "winner_title": winner["title"],
            "winner_poster": winner.get("poster"),
            "was_tie": is_tie,
            "closed_at": firestore.SERVER_TIMESTAMP,
        })

    return {"winner": winner, "was_tie": is_tie, "tied_picks": top_picks if is_tie else []}


def get_room_history(user_id):
    docs = (
        db.collection("users")
        .document(user_id)
        .collection("room_history")
        .order_by("closed_at", direction=firestore.Query.DESCENDING)
        .limit(10)
        .stream()
    )
    return [d.to_dict() for d in docs]

# ---------------- Watch Party Scheduler ----------------

def schedule_watch_party(user_id, movie_title, poster, watch_datetime_iso, note):
    doc_ref = db.collection("users").document(user_id).collection("watch_parties").document()
    doc_ref.set({
        "movie_title": movie_title,
        "poster": poster,
        "watch_datetime": watch_datetime_iso,  # ISO string, e.g. "2026-07-25T21:00"
        "note": note,
        "reminder_sent": False,
        "created_at": firestore.SERVER_TIMESTAMP,
    })
    return doc_ref.id


def get_watch_parties(user_id):
    docs = (
        db.collection("users")
        .document(user_id)
        .collection("watch_parties")
        .order_by("watch_datetime")
        .stream()
    )
    return [d.to_dict() | {"id": d.id} for d in docs]


def delete_watch_party(user_id, party_id):
    ref = db.collection("users").document(user_id).collection("watch_parties").document(party_id)
    if ref.get().exists:
        ref.delete()
        return True
    return False


def mark_reminder_sent(user_id, party_id):
    db.collection("users").document(user_id).collection("watch_parties").document(party_id).update({
        "reminder_sent": True,
    })


def get_taste_profile(user_id):
    """User ki watched movies se genre-wise percentage breakdown nikaalta hai."""
    watched = get_watched(user_id)

    if not watched:
        return {"labels": [], "values": [], "total_watched": 0}

    genre_counts = {}
    for m in watched:
        genre_counts[m["genre"]] = genre_counts.get(m["genre"], 0) + 1

    total = len(watched)
    labels = list(genre_counts.keys())
    values = [round((genre_counts[g] / total) * 100, 1) for g in labels]

    return {"labels": labels, "values": values, "total_watched": total}

def get_compatibility(user_id, friend_uid):
    """Do users ki watched movies compare karke ek 'compatibility %' nikaalta hai."""
    my_watched = get_watched(user_id)
    friend_watched = get_watched(friend_uid)

    my_titles = {m["title"] for m in my_watched}
    friend_titles = {m["title"] for m in friend_watched}

    common_titles = my_titles & friend_titles
    all_titles = my_titles | friend_titles

    # Jaccard similarity for common movies
    movie_overlap_score = (len(common_titles) / len(all_titles) * 100) if all_titles else 0

    # Genre taste similarity (cosine-ish, simplified)
    def genre_vector(watched):
        counts = {}
        for m in watched:
            counts[m["genre"]] = counts.get(m["genre"], 0) + 1
        total = len(watched) or 1
        return {g: c / total for g, c in counts.items()}

    my_vec = genre_vector(my_watched)
    friend_vec = genre_vector(friend_watched)
    all_genres = set(my_vec.keys()) | set(friend_vec.keys())

    if all_genres:
        dot = sum(my_vec.get(g, 0) * friend_vec.get(g, 0) for g in all_genres)
        my_mag = sum(v ** 2 for v in my_vec.values()) ** 0.5
        friend_mag = sum(v ** 2 for v in friend_vec.values()) ** 0.5
        genre_similarity = (dot / (my_mag * friend_mag) * 100) if my_mag and friend_mag else 0
    else:
        genre_similarity = 0

    # Combined score: 40% common movies, 60% genre taste
    final_score = round((movie_overlap_score * 0.4) + (genre_similarity * 0.6), 1)

    return {
        "compatibility": min(final_score, 100),
        "common_movies": sorted(common_titles),
        "common_count": len(common_titles),
        "genre_similarity": round(genre_similarity, 1),
    }