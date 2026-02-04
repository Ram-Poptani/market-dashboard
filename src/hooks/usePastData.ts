import { useState, useCallback } from 'react';
import { getTradesUrl } from '../config/api';
import type { CandleData, TickSize } from '../types';
import { format } from 'date-fns';

export function usePastData() {
  const [data, setData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (symbol: string, from: Date, to: Date, tickSize: TickSize) => {
      setIsLoading(true);
      setError(null);

      try {
        const fromStr = format(from, "yyyy-MM-dd'T'HH:mm:ss");
        const toStr = format(to, "yyyy-MM-dd'T'HH:mm:ss");
        const url = getTradesUrl(symbol, fromStr, toStr, tickSize);

        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const candles: CandleData[] = await response.json();
        setData(candles);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to fetch data';
        setError(message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearData = useCallback(() => {
    setData([]);
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchData,
    clearData,
  };
}
