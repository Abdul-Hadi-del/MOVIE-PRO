from dotenv import load_dotenv
import os

load_dotenv()
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import backend
import recommender
from auth_middleware import verify_token
import urllib.request
import urllib.parse
import json
import ssl
import chatbot
from firebase_admin import auth as firebase_auth

try:
    import certifi
    _ssl_context = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _ssl_context = ssl.create_default_context()

app = Flask(__name__)
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
CORS(app, resources={r"/api/*": {"origins": [FRONTEND_URL, "http://localhost:5173"]}}, supports_credentials=True)
TMDB_API_KEY = os.environ.get("TMDB_API_KEY")
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

_poster_cache = {}

_TMDB_GENRE_MAP = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
    27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
    878: "Sci-Fi", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
}


def fetch_poster(title, year=None):
    cache_key = title.lower().strip()
    if cache_key in _poster_cache:
        return _poster_cache[cache_key]

    poster_url = None
    try:
        query = urllib.parse.quote(title)
        url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={query}"
        if year:
            url += f"&year={year}"
        with urllib.request.urlopen(url, timeout=5, context=_ssl_context) as response:
            data = json.loads(response.read().decode("utf-8"))

        results = data.get("results", [])
        if results and results[0].get("poster_path"):
            poster_url = TMDB_IMAGE_BASE + results[0]["poster_path"]
    except Exception:
        poster_url = None

    _poster_cache[cache_key] = poster_url
    return poster_url


def fetch_movie_details(title, year=None):
    try:
        query = urllib.parse.quote(title)
        search_url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={query}"
        if year:
            search_url += f"&year={year}"
        with urllib.request.urlopen(search_url, timeout=5, context=_ssl_context) as response:
            search_data = json.loads(response.read().decode("utf-8"))

        results = search_data.get("results", [])
        if not results:
            return None

        tmdb_id = results[0]["id"]

        detail_url = (
            f"https://api.themoviedb.org/3/movie/{tmdb_id}"
            f"?api_key={TMDB_API_KEY}&append_to_response=videos,credits,similar,watch/providers"
        )
        with urllib.request.urlopen(detail_url, timeout=5, context=_ssl_context) as response:
            data = json.loads(response.read().decode("utf-8"))

        trailer_key = None
        for video in data.get("videos", {}).get("results", []):
            if video.get("site") == "YouTube" and video.get("type") == "Trailer":
                trailer_key = video.get("key")
                break

        cast = [
            {
                "id": c["id"],
                "name": c["name"],
                "character": c.get("character", ""),
                "profile": TMDB_IMAGE_BASE + c["profile_path"] if c.get("profile_path") else None,
            }
            for c in data.get("credits", {}).get("cast", [])[:6]
        ]

        director = None
        for crew_member in data.get("credits", {}).get("crew", []):
            if crew_member.get("job") == "Director":
                director = {
                    "id": crew_member["id"],
                    "name": crew_member["name"],
                    "profile": TMDB_IMAGE_BASE + crew_member["profile_path"] if crew_member.get("profile_path") else None,
                }
                break

        similar = [
            {
                "title": s["title"],
                "year": s.get("release_date", "")[:4],
                "poster": TMDB_IMAGE_BASE + s["poster_path"] if s.get("poster_path") else None,
            }
            for s in data.get("similar", {}).get("results", [])[:6]
        ]

        watch_providers = None
        provider_data = data.get("watch/providers", {}).get("results", {}).get("PK") or \
                         data.get("watch/providers", {}).get("results", {}).get("US")
        if provider_data:
            def _format_providers(key):
                return [
                    {"name": p["provider_name"], "logo": TMDB_IMAGE_BASE + p["logo_path"]}
                    for p in provider_data.get(key, [])
                ]
            watch_providers = {
                "stream": _format_providers("flatrate"),
                "rent": _format_providers("rent"),
                "buy": _format_providers("buy"),
                "link": provider_data.get("link"),
            }

        collection = None
        if data.get("belongs_to_collection"):
            col = data["belongs_to_collection"]
            collection = {
                "id": col["id"],
                "name": col["name"],
                "poster": TMDB_IMAGE_BASE + col["poster_path"] if col.get("poster_path") else None,
            }

        budget = data.get("budget", 0)
        revenue = data.get("revenue", 0)
        box_office = None
        if budget and revenue:
            profit = revenue - budget
            roi_percent = round((profit / budget) * 100, 1)
            box_office = {
                "budget": budget,
                "revenue": revenue,
                "profit": profit,
                "roi_percent": roi_percent,
                "is_hit": profit > 0,
            }

        return {
            "overview": data.get("overview", ""),
            "trailer_key": trailer_key,
            "cast": cast,
            "director": director,
            "similar": similar,
            "poster": TMDB_IMAGE_BASE + data["poster_path"] if data.get("poster_path") else None,
            "collection": collection,
            "box_office": box_office,
            "watch_providers": watch_providers,
        }
    

    except Exception:
        return None


