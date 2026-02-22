import { useEffect, useRef } from "react";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";
import { useLiveData } from "../hooks/useLiveData";
import { SYMBOLS } from "../types";
import "./LiveChart.css";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
);

interface LiveChartProps {
	symbol: string;
	onSymbolChange: (symbol: string) => void;
}

export function LiveChart({ symbol, onSymbolChange }: LiveChartProps) {
	const { data, isConnected, error, lastCandle, clearData, reconnect } =
		useLiveData(symbol);
	const chartRef = useRef<ChartJS<"line">>(null);

	useEffect(() => {
		if (chartRef.current && data.length > 0) {
			const chart = chartRef.current;
			chart.data.labels = data.map((d) => {
				const date = new Date(d.time);
				return date.toLocaleTimeString();
			});
			chart.data.datasets[0].data = data.map((d) => d.close);
			chart.data.datasets[1].data = data.map((d) => d.high);
			chart.data.datasets[2].data = data.map((d) => d.low);
			chart.update("none");
		}
	}, [data]);

	const chartData = {
		labels: data.map((d) => {
			const date = new Date(d.time);
			return date.toLocaleTimeString();
		}),
		datasets: [
			{
				label: "Close",
				data: data.map((d) => d.close),
				borderColor: "#3b82f6",
				backgroundColor: "rgba(59, 130, 246, 0.08)",
				tension: 0.3,
				fill: true,
				pointRadius: 0,
				borderWidth: 2,
			},
			{
				label: "High",
				data: data.map((d) => d.high),
				borderColor: "rgba(16, 185, 129, 0.4)",
				backgroundColor: "transparent",
				tension: 0.3,
				fill: false,
				pointRadius: 0,
				borderWidth: 1,
				borderDash: [4, 4],
			},
			{
				label: "Low",
				data: data.map((d) => d.low),
				borderColor: "rgba(239, 68, 68, 0.4)",
				backgroundColor: "transparent",
				tension: 0.3,
				fill: false,
				pointRadius: 0,
				borderWidth: 1,
				borderDash: [4, 4],
			},
		],
	};

	const options: ChartOptions<"line"> = {
		responsive: true,
		maintainAspectRatio: false,
		animation: false,
		interaction: {
			intersect: false,
			mode: "index",
		},
		plugins: {
			legend: {
				position: "top" as const,
				labels: {
					color: "#9ca3af",
					font: { family: "'Inter', sans-serif", size: 12 },
					padding: 16,
					usePointStyle: true,
					pointStyleWidth: 8,
				},
			},
			title: {
				display: false,
			},
			tooltip: {
				backgroundColor: "rgba(22, 22, 37, 0.95)",
				borderColor: "rgba(255,255,255,0.08)",
				borderWidth: 1,
				titleFont: { family: "'Inter', sans-serif", size: 12 },
				bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
				padding: 12,
				cornerRadius: 8,
				callbacks: {
					label: (context) => {
						const y = context.parsed.y;
						if (y == null) return "";
						return ` ${context.dataset.label}: $${y.toFixed(2)}`;
					},
				},
			},
		},
		scales: {
			x: {
				display: true,
				title: {
					display: false,
				},
				ticks: {
					maxTicksLimit: 10,
					color: "#6b7280",
					font: { size: 11 },
				},
				grid: {
					color: "rgba(255, 255, 255, 0.04)",
				},
				border: { color: "rgba(255,255,255,0.06)" },
			},
			y: {
				display: true,
				title: {
					display: true,
					text: "Price (USD)",
					color: "#6b7280",
					font: { size: 11, family: "'Inter', sans-serif" },
				},
				ticks: {
					color: "#6b7280",
					font: { size: 11, family: "'JetBrains Mono', monospace" },
				},
				grid: {
					color: "rgba(255, 255, 255, 0.04)",
				},
				border: { color: "rgba(255,255,255,0.06)" },
			},
		},
	};

	return (
		<div className="live-chart-container">
			<div className="chart-header">
				<div className="symbol-selector">
					<label htmlFor="live-symbol">Symbol:</label>
					<select
						id="live-symbol"
						value={symbol}
						onChange={(e) => onSymbolChange(e.target.value)}
					>
						{SYMBOLS.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>
				<div className="connection-status">
					<span
						className={`status-dot ${isConnected ? "connected" : "disconnected"}`}
					/>
					<span>{isConnected ? "Connected" : "Disconnected"}</span>
				</div>
				<div className="chart-actions">
					<button onClick={clearData} className="btn btn-secondary">
						Clear
					</button>
					{!isConnected && (
						<button onClick={reconnect} className="btn btn-primary">
							Reconnect
						</button>
					)}
				</div>
			</div>

			{error && <div className="error-message">{error}</div>}

			{lastCandle && (
				<div className="last-trade">
					<div className="ohlc-item">
						<span className="ohlc-label">Open</span>
						<span className="ohlc-value open">${lastCandle.open.toFixed(2)}</span>
					</div>
					<div className="ohlc-item">
						<span className="ohlc-label">High</span>
						<span className="ohlc-value high">${lastCandle.high.toFixed(2)}</span>
					</div>
					<div className="ohlc-item">
						<span className="ohlc-label">Low</span>
						<span className="ohlc-value low">${lastCandle.low.toFixed(2)}</span>
					</div>
					<div className="ohlc-item">
						<span className="ohlc-label">Close</span>
						<span className="ohlc-value close">${lastCandle.close.toFixed(2)}</span>
					</div>
					<div className="ohlc-item ohlc-meta">
						<span className="ohlc-label">Volume</span>
						<span className="ohlc-value">{lastCandle.volume.toFixed(4)}</span>
					</div>
					<div className="ohlc-item ohlc-meta">
						<span className="ohlc-label">Trades</span>
						<span className="ohlc-value">{lastCandle.tradeCount.toLocaleString()}</span>
					</div>
				</div>
			)}

			<div className="chart-wrapper">
				{data.length === 0 ? (
					<div className="no-data">
						{isConnected ? "Waiting for data..." : "Not connected"}
					</div>
				) : (
					<Line ref={chartRef} data={chartData} options={options} />
				)}
			</div>

			<div className="chart-footer">
				<span>Data points: {data.length}</span>
			</div>
		</div>
	);
}
