"use client";
import React, { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
);

const LineChart = ({ chartData, height = 300 }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");

    // Destroy previous instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = chartData?.labels ?? [];
    const datasets = chartData?.datasets ?? [];

    // ❌ Kalau tidak ada data
    if (labels.length === 0 || datasets.length === 0) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "center";
      ctx.fillText(
        "Belum ada data views",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2
      );
      return;
    }

    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(241, 145, 61, 0.2)");
    gradient.addColorStop(1, "rgba(241, 145, 61, 0)");

    // ✅ FIX DI SINI (pakai data:)
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: datasets.map((dataset, idx) => ({
          ...dataset,
          backgroundColor:
            idx === 0 ? gradient : dataset.backgroundColor,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1f2937",
            callbacks: {
              label: (ctx) => `Views: ${ctx.parsed.y}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.05)" },
            ticks: {
              color: "#6b7280",
              callback: (val) =>
                val >= 1000
                  ? (val / 1000).toFixed(1) + "K"
                  : val,
            },
          },
          x: {
            grid: { display: false },
            ticks: {
              color: "#6b7280",
              maxRotation: 45,
              minRotation: 45,
            },
          },
        },
      },
    });

    return () => chartInstance.current?.destroy();
  }, [chartData, height]);

  return (
    <canvas
      ref={chartRef}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
};

export default LineChart;
