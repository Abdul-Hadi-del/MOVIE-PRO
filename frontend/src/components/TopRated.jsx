import { useState, useEffect } from "react";
import { fetchTopRated, fetchWatchlist, addToWatchlist, removeFromWatchlist } from "../api";
import MovieDetail from "./MovieDetail";

export default function TopRated() {
  const [movies, setMovies] = useState([]);
  const [watchlistTitles, setWatchlistTitles] = useState(new Set());
  const [selectedMovie, setSelectedMovie] = useState(null);

  const loadWatchlist = async () => {
    try {
      const wl = await fetchWatchlist();
      setWatchlistTitles(new Set(wl.map((m) => m.title)));
    } catch {
      // user login nahi hai, ignore
    }
  };

  useEffect(() => {
    fetchTopRated().then(setMovies);
    loadWatchlist();
  }, []);

  const toggleWatchlist = async (title) => {
    if (watchlistTitles.has(title)) {
      await removeFromWatchlist(title);
    } else {
      await addToWatchlist(title);
    }
    loadWatchlist();
  };

  if (movies.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
        🏆 Top Rated by Community
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {movies.map((m) => (
          <div
            key={m.title}
            onClick={() => setSelectedMovie(m.title)}
            className="w-32 shrink-0 cursor-pointer group"
          >
            <div className="relative">
              {m.poster ? (
                <img
                  src={m.poster}
                  alt={m.title}
                  className="w-32 rounded-lg group-hover:opacity-75 transition"
                />
              ) : (
                <div className="w-32 aspect-[2/3] bg-zinc-800 rounded-lg" />
              )}
              <span className="absolute top-1 right-1 bg-black/80 text-yellow-400 text-xs font-semibold px-1.5 py-0.5 rounded">
                ⭐ {m.community_rating}
              </span>
            </div>
            <p className="text-sm mt-1 truncate group-hover:text-yellow-400">{m.title}</p>
          </div>
        ))}
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
    </div>
  );
}