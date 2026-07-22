import { useState } from "react";
import { checkCompatibility } from "../api";

export default function CompatibilityCheck() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const res = await checkCompatibility(email);
    setLoading(false);

    if (res.success) {
      setResult(res);
    } else {
      setError(res.error || "Something went wrong.");
    }
  };

  const getMessage = (score) => {
    if (score >= 80) return "Soulmates! 💛 You two should watch together.";
    if (score >= 60) return "Great match! 🍿 Solid movie chemistry.";
    if (score >= 40) return "Decent overlap — worth exploring together.";
    if (score >= 20) return "Pretty different tastes, but that's fun too!";
    return "Total opposites — might make for interesting debates 😄";
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">💛 Movie Compatibility</h2>
        <p className="text-zinc-400 text-sm">
          See how your movie taste matches with a friend who also uses MovieSort.
        </p>
      </div>

      <form onSubmit={handleCheck} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
        <label className="text-xs text-zinc-500 block mb-1">Friend's email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          required
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 mb-4"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 transition"
        >
          {loading ? "Checking..." : "Check Compatibility"}
        </button>
      </form>

      {error && (
        <p className="text-red-400 text-sm text-center mb-6">{error}</p>
      )}

      {result && (
        <div className="bg-zinc-900/50 border border-yellow-400/30 rounded-xl p-8 text-center">
          <p className="text-zinc-400 text-sm mb-2">You & {result.friend_email}</p>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#3f3f46" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#facc15"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(result.compatibility / 100) * 264} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-extrabold text-yellow-400">{result.compatibility}%</span>
            </div>
          </div>
          <p className="text-white font-medium mb-4">{getMessage(result.compatibility)}</p>

          {result.common_count > 0 && (
            <div className="text-left mt-6">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">
                {result.common_count} movie{result.common_count !== 1 ? "s" : ""} you both watched
              </p>
              <div className="flex flex-wrap gap-2">
                {result.common_movies.map((title) => (
                  <span key={title} className="text-xs bg-zinc-800 px-2 py-1 rounded-full">
                    {title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}