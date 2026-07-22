import { useState, useEffect, useRef } from "react";
import { fetchGenres, parseVoiceCommand } from "../api";

export default function FilterBar({ onFilterChange }) {
  const [genres, setGenres] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-US"); // en-US or ur-PK
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchGenres().then(setGenres);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search, genre, minYear, maxYear, minRating });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, genre, minYear, maxYear, minRating]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = voiceLang;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      if (voiceLang === "ur-PK") {
        setProcessing(true);
        const res = await parseVoiceCommand(transcript);
        setSearch(res.success ? res.parsed : transcript);
        setProcessing(false);
      } else {
        setSearch(transcript);
      }
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
  }, [voiceLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice search isn't supported in this browser. Try Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setSearch("");
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setGenre("");
    setMinYear("");
    setMaxYear("");
    setMinRating(0);
  };

  const hasActiveFilters = search || genre || minYear || maxYear || minRating > 0;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6 space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={processing ? "Understanding your command..." : "Search by title, or tap the mic to speak..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-4 pr-12 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
          />
          <button
            type="button"
            onClick={toggleListening}
            title="Voice search"
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition ${
              listening
                ? "bg-red-500 animate-pulse text-white"
                : processing
                ? "bg-yellow-400 text-black"
                : "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
            }`}
          >
            {processing ? "⏳" : "🎤"}
          </button>
        </div>

        <div className="flex bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden text-xs shrink-0">
          <button
            type="button"
            onClick={() => setVoiceLang("en-US")}
            className={`px-3 py-2 transition ${
              voiceLang === "en-US" ? "bg-yellow-400 text-black font-medium" : "text-zinc-400 hover:text-white"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setVoiceLang("ur-PK")}
            className={`px-3 py-2 transition ${
              voiceLang === "ur-PK" ? "bg-yellow-400 text-black font-medium" : "text-zinc-400 hover:text-white"
            }`}
          >
            اردو
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setGenre("")}
          className={`text-xs px-3 py-1.5 rounded-full border transition ${
            genre === ""
              ? "bg-yellow-400 text-black border-yellow-400"
              : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500"
          }`}
        >
          All Genres
        </button>
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              genre === g
                ? "bg-yellow-400 text-black border-yellow-400"
                : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Min Year</label>
          <input
            type="number"
            placeholder="e.g. 2000"
            value={minYear}
            onChange={(e) => setMinYear(e.target.value)}
            className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Max Year</label>
          <input
            type="number"
            placeholder="e.g. 2024"
            value={maxYear}
            onChange={(e) => setMaxYear(e.target.value)}
            className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-zinc-500 block mb-1">
            Min Rating: {minRating.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
            className="w-full accent-yellow-400"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-zinc-400 hover:text-yellow-400 underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}