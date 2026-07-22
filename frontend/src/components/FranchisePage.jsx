import { useState } from "react";
import { searchCollections, fetchCollectionProgress } from "../api";
import MovieDetail from "./MovieDetail";

export default function FranchisePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCollection, setActiveCollection] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await searchCollections(value);
    setResults(res);
    setLoading(false);
  };

  const openCollection = async (id) => {
    setLoading(true);
    const res = await fetchCollectionProgress(id);
    if (res.found) {
      setActiveCollection(res.collection);
    }
    setLoading(false);
  };

  if (activeCollection) {
    return (
      <div>
        <button
          onClick={() => setActiveCollection(null)}
          className="text-zinc-400 hover:text-white text-sm mb-6"
        >
          ← Back to search
        </button>

        {activeCollection.backdrop && (
          <div
            className="h-48 rounded-xl bg-cover bg-center mb-6 relative overflow-hidden"
            style={{ backgroundImage: `url(${activeCollection.backdrop})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h2 className="text-2xl font-extrabold">{activeCollection.name}</h2>
              <p className="text-yellow-400 text-sm mt-1">
                {activeCollection.watched_count} / {activeCollection.total_count} watched
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-yellow-400 transition-all"
            style={{
              width: `${(activeCollection.watched_count / activeCollection.total_count) * 100}%`,
            }}
          />
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {activeCollection.movies.map((m, idx) => (
            <div
              key={m.tmdb_id}
              className="flex gap-4 items-start bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
            >
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    m.watched ? "bg-green-500 text-black" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {m.watched ? "✓" : idx + 1}
                </div>
                {idx < activeCollection.movies.length - 1 && (
                  <div className="w-0.5 flex-1 bg-zinc-800 mt-1" style={{ minHeight: "40px" }} />
                )}
              </div>

              {m.poster ? (
                <img
                  src={m.poster}
                  alt={m.title}
                  onClick={() => setSelectedMovie(m.title)}
                  className="w-16 rounded-md cursor-pointer shrink-0"
                />
              ) : (
                <div className="w-16 aspect-[2/3] bg-zinc-800 rounded-md shrink-0" />
              )}

              <div className="flex-1">
                <h4 className="font-semibold">{m.title}</h4>
                <p className="text-zinc-500 text-xs mt-0.5">{m.year || "—"} · ⭐ {m.rating}</p>
                {m.watched && (
                  <span className="inline-block mt-1 text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">
                    Watched
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedMovie && (
          <MovieDetail
            title={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            inWatchlist={false}
            onToggleWatchlist={() => {}}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">🌌 Franchise Tracker</h2>
        <p className="text-zinc-400 text-sm">
          Search a franchise and track your progress through it.
        </p>
      </div>

      <input
        type="text"
        placeholder="Search franchises (e.g. Avengers, Harry Potter, Fast & Furious)..."
        value={query}
        onChange={handleSearch}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 mb-6"
      />

      {loading && <p className="text-zinc-400">Loading...</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {results.map((c) => (
          <div
            key={c.id}
            onClick={() => openCollection(c.id)}
            className="cursor-pointer group"
          >
            {c.poster ? (
              <img
                src={c.poster}
                alt={c.name}
                className="w-full aspect-[2/3] object-cover rounded-lg group-hover:opacity-75 transition"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-zinc-800 rounded-lg" />
            )}
            <p className="text-sm mt-2 font-medium group-hover:text-yellow-400">{c.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}