import { useState, useEffect, useRef, useCallback } from 'react';
import { getLiveWebSocketUrl } from '../config/api';
import type { LiveTradeData } from '../types';

interface LiveDataPoint {
  time: number;
  price: number;
  volume: number;
}

const MAX_DATA_POINTS = 100;

export function useLiveData(symbol: string) {
  const [data, setData] = useState<LiveDataPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTrade, setLastTrade] = useState<LiveTradeData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

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
        const trade: LiveTradeData = JSON.parse(event.data);
        setLastTrade(trade);
        
        const newPoint: LiveDataPoint = {
          time: trade.T,
          price: parseFloat(trade.p),
          volume: parseFloat(trade.q),
        };

        setData((prev) => {
          const updated = [...prev, newPoint];
          // Keep only the last MAX_DATA_POINTS
          if (updated.length > MAX_DATA_POINTS) {
            return updated.slice(-MAX_DATA_POINTS);
          }
          return updated;
        });
      } catch (e) {
        console.error('Failed to parse trade data:', e);
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 3000);
    };
  }, [symbol]);

  const disconnect = useCallback(() => {
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
    setData([]); // Clear data when symbol changes
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
    lastTrade,
    clearData,
    reconnect: connect,
  };
}
