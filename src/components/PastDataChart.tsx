import { useState, useEffect, useRef } from 'react';
import {
  createChart,
  CrosshairMode,
  ColorType,
  LineStyle,
} from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData, Time, MouseEventParams } from 'lightweight-charts';
import { usePastData } from '../hooks/usePastData';
import { SYMBOLS, TICK_SIZE_OPTIONS } from '../types';
import type { TickSize } from '../types';
import { format, subDays } from 'date-fns';
import './PastDataChart.css';

interface PastDataChartProps {
  initialSymbol?: string;
}

export function PastDataChart({ initialSymbol = 'BTCUSDT' }: PastDataChartProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [fromDate, setFromDate] = useState(() => format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [tickSize, setTickSize] = useState<TickSize>('1h');

  const { data, isLoading, error, fetchData } = usePastData();

  const [ohlcLegend, setOhlcLegend] = useState<{ o: number; h: number; l: number; c: number; v: number; change: number } | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    handleFetch();
  }, []);

  const handleFetch = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    fetchData(symbol, from, to, tickSize);
  };

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#4b5563',
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(0, 0, 0, 0.05)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(0, 0, 0, 0.05)', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(22, 163, 74, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#16a34a',
        },
        horzLine: {
          color: 'rgba(22, 163, 74, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#16a34a',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(0, 0, 0, 0.08)',
        scaleMargins: { top: 0.05, bottom: 0.25 },
      },
      timeScale: {
        borderColor: 'rgba(0, 0, 0, 0.08)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderUpColor: '#16a34a',
      borderDownColor: '#dc2626',
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
    });

    const volSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volSeries;

    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (!param.time || !param.seriesData) {
        // Show last candle when not hovering
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
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // Update data
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || data.length === 0) return;

    const candles: CandlestickData[] = data.map((d) => ({
      time: (d.openTime / 1000) as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const vols: HistogramData[] = data.map((d) => ({
      time: (d.openTime / 1000) as Time,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(22, 163, 74, 0.3)' : 'rgba(220, 38, 38, 0.3)',
    }));

    candlestickSeriesRef.current.setData(candles);
    volumeSeriesRef.current.setData(vols);
    chartRef.current?.timeScale().fitContent();

    // Set initial legend to last candle
    const last = data[data.length - 1];
    setOhlcLegend({ o: last.open, h: last.high, l: last.low, c: last.close, v: last.volume, change: ((last.close - last.open) / last.open) * 100 });
  }, [data]);

  const stats = data.length > 0 ? {
    high: Math.max(...data.map((d) => d.high)),
    low: Math.min(...data.map((d) => d.low)),
    totalTrades: data.reduce((sum, d) => sum + d.tradeCount, 0),
    priceChange: data[data.length - 1].close - data[0].open,
    priceChangePercent: ((data[data.length - 1].close - data[0].open) / data[0].open) * 100,
    lastClose: data[data.length - 1].close,
  } : null;

  return (
    <div className="past-data-container">
      <div className="controls-section">
        <div className="control-group">
          <label htmlFor="past-symbol">Symbol</label>
          <select id="past-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="from-date">From</label>
          <input id="from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="control-group">
          <label htmlFor="to-date">To</label>
          <input id="to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="control-group">
          <label htmlFor="tick-size">Interval</label>
          <select id="tick-size" value={tickSize} onChange={(e) => setTickSize(e.target.value as TickSize)}>
            {TICK_SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button onClick={handleFetch} className="btn btn-primary fetch-btn" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {stats && (
        <div className="stats-section">
          <div className="stat-card">
            <span className="stat-label">Last Price</span>
            <span className="stat-value">${stats.lastClose.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">High</span>
            <span className="stat-value high">${stats.high.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Low</span>
            <span className="stat-value low">${stats.low.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Change</span>
            <span className={`stat-value ${stats.priceChange >= 0 ? 'positive' : 'negative'}`}>
              {stats.priceChange >= 0 ? '+' : ''}${stats.priceChange.toFixed(2)}
              ({stats.priceChangePercent >= 0 ? '+' : ''}{stats.priceChangePercent.toFixed(2)}%)
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Trades</span>
            <span className="stat-value">{stats.totalTrades.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Candles</span>
            <span className="stat-value">{data.length}</span>
          </div>
        </div>
      )}

      <div className="tv-chart-section">
        {ohlcLegend && data.length > 0 && !isLoading && (
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
            <span className="ohlc-legend-vol">{ohlcLegend.v.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        )}
        {isLoading && (
          <div className="tv-chart-placeholder">
            <div className="loading">Loading chart data...</div>
          </div>
        )}
        {!isLoading && data.length === 0 && (
          <div className="tv-chart-placeholder">
            <div className="no-data">No data available. Click "Fetch Data" to load.</div>
          </div>
        )}
        <div
          ref={chartContainerRef}
          className="tv-chart-container"
          style={{ display: data.length === 0 || isLoading ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
}
