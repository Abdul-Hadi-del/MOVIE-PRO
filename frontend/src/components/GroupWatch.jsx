import { useState } from "react";
import { createRoom, fetchRoom } from "../api";
import RoomView from "./RoomView";

export default function GroupWatch() {
  const [activeCode, setActiveCode] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [duration, setDuration] = useState(120);

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await createRoom(duration);
      if (res.success) {
        setActiveCode(res.code);
      } else {
        setError("Could not create room.");
      }
    } catch {
      setError("Could not create room.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setError("");
    const code = joinCode.trim().toUpperCase();
    const res = await fetchRoom(code);
    if (res.found) {
      setActiveCode(code);
    } else {
      setError("Room not found. Check the code and try again.");
    }
  };

  if (activeCode) {
    return <RoomView code={activeCode} onLeave={() => setActiveCode(null)} />;
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">🎬 Group Watch</h2>
        <p className="text-zinc-400 text-sm">
          Can't decide what to watch? Create a room, invite friends, vote together.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-4">
        <h3 className="font-semibold mb-3">Create a Room</h3>
        <label className="text-xs text-zinc-500 block mb-1">Voting duration</label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white mb-4 focus:outline-none focus:border-yellow-400"
        >
          <option value={60}>1 minute</option>
          <option value={120}>2 minutes</option>
          <option value={300}>5 minutes</option>
        </select>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 transition"
        >
          {creating ? "Creating..." : "Create Room"}
        </button>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="h-px bg-zinc-800 flex-1" />
        <span className="text-zinc-600 text-xs">OR</span>
        <div className="h-px bg-zinc-800 flex-1" />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-semibold mb-3">Join a Room</h3>
        <input
          type="text"
          placeholder="Enter room code (e.g. A3X9F2)"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 uppercase tracking-widest text-center focus:outline-none focus:border-yellow-400 mb-3"
          maxLength={6}
        />
        <button
          onClick={handleJoin}
          className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium rounded-lg py-2.5 transition"
        >
          Join Room
        </button>
      </div>

      {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
    </div>
  );
}