def _format_tmdb_results(results):
    formatted = []
    for r in results:
        genre_ids = r.get("genre_ids", [])
        genre = _TMDB_GENRE_MAP.get(genre_ids[0], "Unknown") if genre_ids else "Unknown"
        formatted.append({
            "tmdb_id": r["id"],
            "title": r.get("title", ""),
            "year": int(r["release_date"][:4]) if r.get("release_date") else None,
            "rating": round(r.get("vote_average", 0), 1),
            "genre": genre,
            "poster": TMDB_IMAGE_BASE + r["poster_path"] if r.get("poster_path") else None,
        })
    return formatted


def tmdb_search(query, page=1):
    try:
        q = urllib.parse.quote(query)
        url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={q}&page={page}"
        with urllib.request.urlopen(url, timeout=5, context=_ssl_context) as response:
            data = json.loads(response.read().decode("utf-8"))
        return _format_tmdb_results(data.get("results", []))
    except Exception:
        return []


def tmdb_popular(page=1):
    try:
        url = f"https://api.themoviedb.org/3/movie/popular?api_key={TMDB_API_KEY}&page={page}"
        with urllib.request.urlopen(url, timeout=5, context=_ssl_context) as response:
            data = json.loads(response.read().decode("utf-8"))
        return _format_tmdb_results(data.get("results", []))
    except Exception:
        return []


def fetch_collection_details(collection_id):
    """TMDB se ek poori franchise/collection ki saari movies laata hai, release date ke hisab se sorted."""
    try:
        url = f"https://api.themoviedb.org/3/collection/{collection_id}?api_key={TMDB_API_KEY}"
        with urllib.request.urlopen(url, timeout=5, context=_ssl_context) as response:
            data = json.loads(response.read().decode("utf-8"))

        parts = data.get("parts", [])
        parts.sort(key=lambda p: p.get("release_date", "9999"))

        movies = []
        for p in parts:
            movies.append({
                "tmdb_id": p["id"],
                "title": p.get("title", ""),
                "year": int(p["release_date"][:4]) if p.get("release_date") else None,
                "rating": round(p.get("vote_average", 0), 1),
                "poster": TMDB_IMAGE_BASE + p["poster_path"] if p.get("poster_path") else None,
                "overview": p.get("overview", ""),
            })

        return {
            "id": data["id"],
            "name": data.get("name", ""),
            "overview": data.get("overview", ""),
            "poster": TMDB_IMAGE_BASE + data["poster_path"] if data.get("poster_path") else None,
            "backdrop": f"https://image.tmdb.org/t/p/w1280{data['backdrop_path']}" if data.get("backdrop_path") else None,
            "movies": movies,
        }
    except Exception:
        return None


