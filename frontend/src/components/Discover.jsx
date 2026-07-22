import { useState, useEffect, useRef } from "react";
import { fetchDiscoverPopular, searchDiscover, addFromDiscover, fetchMovies } from "../api";
import MovieDetail from "./MovieDetail";

export default function Discover() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [existingTitles, setExistingTitles] = useState(new Set());
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const loadExisting = async () => {
    const all = await fetchMovies();
    setExistingTitles(new Set(all.map((m) => m.title)));
  };

  const loadPage = (pageNum, searchQuery) => {
    const fetcher = searchQuery.trim()
      ? searchDiscover(searchQuery, pageNum)
      : fetchDiscoverPopular(pageNum);
    return fetcher;
  };

  useEffect(() => {
    loadExisting();
    const timer = setTimeout(() => {
      setLoading(true);
      setPage(1);
      loadPage(1, query).then((res) => {
        setMovies(res);
        setLoading(false);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice search isn't supported in this browser. Try Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setQuery("");
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await loadPage(nextPage, query);
    setMovies((prev) => [...prev, ...res]);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleAdd = async (movie) => {
    await addFromDiscover({
      title: movie.title,
      year: movie.year || 2024,
      rating: movie.rating,
      genre: movie.genre,
    });
    setAddedIds((prev) => new Set(prev).add(movie.tmdb_id));
    setExistingTitles((prev) => new Set(prev).add(movie.title));
  };

  return (
    <div>
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search TMDB's entire movie catalog, or tap the mic..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-4 pr-12 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
        />
        <button
          type="button"
          onClick={toggleListening}
          title="Voice search"
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition ${
            listening
              ? "bg-red-500 animate-pulse text-white"
              : "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
          }`}
        >
          🎤
        </button>
      </div>

      {loading ? (
        <p className="text-zinc-400">Loading...</p>
      ) : movies.length === 0 ? (
        <p className="text-zinc-400">No results found.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {movies.map((movie, idx) => {
              const alreadyInCollection = existingTitles.has(movie.title);
              const justAdded = addedIds.has(movie.tmdb_id);
              return (
                <div
                  key={`${movie.tmdb_id}-${idx}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
                >
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
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                    <p className="text-zinc-400 text-xs mt-1">
                      {movie.year || "—"} · ⭐ {movie.rating} · {movie.genre}
                    </p>
                    <button
                      onClick={() => handleAdd(movie)}
                      disabled={alreadyInCollection || justAdded}
                      className={`mt-3 w-full text-xs font-medium rounded-md py-1.5 transition ${
                        alreadyInCollection || justAdded
                          ? "bg-zinc-800 text-green-400 border border-green-400 cursor-default"
                          : "bg-yellow-400 text-black hover:bg-yellow-300"
                      }`}
                    >
                      {alreadyInCollection || justAdded ? "✓ In Collection" : "+ Add to Collection"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load More Movies"}
            </button>
          </div>
        </>
      )}

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