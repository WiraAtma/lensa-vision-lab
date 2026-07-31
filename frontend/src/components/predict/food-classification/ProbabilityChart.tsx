"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

interface ProbabilityChartProps {
  probabilities: { class: string; probability: number }[];
}

export default function ProbabilityChart({
  probabilities,
}: ProbabilityChartProps) {
  // Sort by class number for consistent display
  const sorted = [...probabilities].sort(
    (a, b) => Number(a.class) - Number(b.class)
  );

  const data = {
    labels: sorted.map((p) => `Digit ${p.class}`),
    datasets: [
      {
        label: "Probability (%)",
        data: sorted.map((p) => p.probability),
        backgroundColor: sorted.map((p) =>
          p.probability > 50
            ? "rgba(34, 197, 94, 0.7)"
            : "rgba(163, 163, 163, 0.5)"
        ),
        borderColor: sorted.map((p) =>
          p.probability > 50
            ? "rgba(34, 197, 94, 1)"
            : "rgba(163, 163, 163, 1)"
        ),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Class Probabilities",
        color: "#a3a3a3",
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            `${ctx.parsed.y.toFixed(2)}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: "#a3a3a3" },
        grid: { color: "rgba(163, 163, 163, 0.1)" },
      },
      x: {
        ticks: { color: "#a3a3a3" },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="w-full" style={{ height: "300px" }}>
      <Bar data={data} options={options} />
    </div>
  );
}
