import { useState, useEffect, useRef, useCallback } from "react";
import { getLiveWebSocketUrl } from "../config/api";
import type { LiveCandleData } from "../types";

interface LiveDataPoint {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	tradeCount: number;
}

const MAX_DATA_POINTS = 100;

export function useLiveData(symbol: string) {
	const [data, setData] = useState<LiveDataPoint[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastCandle, setLastCandle] = useState<LiveCandleData | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<number | null>(null);
	const shouldReconnectRef = useRef(true);

	const connect = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.close();
		}

		shouldReconnectRef.current = true;
		const wsUrl = getLiveWebSocketUrl(symbol);
		const ws = new WebSocket(wsUrl);
		wsRef.current = ws;

		ws.onopen = () => {
			setIsConnected(true);
			setError(null);
			console.log(`Connected to ${symbol} live data`);
		};

		ws.onmessage = (event) => {
			try {
				const candle: LiveCandleData = JSON.parse(event.data);
				setLastCandle(candle);

				const newPoint: LiveDataPoint = {
					time: candle.closeTime,
					open: candle.open,
					high: candle.high,
					low: candle.low,
					close: candle.close,
					volume: candle.volume,
					tradeCount: candle.tradeCount,
				};

				setData((prev) => {
					const updated = [...prev, newPoint];
					if (updated.length > MAX_DATA_POINTS) {
						return updated.slice(-MAX_DATA_POINTS);
					}
					return updated;
				});
			} catch (e) {
				console.error("Failed to parse candle data:", e);
			}
		};

		ws.onerror = () => {
			setError("WebSocket connection error");
			setIsConnected(false);
		};

		ws.onclose = () => {
			setIsConnected(false);
			if (!shouldReconnectRef.current) return;
			reconnectTimeoutRef.current = window.setTimeout(() => {
				console.log("Attempting to reconnect...");
				connect();
			}, 3000);
		};
	}, [symbol]);

	const disconnect = useCallback(() => {
		shouldReconnectRef.current = false;
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}
		setIsConnected(false);
	}, []);

	useEffect(() => {
		setData([]);
		connect();

		return () => {
			disconnect();
		};
	}, [symbol, connect, disconnect]);

	const clearData = useCallback(() => {
		setData([]);
	}, []);

	return {
		data,
		isConnected,
		error,
		lastCandle,
		clearData,
		reconnect: connect,
	};
}
