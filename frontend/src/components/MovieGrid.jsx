import { useState, useEffect } from "react";
import {
  fetchMovies,
  fetchFilteredMovies,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  fetchWatched,
  markAsWatched,
  unmarkWatched,
} from "../api";
import MovieDetail from "./MovieDetail";

export default function MovieGrid({ mode = "all", filters = null }) {
  const [movies, setMovies] = useState([]);
  const [watchlistTitles, setWatchlistTitles] = useState(new Set());
  const [watchedTitles, setWatchedTitles] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);

  const hasActiveFilters =
    filters &&
    (filters.search || filters.genre || filters.minYear || filters.maxYear || filters.minRating > 0);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [wl, watched] = await Promise.all([fetchWatchlist(), fetchWatched()]);
      setWatchlistTitles(new Set(wl.map((m) => m.title)));
      setWatchedTitles(new Set(watched.map((m) => m.title)));

      if (mode === "watchlist") {
        setMovies(wl);
      } else if (mode === "watched") {
        setMovies(watched);
      } else {
        const all = hasActiveFilters ? await fetchFilteredMovies(filters) : await fetchMovies();
        setMovies(all);
      }
    } catch (err) {
      setError("Could not load movies. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mode, JSON.stringify(filters)]);

  const toggleWatchlist = async (title) => {
    if (watchlistTitles.has(title)) {
      await removeFromWatchlist(title);
    } else {
      await addToWatchlist(title);
    }
    loadData();
  };

  const toggleWatched = async (title) => {
    if (watchedTitles.has(title)) {
      await unmarkWatched(title);
    } else {
      await markAsWatched(title);
    }
    loadData();
  };

  if (loading) return <p className="text-zinc-400 mt-8">Loading...</p>;
  if (error) return <p className="text-red-400 mt-8">{error}</p>;
  if (movies.length === 0)
    return (
      <p className="text-zinc-400 mt-8">
        {mode === "watchlist"
          ? "Your watchlist is empty."
          : mode === "watched"
          ? "You haven't marked any movies as watched yet."
          : "No movies match your filters."}
      </p>
    );

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mt-2">
        {movies.map((movie) => {
          const inWatchlist = watchlistTitles.has(movie.title);
          const isWatched = watchedTitles.has(movie.title);
          return (
            <div
              key={movie.title}
              className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-yellow-400 transition"
            >
              <div className="relative">
                {movie.poster ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    onClick={() => setSelectedMovie(movie.title)}
                    className="w-full aspect-[2/3] object-cover cursor-pointer"
                  />
                ) : (
                  <div
                    onClick={() => setSelectedMovie(movie.title)}
                    className="w-full aspect-[2/3] bg-zinc-800 flex items-center justify-center text-zinc-600 text-sm cursor-pointer"
                  >
                    No Poster
                  </div>
                )}
                {isWatched && (
                  <span className="absolute top-1.5 left-1.5 bg-green-500 text-black text-xs font-semibold px-1.5 py-0.5 rounded">
                    ✓ Watched
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                <p className="text-zinc-400 text-xs mt-1">
                  {movie.year} · ⭐ {movie.rating} · {movie.genre}
                </p>
                <div className="flex gap-1.5 mt-3">
                  <button
                    onClick={() => toggleWatchlist(movie.title)}
                    className={`flex-1 text-xs font-medium rounded-md py-1.5 transition ${
                      inWatchlist
                        ? "bg-zinc-800 text-yellow-400 border border-yellow-400"
                        : "bg-yellow-400 text-black hover:bg-yellow-300"
                    }`}
                  >
                    {inWatchlist ? "✓ Listed" : "+ Watchlist"}
                  </button>
                  <button
                    onClick={() => toggleWatched(movie.title)}
                    className={`flex-1 text-xs font-medium rounded-md py-1.5 transition ${
                      isWatched
                        ? "bg-zinc-800 text-green-400 border border-green-400"
                        : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    {isWatched ? "✓ Watched" : "Mark Watched"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedMovie && (
        <MovieDetail
          title={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          inWatchlist={watchlistTitles.has(selectedMovie)}
          onToggleWatchlist={(title) => {
            toggleWatchlist(title);
            setSelectedMovie(null);
          }}
        />
      )}
    </>
  );
}