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
				borderColor: "rgb(75, 192, 192)",
				backgroundColor: "rgba(75, 192, 192, 0.1)",
				tension: 0.1,
				fill: true,
				pointRadius: 0,
				borderWidth: 2,
			},
			{
				label: "High",
				data: data.map((d) => d.high),
				borderColor: "rgba(0, 255, 136, 0.4)",
				backgroundColor: "transparent",
				tension: 0.1,
				fill: false,
				pointRadius: 0,
				borderWidth: 1,
				borderDash: [5, 5],
			},
			{
				label: "Low",
				data: data.map((d) => d.low),
				borderColor: "rgba(255, 68, 68, 0.4)",
				backgroundColor: "transparent",
				tension: 0.1,
				fill: false,
				pointRadius: 0,
				borderWidth: 1,
				borderDash: [5, 5],
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
			},
			title: {
				display: true,
				text: `Live ${symbol} Price`,
				font: {
					size: 16,
				},
			},
			tooltip: {
				callbacks: {
					label: (context) => {
						const y = context.parsed.y;
						if (y == null) return "";
						return `${context.dataset.label}: $${y.toFixed(2)}`;
					},
				},
			},
		},
		scales: {
			x: {
				display: true,
				title: {
					display: true,
					text: "Time",
				},
				ticks: {
					maxTicksLimit: 10,
				},
			},
			y: {
				display: true,
				title: {
					display: true,
					text: "Price (USD)",
				},
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
					<span className="trade-price">
						O: ${lastCandle.open.toFixed(2)} H: $
						{lastCandle.high.toFixed(2)} L: $
						{lastCandle.low.toFixed(2)} C: $
						{lastCandle.close.toFixed(2)}
					</span>
					<span className="trade-volume">
						Vol: {lastCandle.volume.toFixed(4)}
					</span>
					<span className="trade-type buy">
						{lastCandle.tradeCount} trades
					</span>
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
