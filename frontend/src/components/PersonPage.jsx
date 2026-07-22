import { useState, useEffect } from "react";
import { fetchPersonDetails } from "../api";
import MovieDetail from "./MovieDetail";

export default function PersonPage({ personId, onClose }) {
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [tab, setTab] = useState("acting");

  useEffect(() => {
    setLoading(true);
    fetchPersonDetails(personId).then((res) => {
      if (res.found) setPerson(res.person);
      setLoading(false);
    });
  }, [personId]);

  const credits = tab === "acting" ? person?.acting_credits : person?.directing_credits;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center overflow-y-auto z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full my-8">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-yellow-400">{person?.name || "Loading..."}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl leading-none">
            &times;
          </button>
        </div>

        {loading ? (
          <p className="text-zinc-400 p-6">Loading...</p>
        ) : !person ? (
          <p className="text-red-400 p-6">Could not load this person's details.</p>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex gap-6 flex-col sm:flex-row">
              {person.profile ? (
                <img src={person.profile} alt={person.name} className="w-32 rounded-lg self-center sm:self-start" />
              ) : (
                <div className="w-32 aspect-[2/3] bg-zinc-800 rounded-lg self-center sm:self-start" />
              )}
              <div className="flex-1">
                {person.known_for && (
                  <p className="text-yellow-400 text-xs uppercase tracking-widest mb-1">{person.known_for}</p>
                )}
                {person.birthday && (
                  <p className="text-zinc-500 text-xs mb-2">Born {person.birthday}</p>
                )}
                <p className="text-zinc-300 text-sm leading-relaxed line-clamp-6">
                  {person.biography || "No biography available."}
                </p>
              </div>
            </div>

            <div>
              <div className="flex gap-2 border-b border-zinc-800 mb-4">
                {person.acting_credits.length > 0 && (
                  <button
                    onClick={() => setTab("acting")}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
                      tab === "acting"
                        ? "border-yellow-400 text-yellow-400"
                        : "border-transparent text-zinc-500 hover:text-white"
                    }`}
                  >
                    Acting ({person.acting_credits.length})
                  </button>
                )}
                {person.directing_credits.length > 0 && (
                  <button
                    onClick={() => setTab("directing")}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
                      tab === "directing"
                        ? "border-yellow-400 text-yellow-400"
                        : "border-transparent text-zinc-500 hover:text-white"
                    }`}
                  >
                    Directing ({person.directing_credits.length})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {credits?.map((c) => (
                  <div
                    key={c.tmdb_id}
                    onClick={() => setSelectedMovie(c.title)}
                    className="cursor-pointer group"
                  >
                    {c.poster ? (
                      <img
                        src={c.poster}
                        alt={c.title}
                        className="w-full aspect-[2/3] object-cover rounded-md group-hover:opacity-75 transition"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-zinc-800 rounded-md" />
                    )}
                    <p className="text-xs mt-1 truncate group-hover:text-yellow-400">{c.title}</p>
                    {c.character && (
                      <p className="text-xs text-zinc-500 truncate">as {c.character}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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