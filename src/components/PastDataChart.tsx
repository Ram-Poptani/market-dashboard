import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { usePastData } from '../hooks/usePastData';
import { SYMBOLS, TICK_SIZE_OPTIONS } from '../types';
import type { TickSize } from '../types';
import { format, subDays } from 'date-fns';
import './PastDataChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PastDataChartProps {
  initialSymbol?: string;
}

export function PastDataChart({ initialSymbol = 'BTCUSDT' }: PastDataChartProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [fromDate, setFromDate] = useState(() => format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [tickSize, setTickSize] = useState<TickSize>('1h');

  const { data, isLoading, error, fetchData } = usePastData();

  useEffect(() => {
    handleFetch();
  }, []);

  const handleFetch = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    fetchData(symbol, from, to, tickSize);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (tickSize === '1d') {
      return format(date, 'MMM dd');
    } else if (tickSize === '4h' || tickSize === '1h') {
      return format(date, 'MMM dd HH:mm');
    }
    return format(date, 'HH:mm');
  };

  const priceChartData = {
    labels: data.map((d) => formatTime(d.openTime)),
    datasets: [
      {
        label: 'Close Price',
        data: data.map((d) => d.close),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        fill: true,
        pointRadius: data.length > 100 ? 0 : 2,
        borderWidth: 2,
      },
      {
        label: 'High',
        data: data.map((d) => d.high),
        borderColor: 'rgba(0, 255, 136, 0.5)',
        backgroundColor: 'transparent',
        tension: 0.1,
        fill: false,
        pointRadius: 0,
        borderWidth: 1,
        borderDash: [5, 5],
      },
      {
        label: 'Low',
        data: data.map((d) => d.low),
        borderColor: 'rgba(255, 68, 68, 0.5)',
        backgroundColor: 'transparent',
        tension: 0.1,
        fill: false,
        pointRadius: 0,
        borderWidth: 1,
        borderDash: [5, 5],
      },
    ],
  };

  const volumeChartData = {
    labels: data.map((d) => formatTime(d.openTime)),
    datasets: [
      {
        label: 'Volume',
        data: data.map((d) => d.volume),
        backgroundColor: data.map((d) =>
          d.close >= d.open ? 'rgba(0, 255, 136, 0.6)' : 'rgba(255, 68, 68, 0.6)'
        ),
        borderColor: data.map((d) =>
          d.close >= d.open ? 'rgb(0, 255, 136)' : 'rgb(255, 68, 68)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const priceOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e0e0e0',
        },
      },
      title: {
        display: true,
        text: `${symbol} Historical Price (${tickSize})`,
        font: {
          size: 16,
        },
        color: '#e0e0e0',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const idx = context.dataIndex;
            const candle = data[idx];
            if (context.datasetIndex === 0) {
              return [
                `Open: $${candle.open.toFixed(2)}`,
                `High: $${candle.high.toFixed(2)}`,
                `Low: $${candle.low.toFixed(2)}`,
                `Close: $${candle.close.toFixed(2)}`,
              ].join(' | ');
            }
            const y = context.parsed.y;
            return y != null ? `${context.dataset.label}: $${y.toFixed(2)}` : '';
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          color: '#e0e0e0',
        },
        ticks: {
          maxTicksLimit: 12,
          color: '#888',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Price (USD)',
          color: '#e0e0e0',
        },
        ticks: {
          color: '#888',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  const volumeOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Volume',
        font: {
          size: 14,
        },
        color: '#e0e0e0',
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 12,
          color: '#888',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        display: true,
        ticks: {
          color: '#888',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  // Calculate statistics
  const stats = data.length > 0 ? {
    high: Math.max(...data.map((d) => d.high)),
    low: Math.min(...data.map((d) => d.low)),
    avgVolume: data.reduce((sum, d) => sum + d.volume, 0) / data.length,
    totalTrades: data.reduce((sum, d) => sum + d.tradeCount, 0),
    priceChange: data[data.length - 1].close - data[0].open,
    priceChangePercent: ((data[data.length - 1].close - data[0].open) / data[0].open) * 100,
  } : null;

  return (
    <div className="past-data-container">
      <div className="controls-section">
        <div className="control-group">
          <label htmlFor="past-symbol">Symbol</label>
          <select
            id="past-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="from-date">From</label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="to-date">To</label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="tick-size">Interval</label>
          <select
            id="tick-size"
            value={tickSize}
            onChange={(e) => setTickSize(e.target.value as TickSize)}
          >
            {TICK_SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleFetch} 
          className="btn btn-primary fetch-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {stats && (
        <div className="stats-section">
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

      <div className="charts-section">
        <div className="price-chart-wrapper">
          {isLoading ? (
            <div className="loading">Loading chart data...</div>
          ) : data.length === 0 ? (
            <div className="no-data">No data available. Click "Fetch Data" to load.</div>
          ) : (
            <Line data={priceChartData} options={priceOptions} />
          )}
        </div>

        {data.length > 0 && (
          <div className="volume-chart-wrapper">
            <Bar data={volumeChartData} options={volumeOptions} />
          </div>
        )}
      </div>
    </div>
  );
}