def search_collections(query):
    """TMDB pe franchise/collection naam se search karta hai."""
    try:
        q = urllib.parse.quote(query)
        url = f"https://api.themoviedb.org/3/search/collection?api_key={TMDB_API_KEY}&query={q}"
        with urllib.request.urlopen(url, timeout=5, context=_ssl_context) as response:
            data = json.loads(response.read().decode("utf-8"))

        results = []
        for c in data.get("results", [])[:10]:
            results.append({
                "id": c["id"],
                "name": c.get("name", ""),
                "poster": TMDB_IMAGE_BASE + c["poster_path"] if c.get("poster_path") else None,
            })
        return results
    except Exception:
        return []


def fetch_person_details(person_id):
    """TMDB se kisi actor/director ki poori profile aur filmography laata hai."""
    try:
        url = (
            f"https://api.themoviedb.org/3/person/{person_id}"
            f"?api_key={TMDB_API_KEY}&append_to_response=movie_credits"
        )
        with urllib.request.urlopen(url, timeout=5, context=_ssl_context) as response:
            data = json.loads(response.read().decode("utf-8"))

        cast_credits = data.get("movie_credits", {}).get("cast", [])
        crew_credits = data.get("movie_credits", {}).get("crew", [])
        directed = [c for c in crew_credits if c.get("job") == "Director"]

        def _format_credit(c):
            return {
                "tmdb_id": c["id"],
                "title": c.get("title", ""),
                "year": int(c["release_date"][:4]) if c.get("release_date") else None,
                "rating": round(c.get("vote_average", 0), 1),
                "poster": TMDB_IMAGE_BASE + c["poster_path"] if c.get("poster_path") else None,
                "character": c.get("character", ""),
            }

        acting_credits = sorted(cast_credits, key=lambda c: c.get("release_date", ""), reverse=True)
        directing_credits = sorted(directed, key=lambda c: c.get("release_date", ""), reverse=True)

        return {
            "id": data["id"],
            "name": data.get("name", ""),
            "biography": data.get("biography", ""),
            "profile": TMDB_IMAGE_BASE + data["profile_path"] if data.get("profile_path") else None,
            "birthday": data.get("birthday"),
            "known_for": data.get("known_for_department"),
            "acting_credits": [_format_credit(c) for c in acting_credits[:12]],
            "directing_credits": [_format_credit(c) for c in directing_credits[:12]],
        }
    except Exception:
        return None


def attach_posters(movie_list):
    enriched = []
    for m in movie_list:
        m_copy = dict(m)
        m_copy["poster"] = fetch_poster(m["title"], m.get("year"))
        enriched.append(m_copy)
    return enriched


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/movies", methods=["GET"])
def get_movies():
    return jsonify(attach_posters(backend.view_movies()))


@app.route("/api/movies/filter", methods=["GET"])
def filter_movies():
    search = request.args.get("search", "")
    genre = request.args.get("genre", "")
    min_year = request.args.get("min_year", type=int)
    max_year = request.args.get("max_year", type=int)
    min_rating = request.args.get("min_rating", type=float)
    max_rating = request.args.get("max_rating", type=float)

    results = backend.filter_movies(
        search=search,
        genre=genre,
        min_year=min_year,
        max_year=max_year,
        min_rating=min_rating,
        max_rating=max_rating,
    )
    return jsonify(attach_posters(results))


@app.route("/api/genres", methods=["GET"])
def genres():
    return jsonify(backend.get_all_genres())


@app.route("/api/movies", methods=["POST"])
def add_movie():
    data = request.get_json()
    try:
        backend.add_movie(
            data.get("title", ""),
            data.get("year", 0),
            data.get("rating", 0),
            data.get("genre", ""),
        )
        return jsonify({"success": True, "movies": attach_posters(backend.view_movies())})
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid year or rating"}), 400


@app.route("/api/movies/<title>", methods=["DELETE"])
def delete_movie(title):
    deleted = backend.delete_movie(title)
    return jsonify({"success": deleted, "movies": attach_posters(backend.view_movies())})


