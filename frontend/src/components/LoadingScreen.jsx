export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />

      {/* Film reel logo */}
      <div className="relative w-24 h-24 animate-spin-slow">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#3f3f46" strokeWidth="6" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="#facc15" strokeWidth="6"
            strokeDasharray="80 210" strokeLinecap="round" />
          <circle cx="50" cy="20" r="9" fill="#18181b" stroke="#facc15" strokeWidth="3" />
          <circle cx="76" cy="62" r="9" fill="#18181b" stroke="#facc15" strokeWidth="3" />
          <circle cx="24" cy="62" r="9" fill="#18181b" stroke="#facc15" strokeWidth="3" />
          <circle cx="50" cy="50" r="10" fill="#facc15" />
        </svg>
      </div>

      <div className="text-center relative">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="text-white">MOVIE</span>
          <span className="text-yellow-400">SORT</span>
          <span className="text-white"> PRO</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-2 tracking-widest uppercase">
          Loading your collection
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 w-1/3 bg-yellow-400 rounded-full animate-loading-bar" />
      </div>
    </div>
  );
}