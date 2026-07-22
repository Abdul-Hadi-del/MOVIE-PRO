import { auth } from "./firebase";

const API_BASE = "http://127.0.0.1:5000";

async function authHeaders() {
  const token = await auth.currentUser.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchMovies() {
  const res = await fetch(`${API_BASE}/api/movies`);
  return res.json();
}

export async function fetchWatchlist() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/watchlist`, { headers });
  return res.json();
}

export async function addToWatchlist(title) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/watchlist`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function removeFromWatchlist(title) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/watchlist/${encodeURIComponent(title)}`, {
    method: "DELETE",
    headers,
  });
  return res.json();
}

export async function fetchMovieDetails(title) {
  const res = await fetch(`${API_BASE}/api/movies/${encodeURIComponent(title)}/details`);
  return res.json();
}

export async function fetchReviews(title) {
  const res = await fetch(`${API_BASE}/api/movies/${encodeURIComponent(title)}/reviews`);
  return res.json();
}

export async function addReview(title, rating, reviewText) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`${API_BASE}/api/movies/${encodeURIComponent(title)}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-User-Email": auth.currentUser.email || "Anonymous",
    },
    body: JSON.stringify({ rating, review_text: reviewText }),
  });
  return res.json();
}

export async function deleteReview(title) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/movies/${encodeURIComponent(title)}/reviews`, {
    method: "DELETE",
    headers,
  });
  return res.json();
}

export async function fetchSimilarMovies(title) {
  const res = await fetch(`${API_BASE}/api/movies/${encodeURIComponent(title)}/recommendations`);
  return res.json();
}

export async function fetchPersonalizedRecommendations() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/recommendations`, { headers });
  return res.json();
}

export async function fetchTopRated() {
  const res = await fetch(`${API_BASE}/api/top-rated`);
  return res.json();
}

export async function fetchGenres() {
  const res = await fetch(`${API_BASE}/api/genres`);
  return res.json();
}

export async function fetchFilteredMovies(filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.minYear) params.set("min_year", filters.minYear);
  if (filters.maxYear) params.set("max_year", filters.maxYear);
  if (filters.minRating) params.set("min_rating", filters.minRating);

  const res = await fetch(`${API_BASE}/api/movies/filter?${params.toString()}`);
  return res.json();
}


export async function fetchWatched() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/watched`, { headers });
  return res.json();
}

export async function markAsWatched(title) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/watched`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function unmarkWatched(title) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/watched/${encodeURIComponent(title)}`, {
    method: "DELETE",
    headers,
  });
  return res.json();
}


export async function fetchDiscoverPopular(page = 1) {
  const res = await fetch(`${API_BASE}/api/discover/popular?page=${page}`);
  return res.json();
}

export async function searchDiscover(query, page = 1) {
  const res = await fetch(`${API_BASE}/api/discover/search?query=${encodeURIComponent(query)}&page=${page}`);
  return res.json();
}

export async function addFromDiscover(movie) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/discover/add`, {
    method: "POST",
    headers,
    body: JSON.stringify(movie),
  });
  return res.json();
}

export async function fetchProfileStats() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/profile/stats`, { headers });
  return res.json();
}

export async function fetchBadges() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/profile/badges`, { headers });
  return res.json();
}


export async function createRoom(durationSeconds = 120) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`${API_BASE}/api/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-User-Email": auth.currentUser.email || "Anonymous",
    },
    body: JSON.stringify({ duration_seconds: durationSeconds }),
  });
  return res.json();
}

export async function fetchRoom(code) {
  const res = await fetch(`${API_BASE}/api/rooms/${code}`);
  return res.json();
}

export async function addPickToRoom(code, movie) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`${API_BASE}/api/rooms/${code}/picks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-User-Email": auth.currentUser.email || "Anonymous",
    },
    body: JSON.stringify(movie),
  });
  return res.json();
}

export async function castVote(code, pickId) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/rooms/${code}/vote`, {
    method: "POST",
    headers,
    body: JSON.stringify({ pick_id: pickId }),
  });
  return res.json();
}

export async function closeRoomVoting(code) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/rooms/${code}/close`, {
    method: "POST",
    headers,
  });
  return res.json();
}

export async function fetchRoomHistory() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/rooms/history`, { headers });
  return res.json();
}

export async function searchCollections(query) {
  const res = await fetch(`${API_BASE}/api/collections/search?query=${encodeURIComponent(query)}`);
  return res.json();
}

export async function fetchCollectionProgress(collectionId) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/collections/${collectionId}/progress`, { headers });
  return res.json();
}

export async function fetchPersonDetails(personId) {
  const res = await fetch(`${API_BASE}/api/person/${personId}`);
  return res.json();
}

export async function sendChatMessage(message, history) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, history }),
  });
  return res.json();
}

export async function fetchWatchParties() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/watch-party`, { headers });
  return res.json();
}

export async function createWatchParty(movieTitle, poster, watchDatetime, note) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/watch-party`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      movie_title: movieTitle,
      poster,
      watch_datetime: watchDatetime,
      note,
    }),
  });
  return res.json();
}

export async function deleteWatchParty(partyId) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/watch-party/${partyId}`, {
    method: "DELETE",
    headers,
  });
  return res.json();
}

export async function markReminderSent(partyId) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/watch-party/${partyId}/mark-sent`, {
    method: "POST",
    headers,
  });
  return res.json();
}

export async function parseVoiceCommand(transcript) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/voice-parse`, {
    method: "POST",
    headers,
    body: JSON.stringify({ transcript }),
  });
  return res.json();
}

export async function fetchTasteProfile() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/profile/taste`, { headers });
  return res.json();
}

export async function checkCompatibility(friendEmail) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/compatibility`, {
    method: "POST",
    headers,
    body: JSON.stringify({ friend_email: friendEmail }),
  });
  return res.json();
}