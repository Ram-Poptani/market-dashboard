import { useState } from 'react';
import { LiveChart } from './components/LiveChart';
import { PastDataChart } from './components/PastDataChart';
import './App.css';

type TabType = 'live' | 'historical';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [liveSymbol, setLiveSymbol] = useState('BTCUSDT');

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">📊</div>
          <h1>Market Data Platform</h1>
          <span className="subtitle">Real-time & historical crypto analytics</span>
        </div>

        <nav className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <span className="tab-icon">⚡</span> Live
          </button>
          <button
            className={`tab-btn ${activeTab === 'historical' ? 'active' : ''}`}
            onClick={() => setActiveTab('historical')}
          >
            <span className="tab-icon">📈</span> Historical
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'live' && (
          <LiveChart symbol={liveSymbol} onSymbolChange={setLiveSymbol} />
        )}
        {activeTab === 'historical' && (
          <PastDataChart initialSymbol={liveSymbol} />
        )}
      </main>

      <footer className="app-footer">
        <span>Data provided by Binance API &bull; Built with React &amp; Chart.js</span>
      </footer>
    </div>
  );
}

export default App;
