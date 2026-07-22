import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey! 👋 I'm your movie assistant. Ask me for recommendations based on mood, genre, or anything else!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Gemini ke liye history format banate hain (sirf pichli conversation, first greeting exclude)
    const geminiHistory = messages.slice(1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const res = await sendChatMessage(text, geminiHistory);
    setLoading(false);

    if (res.success) {
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply }]);
    } else {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, something went wrong." }]);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center text-2xl shadow-lg transition"
      >
        {open ? "✕" : "🎬"}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[28rem] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700">
            <p className="font-semibold text-sm text-yellow-400">🎬 Movie Assistant</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-yellow-400 text-black"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-400 rounded-lg px-3 py-2 text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a recommendation..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-medium rounded-lg px-4 py-2 text-sm transition"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}