@app.route("/api/sort", methods=["POST"])
def sort_movies():
    data = request.get_json()
    key = data.get("key", "title")
    sorted_movies = backend.bubble_sort(key)
    return jsonify({"success": True, "movies": attach_posters(sorted_movies)})


@app.route("/api/search", methods=["GET"])
def search_movie():
    title = request.args.get("title", "")
    result = backend.linear_search(title)
    if result:
        return jsonify({"found": True, "movie": result})
    return jsonify({"found": False})


@app.route("/api/movies/<title>/details", methods=["GET"])
def movie_details(title):
    movie = backend.linear_search(title)

    if movie:
        details = fetch_movie_details(movie["title"], movie.get("year"))
        return jsonify({"found": True, "movie": movie, "details": details})

    details = fetch_movie_details(title)
    if not details:
        return jsonify({"found": False}), 404

    synthetic_movie = {
        "title": title,
        "year": None,
        "rating": None,
        "genre": "Unknown",
    }
    search_result = tmdb_search(title, page=1)
    if search_result:
        match = search_result[0]
        synthetic_movie["year"] = match.get("year")
        synthetic_movie["rating"] = match.get("rating")
        synthetic_movie["genre"] = match.get("genre")

    return jsonify({"found": True, "movie": synthetic_movie, "details": details})


@app.route("/api/movies/<title>/recommendations", methods=["GET"])
def similar_movies(title):
    similar = recommender.get_similar_movies(title, top_n=5)
    return jsonify(attach_posters(similar))


@app.route("/api/recommendations", methods=["GET", "OPTIONS"])
@verify_token
def personalized_recommendations():
    recs = recommender.get_recommendations_for_user(request.user_id, top_n=6)
    return jsonify(attach_posters(recs))


@app.route("/api/top-rated", methods=["GET"])
def top_rated():
    top = recommender.get_top_rated(top_n=6)
    return jsonify(attach_posters(top))


@app.route("/api/discover/popular", methods=["GET"])
def discover_popular():
    page = request.args.get("page", 1, type=int)
    return jsonify(tmdb_popular(page))


@app.route("/api/discover/search", methods=["GET"])
def discover_search():
    query = request.args.get("query", "")
    page = request.args.get("page", 1, type=int)
    if not query:
        return jsonify([])
    return jsonify(tmdb_search(query, page))


@app.route("/api/discover/add", methods=["POST", "OPTIONS"])
@verify_token
def add_from_discover():
    data = request.get_json()
    title = data.get("title", "")
    year = data.get("year", 0)
    rating = data.get("rating", 0)
    genre = data.get("genre", "Unknown")

    try:
        backend.add_movie(title, year, rating, genre, added_by=request.user_id)
        return jsonify({"success": True})
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid movie data"}), 400


@app.route("/api/collections/search", methods=["GET"])
def collections_search():
    query = request.args.get("query", "")
    if not query:
        return jsonify([])
    return jsonify(search_collections(query))


@app.route("/api/collections/<int:collection_id>", methods=["GET"])
def collection_details(collection_id):
    result = fetch_collection_details(collection_id)
    if not result:
        return jsonify({"found": False}), 404
    return jsonify({"found": True, "collection": result})


@app.route("/api/collections/<int:collection_id>/progress", methods=["GET", "OPTIONS"])
@verify_token
def collection_progress(collection_id):
    result = fetch_collection_details(collection_id)
    if not result:
        return jsonify({"found": False}), 404

    watched = backend.get_watched(request.user_id)
    watched_titles = {m["title"] for m in watched}

    for m in result["movies"]:
        m["watched"] = m["title"] in watched_titles

    watched_count = sum(1 for m in result["movies"] if m["watched"])
    result["watched_count"] = watched_count
    result["total_count"] = len(result["movies"])

    return jsonify({"found": True, "collection": result})


@app.route("/api/person/<int:person_id>", methods=["GET"])
def person_details(person_id):
    result = fetch_person_details(person_id)
    if not result:
        return jsonify({"found": False}), 404
    return jsonify({"found": True, "person": result})


