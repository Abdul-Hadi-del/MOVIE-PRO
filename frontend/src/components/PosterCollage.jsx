import { useState, useRef, useEffect } from "react";
import { fetchWatched, fetchWatchlist } from "../api";

export default function PosterCollage() {
  const [movies, setMovies] = useState([]);
  const [source, setSource] = useState("watched");
  const [selected, setSelected] = useState([]);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetcher = source === "watched" ? fetchWatched : fetchWatchlist;
    fetcher().then((res) => {
      setMovies(res);
      setSelected(res.slice(0, 9).map((m) => m.title));
    });
  }, [source]);

  const toggleSelect = (title) => {
    setSelected((prev) => {
      if (prev.includes(title)) return prev.filter((t) => t !== title);
      if (prev.length >= 9) return prev;
      return [...prev, title];
    });
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const drawRoundedImage = (ctx, img, x, y, w, h, radius) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  };

  const drawPlaceholder = (ctx, x, y, w, h, title) => {
    ctx.fillStyle = "#27272a";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    const words = title.split(" ");
    ctx.fillText(words.slice(0, 2).join(" "), x + w / 2, y + h / 2);
  };

  const drawFilmStrip = (ctx, y, W) => {
    const holeSize = 10;
    const spacing = 28;
    ctx.fillStyle = "rgba(250,204,21,0.15)";
    for (let x = 20; x < W - 20; x += spacing) {
      ctx.beginPath();
      ctx.roundRect(x, y, holeSize, holeSize, 2);
      ctx.fill();
    }
  };

  const generateCollage = async () => {
    setGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // Base background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0a0a0a");
    grad.addColorStop(0.5, "#18181b");
    grad.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Corner glow accents
    const glow1 = ctx.createRadialGradient(W * 0.1, 80, 0, W * 0.1, 80, 450);
    glow1.addColorStop(0, "rgba(250,204,21,0.10)");
    glow1.addColorStop(1, "rgba(250,204,21,0)");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, 600);

    const glow2 = ctx.createRadialGradient(W * 0.9, H - 100, 0, W * 0.9, H - 100, 400);
    glow2.addColorStop(0, "rgba(250,204,21,0.08)");
    glow2.addColorStop(1, "rgba(250,204,21,0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, H - 600, W, 600);

    // Subtle film-grain dots scattered across background
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < 120; i++) {
      const dx = Math.random() * W;
      const dy = Math.random() * H;
      const r = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top film-strip decorative bar
    drawFilmStrip(ctx, 24, W);

    // Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#facc15";
    ctx.font = "600 22px Arial";
    ctx.fillText("N O W   S H O W I N G", W / 2, 110);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 56px Arial";
    ctx.fillText("MY MOVIE COLLECTION", W / 2, 170);

    ctx.strokeStyle = "rgba(250,204,21,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 60, 200);
    ctx.lineTo(W / 2 + 60, 200);
    ctx.stroke();

    // Grid: 3x3
    const selectedMovies = movies.filter((m) => selected.includes(m.title));
    const cols = 3;
    const gap = 24;
    const gridTop = 270;
    const gridWidth = W - 100;
    const cellW = (gridWidth - gap * (cols - 1)) / cols;
    const posterH = cellW * 1.5;
    const labelH = 60;
    const cellH = posterH + labelH;

    for (let i = 0; i < selectedMovies.length && i < 9; i++) {
      const movie = selectedMovies[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 50 + col * (cellW + gap);
      const y = gridTop + row * (cellH + gap);

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;

      if (movie.poster) {
        try {
          const proxiedUrl = `http://127.0.0.1:5000/api/image-proxy?url=${encodeURIComponent(movie.poster)}`;
          const img = await loadImage(proxiedUrl);
          drawRoundedImage(ctx, img, x, y, cellW, posterH, 14);
        } catch (err) {
          drawPlaceholder(ctx, x, y, cellW, posterH, movie.title);
        }
      } else {
        drawPlaceholder(ctx, x, y, cellW, posterH, movie.title);
      }
      ctx.restore();

      // Rank badge
      ctx.beginPath();
      ctx.arc(x + 20, y + 20, 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fill();
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), x + 20, y + 25);

      // Title
      ctx.fillStyle = "#e4e4e7";
      ctx.font = "600 16px Arial";
      ctx.textAlign = "center";
      const titleText = movie.title.length > 18 ? movie.title.slice(0, 16) + "…" : movie.title;
      ctx.fillText(titleText, x + cellW / 2, y + posterH + 28);

      if (movie.rating) {
        ctx.fillStyle = "#facc15";
        ctx.font = "13px Arial";
        ctx.fillText(`⭐ ${movie.rating}`, x + cellW / 2, y + posterH + 48);
      }
    }

    // Bottom film-strip decorative bar
    drawFilmStrip(ctx, H - 44, W);

    // Footer
    const footerY = H - 90;
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 100, footerY - 30);
    ctx.lineTo(W / 2 + 100, footerY - 30);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "800 30px Arial";
    const brandText1 = "MOVIESORT";
    const brandText2 = " PRO";
    const brand1Width = ctx.measureText(brandText1).width;
    const totalWidth = brand1Width + ctx.measureText(brandText2).width;
    const brandStartX = W / 2 - totalWidth / 2;

    ctx.textAlign = "left";
    ctx.fillStyle = "#facc15";
    ctx.fillText(brandText1, brandStartX, footerY);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(brandText2, brandStartX + brand1Width, footerY);

    ctx.fillStyle = "#71717a";
    ctx.font = "14px Arial";
    ctx.fillText("Track. Rate. Discover.", W / 2, footerY + 26);

    // Vignette overlay (darkens edges for cinematic feel)
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    setGenerating(false);
  };

  const downloadCollage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "my-movie-collage.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">🖼️ Poster Collage</h2>
        <p className="text-zinc-400 text-sm">
          Create a shareable poster grid of your favorite movies — pick up to 9.
        </p>
      </div>

      <div className="flex gap-2 justify-center mb-6">
        <button
          onClick={() => setSource("watched")}
          className={`text-sm px-4 py-2 rounded-lg border transition ${
            source === "watched"
              ? "bg-yellow-400 text-black border-yellow-400"
              : "bg-transparent text-zinc-400 border-zinc-700"
          }`}
        >
          Watched
        </button>
        <button
          onClick={() => setSource("watchlist")}
          className={`text-sm px-4 py-2 rounded-lg border transition ${
            source === "watchlist"
              ? "bg-yellow-400 text-black border-yellow-400"
              : "bg-transparent text-zinc-400 border-zinc-700"
          }`}
        >
          Watchlist
        </button>
      </div>

      {movies.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center">No movies here yet.</p>
      ) : (
        <>
          <p className="text-zinc-500 text-xs text-center mb-3">
            {selected.length}/9 selected — tap posters to toggle
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-6">
            {movies.map((m) => (
              <div
                key={m.title}
                onClick={() => toggleSelect(m.title)}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                  selected.includes(m.title) ? "border-yellow-400" : "border-transparent opacity-50"
                }`}
              >
                {m.poster ? (
                  <img src={m.poster} alt={m.title} className="w-full aspect-[2/3] object-cover" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-zinc-800" />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={generateCollage}
              disabled={generating || selected.length === 0}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-semibold rounded-lg px-6 py-2.5 transition"
            >
              {generating ? "Generating..." : "Generate Collage"}
            </button>
          </div>

          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full border border-zinc-800 rounded-lg"
              style={{ maxHeight: "500px" }}
            />
          </div>

          <div className="flex justify-center mt-4">
            <button
              onClick={downloadCollage}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition"
            >
              ⬇ Download PNG
            </button>
          </div>
        </>
      )}
    </div>
  );
}