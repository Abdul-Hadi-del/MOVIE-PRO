import { useState, useEffect } from "react";
import { fetchMovies, fetchWatchParties, createWatchParty, deleteWatchParty, markReminderSent } from "../api";
import { sendWatchPartyEmail } from "../emailjs";
import { auth } from "../firebase";

export default function WatchPartyScheduler() {
  const [parties, setParties] = useState([]);
  const [movies, setMovies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadParties = async () => {
    const res = await fetchWatchParties();
    setParties(res);
  };

  useEffect(() => {
    fetchMovies().then(setMovies);
    loadParties();
  }, []);

  // Check karo koi party "due" hai aur reminder nahi bheja gaya — bheja do
  useEffect(() => {
    const now = new Date();
    parties.forEach((p) => {
      const watchTime = new Date(p.watch_datetime);
      if (!p.reminder_sent && watchTime <= now) {
        const [wDate, wTime] = p.watch_datetime.split("T");
        sendWatchPartyEmail({
          toEmail: auth.currentUser.email,
          toName: auth.currentUser.email.split("@")[0],
          movieTitle: p.movie_title,
          watchDate: wDate,
          watchTime: wTime,
          note: p.note,
        }).then((sent) => {
          if (sent) markReminderSent(p.id);
        });
      }
    });
  }, [parties]);

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!selectedMovie || !date || !time) return;
    setSubmitting(true);

    const watchDatetime = `${date}T${time}`;
    await createWatchParty(selectedMovie.title, selectedMovie.poster, watchDatetime, note);

    // Turant confirmation email bhi bhej do
    await sendWatchPartyEmail({
      toEmail: auth.currentUser.email,
      toName: auth.currentUser.email.split("@")[0],
      movieTitle: selectedMovie.title,
      watchDate: date,
      watchTime: time,
      note: `This is your confirmation — a reminder will follow closer to the time. ${note}`,
    });

    setSelectedMovie(null);
    setDate("");
    setTime("");
    setNote("");
    setShowForm(false);
    setSubmitting(false);
    loadParties();
  };

  const handleDelete = async (id) => {
    await deleteWatchParty(id);
    loadParties();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📅 Watch Party Scheduler</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-medium px-4 py-2 rounded-lg text-sm transition"
        >
          + Schedule a Watch
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSchedule} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6 space-y-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Movie</label>
            <select
              value={selectedMovie?.title || ""}
              onChange={(e) => setSelectedMovie(movies.find((m) => m.title === e.target.value))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
              required
            >
              <option value="">Select a movie...</option>
              {movies.map((m) => (
                <option key={m.title} value={m.title}>{m.title}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-zinc-500 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-500 block mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Bring your own snacks!"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-semibold rounded-lg px-4 py-2 text-sm transition"
          >
            {submitting ? "Scheduling..." : "Schedule & Send Confirmation Email"}
          </button>
        </form>
      )}

      {parties.length === 0 ? (
        <p className="text-zinc-500 text-sm">No watch parties scheduled yet.</p>
      ) : (
        <div className="space-y-3">
          {parties.map((p) => {
            const watchTime = new Date(p.watch_datetime);
            const isPast = watchTime < new Date();
            return (
              <div
                key={p.id}
                className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
              >
                {p.poster ? (
                  <img src={p.poster} alt={p.movie_title} className="w-12 h-16 object-cover rounded" />
                ) : (
                  <div className="w-12 h-16 bg-zinc-800 rounded" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{p.movie_title}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {watchTime.toLocaleDateString()} at {watchTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {p.note && <p className="text-zinc-400 text-xs mt-1">{p.note}</p>}
                  {isPast && p.reminder_sent && (
                    <span className="inline-block mt-1 text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">
                      ✓ Reminder sent
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-zinc-500 hover:text-red-400 text-sm transition"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}