@app.route("/api/movies/<title>/reviews", methods=["GET"])
def get_reviews(title):
    result = backend.get_reviews(title)
    return jsonify(result)


@app.route("/api/movies/<title>/reviews", methods=["POST", "OPTIONS"])
@verify_token
def add_review(title):
    data = request.get_json()
    rating = data.get("rating")
    review_text = data.get("review_text", "")

    if not rating or not (1 <= int(rating) <= 5):
        return jsonify({"success": False, "error": "Rating must be between 1 and 5"}), 400

    user_email = request.headers.get("X-User-Email", "Anonymous")
    backend.add_review(request.user_id, user_email, title, rating, review_text)
    return jsonify({"success": True})


@app.route("/api/movies/<title>/reviews", methods=["DELETE", "OPTIONS"])
@verify_token
def delete_review(title):
    deleted = backend.delete_review(request.user_id, title)
    return jsonify({"success": deleted})


@app.route("/api/watchlist", methods=["GET", "OPTIONS"])
@verify_token
def get_watchlist():
    movies = backend.get_watchlist(request.user_id)
    return jsonify(attach_posters(movies))


@app.route("/api/watchlist", methods=["POST", "OPTIONS"])
@verify_token
def add_to_watchlist():
    data = request.get_json()
    title = data.get("title", "")
    backend.add_to_watchlist(request.user_id, title)
    return jsonify({"success": True})


@app.route("/api/watchlist/<title>", methods=["DELETE", "OPTIONS"])
@verify_token
def remove_from_watchlist(title):
    removed = backend.remove_from_watchlist(request.user_id, title)
    return jsonify({"success": removed})


@app.route("/api/watched", methods=["GET", "OPTIONS"])
@verify_token
def get_watched():
    movies = backend.get_watched(request.user_id)
    return jsonify(attach_posters(movies))


@app.route("/api/watched", methods=["POST", "OPTIONS"])
@verify_token
def mark_as_watched():
    data = request.get_json()
    title = data.get("title", "")
    backend.mark_as_watched(request.user_id, title)
    return jsonify({"success": True})


@app.route("/api/watched/<title>", methods=["DELETE", "OPTIONS"])
@verify_token
def unmark_watched(title):
    removed = backend.unmark_watched(request.user_id, title)
    return jsonify({"success": removed})


@app.route("/api/profile/stats", methods=["GET", "OPTIONS"])
@verify_token
def profile_stats():
    stats = backend.get_user_stats(request.user_id)
    return jsonify(stats)


@app.route("/api/profile/badges", methods=["GET", "OPTIONS"])
@verify_token
def profile_badges():
    badges = backend.get_user_badges(request.user_id)
    return jsonify(badges)

@app.route("/api/profile/taste", methods=["GET", "OPTIONS"])
@verify_token
def profile_taste():
    profile = backend.get_taste_profile(request.user_id)
    return jsonify(profile)


@app.route("/api/rooms", methods=["POST", "OPTIONS"])
@verify_token
def create_room():
    data = request.get_json() or {}
    duration = data.get("duration_seconds", 120)
    user_email = request.headers.get("X-User-Email", "Anonymous")
    code = backend.create_room(request.user_id, user_email, duration)
    return jsonify({"success": True, "code": code})


@app.route("/api/rooms/<code>", methods=["GET"])
def get_room(code):
    room = backend.get_room(code)
    if not room:
        return jsonify({"found": False}), 404
    return jsonify({"found": True, "room": room})


@app.route("/api/rooms/<code>/picks", methods=["POST", "OPTIONS"])
@verify_token
def add_pick(code):
    data = request.get_json()
    user_email = request.headers.get("X-User-Email", "Anonymous")
    backend.add_pick_to_room(
        code,
        request.user_id,
        user_email,
        data.get("title", ""),
        data.get("poster"),
        data.get("year"),
        data.get("genre"),
    )
    return jsonify({"success": True})


