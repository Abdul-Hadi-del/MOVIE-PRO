import { useState, useEffect } from "react";
import {
  fetchPersonalizedRecommendations,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "../api";
import MovieDetail from "./MovieDetail";

export default function RecommendedForYou() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchlistTitles, setWatchlistTitles] = useState(new Set());
  const [selectedMovie, setSelectedMovie] = useState(null);

  const loadWatchlist = async () => {
    const wl = await fetchWatchlist();
    setWatchlistTitles(new Set(wl.map((m) => m.title)));
  };

  useEffect(() => {
    fetchPersonalizedRecommendations()
      .then(setRecs)
      .finally(() => setLoading(false));
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

  if (loading || recs.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-yellow-400 mb-3">Recommended for You</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {recs.map((m) => (
          <div
            key={m.title}
            onClick={() => setSelectedMovie(m.title)}
            className="w-32 shrink-0 cursor-pointer group"
          >
            {m.poster ? (
              <img
                src={m.poster}
                alt={m.title}
                className="w-32 rounded-lg group-hover:opacity-75 transition"
              />
            ) : (
              <div className="w-32 aspect-[2/3] bg-zinc-800 rounded-lg" />
            )}
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