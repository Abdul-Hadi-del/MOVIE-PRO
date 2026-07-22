import { useState, useEffect } from "react";

export default function TieBreaker({ candidates, winner, onDone }) {
  const [spinning, setSpinning] = useState(true);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let speed = 80;
    let elapsed = 0;
    const totalDuration = 3000;

    let timeoutId;
    const tick = () => {
      setDisplayIndex((prev) => (prev + 1) % candidates.length);
      elapsed += speed;
      speed += 15; // gradually slow down, like a real spin

      if (elapsed < totalDuration) {
        timeoutId = setTimeout(tick, speed);
      } else {
        setSpinning(false);
        setRevealed(true);
      }
    };
    timeoutId = setTimeout(tick, speed);

    return () => clearTimeout(timeoutId);
  }, [candidates.length]);

  const current = spinning
    ? candidates[displayIndex]
    : candidates.find((c) => c.title === winner.title) || candidates[0];

  return (
    <div className="max-w-md mx-auto text-center py-10">
      <p className="text-yellow-400 text-xs uppercase tracking-widest mb-2">
        It's a Tie! Deciding...
      </p>
      <h2 className="text-xl font-bold mb-8">🎰 Tie-Breaker Spin</h2>

      <div
        className={`bg-zinc-900 border-4 rounded-2xl p-6 mb-6 transition-all duration-150 ${
          revealed ? "border-yellow-400 scale-105" : "border-zinc-800"
        }`}
      >
        {current.poster ? (
          <img
            src={current.poster}
            alt={current.title}
            className={`w-40 mx-auto rounded-lg ${spinning ? "opacity-60 blur-[1px]" : ""}`}
          />
        ) : (
          <div className="w-40 aspect-[2/3] bg-zinc-800 rounded-lg mx-auto" />
        )}
        <p className={`mt-4 font-bold text-lg ${revealed ? "text-yellow-400" : "text-zinc-400"}`}>
          {current.title}
        </p>
      </div>

      {revealed && (
        <>
          <p className="text-2xl mb-6">🎉 We're watching this!</p>
          <button
            onClick={onDone}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-2.5 rounded-lg transition"
          >
            Continue
          </button>
        </>
      )}
    </div>
  );
}