@app.route("/api/rooms/<code>/vote", methods=["POST", "OPTIONS"])
@verify_token
def vote(code):
    data = request.get_json()
    pick_id = data.get("pick_id", "")
    backend.cast_vote(code, request.user_id, pick_id)
    return jsonify({"success": True})


@app.route("/api/rooms/<code>/close", methods=["POST", "OPTIONS"])
@verify_token
def close_room(code):
    result = backend.close_room_voting(code)
    if not result:
        return jsonify({"success": False, "error": "No picks in this room"}), 400
    return jsonify({"success": True, **result})


@app.route("/api/rooms/history", methods=["GET", "OPTIONS"])
@verify_token
def room_history():
    history = backend.get_room_history(request.user_id)
    return jsonify(history)

@app.route("/api/chat", methods=["POST", "OPTIONS"])
@verify_token
def chat():
    data = request.get_json()
    message = data.get("message", "")
    history = data.get("history", [])

    if not message.strip():
        return jsonify({"success": False, "error": "Empty message"}), 400

    reply = chatbot.chat_with_assistant(message, history)
    return jsonify({"success": True, "reply": reply})

@app.route("/api/voice-parse", methods=["POST", "OPTIONS"])
@verify_token
def voice_parse():
    data = request.get_json()
    transcript = data.get("transcript", "")
    if not transcript.strip():
        return jsonify({"success": False, "error": "Empty transcript"}), 400

    parsed = chatbot.parse_voice_command(transcript)
    return jsonify({"success": True, "parsed": parsed, "original": transcript})

@app.route("/api/watch-party", methods=["GET", "OPTIONS"])
@verify_token
def get_watch_parties():
    parties = backend.get_watch_parties(request.user_id)
    return jsonify(parties)


@app.route("/api/watch-party", methods=["POST", "OPTIONS"])
@verify_token
def schedule_watch_party():
    data = request.get_json()
    party_id = backend.schedule_watch_party(
        request.user_id,
        data.get("movie_title", ""),
        data.get("poster"),
        data.get("watch_datetime", ""),
        data.get("note", ""),
    )
    return jsonify({"success": True, "id": party_id})


@app.route("/api/watch-party/<party_id>", methods=["DELETE", "OPTIONS"])
@verify_token
def delete_watch_party(party_id):
    deleted = backend.delete_watch_party(request.user_id, party_id)
    return jsonify({"success": deleted})


@app.route("/api/watch-party/<party_id>/mark-sent", methods=["POST", "OPTIONS"])
@verify_token
def mark_watch_party_reminder_sent(party_id):
    backend.mark_reminder_sent(request.user_id, party_id)
    return jsonify({"success": True})

@app.route("/api/compatibility", methods=["POST", "OPTIONS"])
@verify_token
def compatibility():
    data = request.get_json()
    friend_email = data.get("friend_email", "").strip()

    if not friend_email:
        return jsonify({"success": False, "error": "Email required"}), 400

    try:
        friend_user = firebase_auth.get_user_by_email(friend_email)
    except Exception:
        return jsonify({"success": False, "error": "No user found with that email"}), 404

    if friend_user.uid == request.user_id:
        return jsonify({"success": False, "error": "That's your own email!"}), 400

    result = backend.get_compatibility(request.user_id, friend_user.uid)
    result["friend_email"] = friend_email
    return jsonify({"success": True, **result})

@app.route("/api/image-proxy", methods=["GET"])
def image_proxy():
    """TMDB images ko proxy karta hai taaki canvas CORS-safe rahe (poster collage ke liye)."""
    url = request.args.get("url", "")
    if not url or "image.tmdb.org" not in url:
        return "Invalid URL", 400

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10, context=_ssl_context) as response:
            image_data = response.read()
            content_type = response.headers.get("Content-Type", "image/jpeg")
        return image_data, 200, {"Content-Type": content_type, "Access-Control-Allow-Origin": "*"}
    except Exception:
        return "Image fetch failed", 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)