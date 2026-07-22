import { useState, useEffect } from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { fetchTasteProfile } from "../api";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export default function TasteRadarChart() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasteProfile()
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-400 text-sm">Loading your taste profile...</p>;

  if (!profile || profile.total_watched === 0) {
    return (
      <p className="text-zinc-500 text-sm bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        Mark some movies as watched to see your Movie DNA! 🧬
      </p>
    );
  }

  const data = {
    labels: profile.labels,
    datasets: [
      {
        label: "Your Taste",
        data: profile.values,
        backgroundColor: "rgba(250, 204, 21, 0.2)",
        borderColor: "rgba(250, 204, 21, 1)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(250, 204, 21, 1)",
        pointBorderColor: "#000",
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      r: {
        angleLines: { color: "rgba(255,255,255,0.1)" },
        grid: { color: "rgba(255,255,255,0.1)" },
        pointLabels: { color: "#e4e4e7", font: { size: 12 } },
        ticks: {
          color: "#71717a",
          backdropColor: "transparent",
          stepSize: 20,
        },
        suggestedMin: 0,
        suggestedMax: Math.max(...profile.values, 20),
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
      <h3 className="font-semibold mb-1">🧬 Your Movie DNA</h3>
      <p className="text-zinc-500 text-xs mb-4">
        Based on {profile.total_watched} movie{profile.total_watched !== 1 ? "s" : ""} watched
      </p>
      <div className="max-w-sm mx-auto">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
}