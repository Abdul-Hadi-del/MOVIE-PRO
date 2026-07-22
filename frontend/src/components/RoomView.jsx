import { useState, useEffect, useRef } from "react";
import { fetchRoom, addPickToRoom, castVote, closeRoomVoting, fetchMovies } from "../api";
import { auth } from "../firebase";
import TieBreaker from "./TieBreaker";
import MovieDetail from "./MovieDetail";

export default function RoomView({ code, onLeave }) {
  const [room, setRoom] = useState(null);
  const [allMovies, setAllMovies] = useState([]);
  const [showAddPick, setShowAddPick] = useState(false);
  const [myVote, setMyVote] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showTieBreaker, setShowTieBreaker] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const pollRef = useRef(null);
  const closingRef = useRef(false);

  const isHost = room && auth.currentUser?.uid === room.host_id;

  const loadRoom = async () => {
    const res = await fetchRoom(code);
    if (res.found) setRoom(res.room);
  };

  useEffect(() => {
    loadRoom();
    fetchMovies().then(setAllMovies);
    pollRef.current = setInterval(loadRoom, 3000);
    return () => clearInterval(pollRef.current);
  }, [code]);

  useEffect(() => {
    if (!room || room.status !== "open") return;
    setTimeLeft(room.duration_seconds);
  }, [room?.status]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && room?.status === "open" && isHost) {
      handleCloseVoting();
    }
  }, [timeLeft]);

  const handleAddPick = async (movie) => {
    await addPickToRoom(code, {
      title: movie.title,
      poster: movie.poster,
      year: movie.year,
      genre: movie.genre,
    });
    setShowAddPick(false);
    loadRoom();
  };

  const handleVote = async (pickId) => {
    await castVote(code, pickId);
    setMyVote(pickId);
    loadRoom();
  };

  const handleCloseVoting = async () => {
    if (closingRef.current) return; // already closing, ignore duplicate calls
    closingRef.current = true;
    clearInterval(pollRef.current);
    const result = await closeRoomVoting(code);
    if (result.success) {
      setFinalResult(result);
      if (result.was_tie) {
        setShowTieBreaker(true);
      }
      loadRoom();
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    alert("Room code copied!");
  };

  if (!room) return <p className="text-zinc-400">Loading room...</p>;

  if (showTieBreaker && finalResult) {
    return (
      <TieBreaker
        candidates={finalResult.tied_picks}
        winner={finalResult.winner}
        onDone={() => setShowTieBreaker(false)}
      />
    );
  }

  const winnerPick = room.picks.find((p) => p.title === room.winner);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onLeave} className="text-zinc-400 hover:text-white text-sm">
          ← Leave room
        </button>
        <button
          onClick={copyCode}
          className="bg-zinc-800 border border-zinc-700 px-4 py-1.5 rounded-lg text-sm font-mono tracking-widest hover:border-yellow-400 transition"
        >
          {code} 📋
        </button>
      </div>

      {room.status === "closed" ? (
        <div
          onClick={() => winnerPick && setSelectedMovie(winnerPick.title)}
          className="text-center bg-zinc-900/50 border border-yellow-400/30 rounded-xl p-10 mb-6 cursor-pointer hover:border-yellow-400 transition"
        >
          <p className="text-yellow-400 text-xs uppercase tracking-widest mb-2">Winner</p>
          <h2 className="text-3xl font-extrabold mb-4">{room.winner}</h2>
          {winnerPick?.poster && (
            <img
              src={winnerPick.poster}
              alt={room.winner}
              className="w-40 mx-auto rounded-lg"
            />
          )}
          <p className="text-zinc-500 text-xs mt-4">Click to see details, trailer & cast</p>
        </div>
      ) : (
        <>
          {timeLeft !== null && (
            <div className="text-center mb-6">
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Time Remaining</p>
              <p className={`text-4xl font-bold font-mono ${timeLeft <= 10 ? "text-red-400" : "text-yellow-400"}`}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Picks ({room.picks.length})</h3>
            <button
              onClick={() => setShowAddPick(!showAddPick)}
              className="text-sm bg-yellow-400 hover:bg-yellow-300 text-black font-medium px-3 py-1.5 rounded-lg transition"
            >
              + Add a Pick
            </button>
          </div>

          {showAddPick && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {allMovies.map((m) => (
                  <button
                    key={m.title}
                    onClick={() => handleAddPick(m)}
                    className="text-left hover:opacity-75 transition"
                  >
                    {m.poster ? (
                      <img src={m.poster} alt={m.title} className="w-full aspect-[2/3] object-cover rounded-md" />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-zinc-800 rounded-md" />
                    )}
                    <p className="text-xs mt-1 truncate">{m.title}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {room.picks.length === 0 ? (
            <p className="text-zinc-500 text-sm">No picks yet. Add a movie to get started!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {room.picks.map((pick) => (
                <div
                  key={pick.pick_id}
                  className={`bg-zinc-900 border rounded-lg overflow-hidden transition ${
                    myVote === pick.pick_id ? "border-yellow-400" : "border-zinc-800"
                  }`}
                >
                  {pick.poster ? (
                    <img
                      src={pick.poster}
                      alt={pick.title}
                      onClick={() => setSelectedMovie(pick.title)}
                      className="w-full aspect-[2/3] object-cover cursor-pointer"
                    />
                  ) : (
                    <div
                      onClick={() => setSelectedMovie(pick.title)}
                      className="w-full aspect-[2/3] bg-zinc-800 cursor-pointer"
                    />
                  )}
                  <div className="p-3">
                    <h4 className="font-semibold text-sm truncate">{pick.title}</h4>
                    <p className="text-zinc-500 text-xs mt-0.5">added by {pick.added_by}</p>
                    <p className="text-yellow-400 text-xs mt-1">{pick.vote_count} vote{pick.vote_count !== 1 ? "s" : ""}</p>
                    <button
                      onClick={() => handleVote(pick.pick_id)}
                      className={`mt-2 w-full text-xs font-medium rounded-md py-1.5 transition ${
                        myVote === pick.pick_id
                          ? "bg-yellow-400 text-black"
                          : "bg-zinc-800 text-white hover:bg-zinc-700"
                      }`}
                    >
                      {myVote === pick.pick_id ? "✓ Voted" : "Vote"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isHost && room.picks.length > 0 && (
            <button
              onClick={handleCloseVoting}
              className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium rounded-lg py-2.5 transition"
            >
              End Voting Now
            </button>
          )}
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