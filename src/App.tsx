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
        <h1>📊 Binance Trading Dashboard</h1>
        <nav className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            🔴 Live Data
          </button>
          <button
            className={`tab-btn ${activeTab === 'historical' ? 'active' : ''}`}
            onClick={() => setActiveTab('historical')}
          >
            📈 Historical Data
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
        <p>Data provided by Binance API • Built with React & Chart.js</p>
      </footer>
    </div>
  );
}

export default App;
