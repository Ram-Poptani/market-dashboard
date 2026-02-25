import { useState, useEffect, useRef } from 'react';
import {
  createChart,
  CrosshairMode,
  ColorType,
  LineStyle,
} from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData, Time, MouseEventParams } from 'lightweight-charts';
import { useLiveData } from '../hooks/useLiveData';
import { SYMBOLS } from '../types';
import './LiveChart.css';

interface LiveChartProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
}

export function LiveChart({ symbol, onSymbolChange }: LiveChartProps) {
  const { data, isConnected, error, clearData, reconnect } = useLiveData(symbol);

  const [ohlcLegend, setOhlcLegend] = useState<{ o: number; h: number; l: number; c: number; v: number; change: number } | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Create chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(59, 130, 246, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#3b82f6',
        },
        horzLine: {
          color: 'rgba(59, 130, 246, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#3b82f6',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        scaleMargins: { top: 0.05, bottom: 0.25 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 3,
        barSpacing: 6,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const volSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volSeries;

    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (!param.time || !param.seriesData) {
        const d = dataRef.current;
        if (d.length > 0) {
          const last = d[d.length - 1];
          setOhlcLegend({ o: last.open, h: last.high, l: last.low, c: last.close, v: last.volume, change: ((last.close - last.open) / last.open) * 100 });
        }
        return;
      }
      const candleVal = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      const volVal = param.seriesData.get(volSeries) as HistogramData | undefined;
      if (candleVal) {
        setOhlcLegend({
          o: candleVal.open, h: candleVal.high, l: candleVal.low, c: candleVal.close,
          v: volVal?.value ?? 0,
          change: ((candleVal.close - candleVal.open) / candleVal.open) * 100,
        });
      }
    });

    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    });
    ro.observe(chartContainerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // Update data on each tick
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || data.length === 0) return;

    const candles: CandlestickData[] = data.map((d) => ({
      time: (d.time / 1000) as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const vols: HistogramData[] = data.map((d) => ({
      time: (d.time / 1000) as Time,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
    }));

    candleSeriesRef.current.setData(candles);
    volumeSeriesRef.current.setData(vols);

    // Auto-scroll to the latest bar
    chartRef.current?.timeScale().scrollToRealTime();

    // Update legend to last candle
    const last = data[data.length - 1];
    setOhlcLegend({ o: last.open, h: last.high, l: last.low, c: last.close, v: last.volume, change: ((last.close - last.open) / last.open) * 100 });
  }, [data]);

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
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="chart-actions">
          <button onClick={clearData} className="btn btn-secondary">Clear</button>
          {!isConnected && (
            <button onClick={reconnect} className="btn btn-primary">Reconnect</button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tv-chart-section">
        {ohlcLegend && data.length > 0 && (
          <div className="ohlc-legend">
            <span className="ohlc-legend-symbol">{symbol}</span>
            <span className="ohlc-legend-label">O</span>
            <span className={`ohlc-legend-val ${ohlcLegend.c >= ohlcLegend.o ? 'up' : 'down'}`}>{ohlcLegend.o.toFixed(2)}</span>
            <span className="ohlc-legend-label">H</span>
            <span className={`ohlc-legend-val ${ohlcLegend.c >= ohlcLegend.o ? 'up' : 'down'}`}>{ohlcLegend.h.toFixed(2)}</span>
            <span className="ohlc-legend-label">L</span>
            <span className={`ohlc-legend-val ${ohlcLegend.c >= ohlcLegend.o ? 'up' : 'down'}`}>{ohlcLegend.l.toFixed(2)}</span>
            <span className="ohlc-legend-label">C</span>
            <span className={`ohlc-legend-val ${ohlcLegend.c >= ohlcLegend.o ? 'up' : 'down'}`}>{ohlcLegend.c.toFixed(2)}</span>
            <span className={`ohlc-legend-change ${ohlcLegend.change >= 0 ? 'up' : 'down'}`}>
              {ohlcLegend.change >= 0 ? '+' : ''}{ohlcLegend.change.toFixed(2)}%
            </span>
            <span className="ohlc-legend-label">Vol</span>
            <span className="ohlc-legend-vol">{ohlcLegend.v.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
          </div>
        )}
        {data.length === 0 ? (
          <div className="tv-chart-placeholder">
            <div className="no-data">
              {isConnected ? 'Waiting for data...' : 'Not connected'}
            </div>
          </div>
        ) : null}
        <div
          ref={chartContainerRef}
          className="tv-chart-container"
          style={{ display: data.length === 0 ? 'none' : 'block' }}
        />
      </div>

      <div className="chart-footer">
        <span>Data points: {data.length}</span>
      </div>
    </div>
  );
}
