"""Content-based recommendation engine using TF-IDF + cosine similarity.
Movies ko genre ke basis pe "similar" batata hai, aur watchlist ke
basis pe personalized suggestions deta hai."""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import backend


def _build_similarity_matrix():
    """Saari movies ka genre text le kar TF-IDF vectors banata hai,
    phir har pair ke beech cosine similarity nikaalta hai."""
    movies = backend.view_movies()
    if not movies:
        return [], None

    # Genre ko "document" ki tarah treat kar rahe hain
    genre_texts = [m["genre"] for m in movies]

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(genre_texts)

    similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
    return movies, similarity_matrix


def get_similar_movies(title, top_n=5):
    """Ek movie diye jaane par, sabse similar N movies return karta hai
    (genre similarity ke basis pe)."""
    movies, sim_matrix = _build_similarity_matrix()
    if sim_matrix is None:
        return []

    titles = [m["title"] for m in movies]
    if title not in titles:
        return []

    idx = titles.index(title)
    scores = list(enumerate(sim_matrix[idx]))

    # Khud ko exclude karo, sabse zyada similarity wale upar rakho
    scores = [s for s in scores if s[0] != idx]
    scores.sort(key=lambda x: x[1], reverse=True)

    top_indices = [i for i, score in scores[:top_n]]
    return [movies[i] for i in top_indices]


def get_recommendations_for_user(user_id, top_n=5):
    """User ki watchlist dekh kar, un movies se similar aur naye movies suggest karta hai."""
    watchlist = backend.get_watchlist(user_id)
    if not watchlist:
        return []

    watchlist_titles = {m["title"] for m in watchlist}
    all_movies, sim_matrix = _build_similarity_matrix()
    if sim_matrix is None:
        return []

    titles = [m["title"] for m in all_movies]

    # Har watchlist movie ke liye similarity scores jama karo
    score_map = {}
    for wl_title in watchlist_titles:
        if wl_title not in titles:
            continue
        idx = titles.index(wl_title)
        for i, score in enumerate(sim_matrix[idx]):
            candidate_title = all_movies[i]["title"]
            if candidate_title in watchlist_titles:
                continue  # already watchlist mein hai, suggest mat karo
            score_map[candidate_title] = score_map.get(candidate_title, 0) + score

    # Highest combined score wale movies upar
    ranked = sorted(score_map.items(), key=lambda x: x[1], reverse=True)
    top_titles = [t for t, s in ranked[:top_n]]

    title_to_movie = {m["title"]: m for m in all_movies}
    return [title_to_movie[t] for t in top_titles]

def get_top_rated(top_n=6):
    """Community reviews ke average rating ke basis pe top movies deta hai.
    Sirf un movies ko include karta hai jinki kam se kam 1 review ho."""
    movies = backend.view_movies()
    rated = []

    for m in movies:
        review_info = backend.get_reviews(m["title"])
        if review_info["average_rating"] is not None:
            m_copy = dict(m)
            m_copy["community_rating"] = round(review_info["average_rating"], 1)
            m_copy["review_count"] = review_info["count"]
            rated.append(m_copy)

    rated.sort(key=lambda x: x["community_rating"], reverse=True)
    return rated[:top_n]