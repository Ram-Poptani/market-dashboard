// Types for the trading data

export interface CandleData {
	openTime: number;
	closeTime: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	tradeCount: number;
}

export interface LiveCandleData {
	symbol: string;
	openTime: number;
	closeTime: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	tradeCount: number;
}

export interface LiveTradeData {
	e: string; // Event type
	E: number; // Event time
	s: string; // Symbol
	t: number; // Trade ID
	p: string; // Price
	q: string; // Quantity
	b: number; // Buyer order ID
	a: number; // Seller order ID
	T: number; // Trade time
	m: boolean; // Is buyer the market maker
	M: boolean; // Ignore
}

export type TickSize = "1ms" | "1s" | "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export const TICK_SIZE_OPTIONS: { value: TickSize; label: string }[] = [
	{ value: "1m", label: "1 Minute" },
	{ value: "5m", label: "5 Minutes" },
	{ value: "15m", label: "15 Minutes" },
	{ value: "1h", label: "1 Hour" },
	{ value: "4h", label: "4 Hours" },
	{ value: "1d", label: "1 Day" },
];

export const SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];
