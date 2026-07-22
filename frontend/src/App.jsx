import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./components/Auth";
import MovieGrid from "./components/MovieGrid";
import RecommendedForYou from "./components/RecommendedForYou";
import TopRated from "./components/TopRated";
import LoadingScreen from "./components/LoadingScreen";
import ParticleBackground from "./components/ParticleBackground";
import FilterBar from "./components/FilterBar";
import Discover from "./components/Discover";
import ProfilePage from "./components/ProfilePage";
import GroupWatch from "./components/GroupWatch";
import FranchisePage from "./components/FranchisePage";
import ChatWidget from "./components/ChatWidget";
import WatchPartyScheduler from "./components/WatchPartyScheduler";
import CompatibilityCheck from "./components/CompatibilityCheck";

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState("all");
  const [filters, setFilters] = useState(null);

  useEffect(() => {
    const minDelay = new Promise((resolve) => setTimeout(resolve, 800));

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      await minDelay;
      setUser(currentUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <ParticleBackground />

      <div className="relative z-10">
        {/* Top nav bar */}
        <div className="border-b border-zinc-900 px-6 sm:px-10 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-white">MOVIE</span>
            <span className="text-yellow-400">SORT</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 text-sm hidden sm:inline">{user.email}</span>
            
            <button
              onClick={() => setTab("profile")}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-zinc-700 hover:border-yellow-400 transition"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-yellow-400">
                  {user.email?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </button>
            <button
              onClick={() => signOut(auth)}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Hero section */}
        <div className="relative overflow-hidden px-6 sm:px-10 py-16 bg-gradient-to-br from-zinc-900 via-black to-yellow-950/30 border-b-2 border-yellow-400/20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-72 h-72 bg-yellow-400/5 rounded-full blur-3xl" />

          <div className="relative">
            <p className="text-yellow-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Now Showing — Your Collection
            </p>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-3 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Track. Rate. Discover.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-lg">
              Build your personal watchlist, rate what you've watched, and get
              recommendations tailored to your taste.
            </p>
          </div>
        </div>

        <div className="px-6 sm:px-10 py-8">
          {tab === "all" && (
            <>
              <RecommendedForYou />
              <TopRated />
            </>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-zinc-900 mb-6 flex-wrap">
            <button
              onClick={() => setTab("all")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === "all"
                  ? "border-yellow-400 text-yellow-400"
                  : "border-transparent text-zinc-500 hover:text-white"
              }`}
            >
              All Movies
            </button>
            <button
              onClick={() => setTab("watchlist")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === "watchlist"
                  ? "border-yellow-400 text-yellow-400"
                  : "border-transparent text-zinc-500 hover:text-white"
              }`}
            >
              My Watchlist
            </button>
            <button
              onClick={() => setTab("watched")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === "watched"
                  ? "border-yellow-400 text-yellow-400"
                  : "border-transparent text-zinc-500 hover:text-white"
              }`}
            >
              Watched
            </button>
            <button
              onClick={() => setTab("discover")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === "discover"
                  ? "border-yellow-400 text-yellow-400"
                  : "border-transparent text-zinc-500 hover:text-white"
              }`}
            >
              🔍 Discover
            </button>
            <button
              onClick={() => setTab("groupwatch")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === "groupwatch"
                  ? "border-yellow-400 text-yellow-400"
                  : "border-transparent text-zinc-500 hover:text-white"
              }`}
            >
              🎬 Group Watch
            </button>
            <button
              onClick={() => setTab("franchise")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === "franchise"
                  ? "border-yellow-400 text-yellow-400"
                  : "border-transparent text-zinc-500 hover:text-white"
              }`}
            >
              🌌 Franchises
            </button>
            <button
              onClick={() => setTab("watchparty")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === "watchparty"
                  ? "border-yellow-400 text-yellow-400"
                  : "border-transparent text-zinc-500 hover:text-white"
              }`}
            >
              📅 Watch Party
            </button>

            <button
              onClick={() => setTab("compatibility")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === "compatibility"
                  ? "border-yellow-400 text-yellow-400"
                  : "border-transparent text-zinc-500 hover:text-white"
              }`}
            >
              💛 Compatibility
            </button>

          </div>

          {tab === "all" && <FilterBar onFilterChange={setFilters} />}

          {tab === "discover" ? (
            <Discover />
          ) : tab === "profile" ? (
            <ProfilePage />
          ) : tab === "groupwatch" ? (
            <GroupWatch />
          ) : tab === "franchise" ? (
            <FranchisePage />
          ) : tab === "watchparty" ? (
            <WatchPartyScheduler />
          ) : tab === "compatibility" ? (
            <CompatibilityCheck />
          ) : (
            <MovieGrid mode={tab} filters={filters} />
          )}
        </div>
      </div>

      <ChatWidget />
    </div>
  );
}

export default App;