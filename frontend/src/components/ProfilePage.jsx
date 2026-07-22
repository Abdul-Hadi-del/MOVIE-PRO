import { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { fetchProfileStats, fetchBadges, fetchRoomHistory } from "../api";
import { uploadToCloudinary } from "../cloudinary";
import { useTheme } from "../ThemeContext";
import TasteRadarChart from "./TasteRadarChart";
import PosterCollage from "./PosterCollage";

export default function ProfilePage() {
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [roomHistory, setRoomHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState(auth.currentUser?.photoURL || null);
  const [showCollage, setShowCollage] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    Promise.all([fetchProfileStats(), fetchBadges(), fetchRoomHistory()])
      .then(([statsRes, badgesRes, historyRes]) => {
        setStats(statsRes);
        setBadges(badgesRes);
        setRoomHistory(historyRes);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      await updateProfile(auth.currentUser, { photoURL: url });
      setPhotoURL(url);
    } catch (err) {
      alert("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const tierColor = {
    Gold: "border-yellow-400 bg-yellow-400/10",
    Silver: "border-zinc-400 bg-zinc-400/10",
    Bronze: "border-orange-600 bg-orange-600/10",
  };

  return (
    <div className="max-w-2xl">
      {/* Profile header */}
      <div className="flex items-center gap-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="relative">
          {photoURL ? (
            <img
              src={photoURL}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-yellow-400 flex items-center justify-center text-2xl font-bold text-yellow-400">
              {auth.currentUser?.email?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 bg-yellow-400 hover:bg-yellow-300 text-black rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-sm transition">
            📷
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
        </div>
        <div>
          <p className="font-semibold text-lg">{auth.currentUser?.email}</p>
          {uploading && <p className="text-yellow-400 text-xs mt-1">Uploading photo...</p>}
        </div>
      </div>

      {/* Theme toggle */}
      <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
        <div>
          <p className="font-medium text-sm">Appearance</p>
          <p className="text-zinc-400 text-xs mt-0.5">
            {theme === "dark" ? "Dark mode is on" : "Light mode is on"}
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className={`relative w-14 h-7 rounded-full transition ${
            theme === "dark" ? "bg-zinc-700" : "bg-yellow-400"
          }`}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs transition-transform ${
              theme === "dark" ? "translate-x-0.5" : "translate-x-7"
            }`}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </span>
        </button>
      </div>

      {loading ? (
        <p className="text-zinc-400">Loading stats...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard label="Movies Watched" value={stats?.total_watched ?? 0} />
            <StatCard label="In Watchlist" value={stats?.total_watchlist ?? 0} />
            <StatCard label="Reviews Written" value={stats?.total_reviews ?? 0} />
            <StatCard
              label="Avg Rating Given"
              value={stats?.avg_rating_given ? `⭐ ${stats.avg_rating_given}` : "—"}
            />
            <StatCard
              label="Favorite Genre"
              value={stats?.favorite_genre || "—"}
              wide
            />
          </div>

          {/* Taste Profile */}
          <div className="mb-6">
            <TasteRadarChart />
          </div>

          {/* Badges */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">🏅 Badges Earned</h3>
            {badges.length === 0 ? (
              <p className="text-zinc-500 text-sm bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                No badges yet — mark movies as watched and write reviews to start earning badges!
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((b, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-xl p-4 text-center ${tierColor[b.tier] || "border-zinc-800"}`}
                  >
                    <div className="text-3xl mb-1">{b.emoji}</div>
                    <p className="font-semibold text-sm">{b.name}</p>
                    <p className="text-xs mt-1 flex items-center justify-center gap-1">
                      {b.icon} {b.tier}
                    </p>
                    {b.next && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {b.count}/{b.next} for next tier
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group Watch History */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">🎬 Group Watch History</h3>
            {roomHistory.length === 0 ? (
              <p className="text-zinc-500 text-sm bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                No group watch sessions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {roomHistory.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3"
                  >
                    {h.winner_poster ? (
                      <img src={h.winner_poster} alt={h.winner_title} className="w-10 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-14 bg-zinc-800 rounded" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{h.winner_title}</p>
                      <p className="text-xs text-zinc-500">
                        Room {h.room_code} {h.was_tie ? "· decided by tie-breaker 🎰" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* More Tools */}
          <div>
            <h3 className="font-semibold mb-3">More Tools</h3>
            <button
              onClick={() => setShowCollage(true)}
              className="bg-zinc-900/50 border border-zinc-800 hover:border-yellow-400 rounded-xl p-4 text-left transition w-full sm:w-64"
            >
              <p className="text-2xl mb-1">🖼️</p>
              <p className="text-sm font-medium">Poster Collage</p>
              <p className="text-xs text-zinc-500 mt-1">Create a shareable image</p>
            </button>
          </div>
        </>
      )}

      {showCollage && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center overflow-y-auto z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full my-8 p-6">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowCollage(false)}
                className="text-zinc-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <PosterCollage />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, wide }) {
  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 ${wide ? "col-span-2" : ""}`}>
      <p className="text-2xl font-bold text-yellow-400">{value}</p>
      <p className="text-zinc-400 text-sm mt-1">{label}</p>
    </div>
  );
}