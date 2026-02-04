// API Configuration

export const API_CONFIG = {
  // Past Data Service
  PAST_DATA_BASE_URL: 'http://localhost:8081',
  
  // Live Data WebSocket
  LIVE_DATA_WS_URL: 'ws://localhost:8080',
};

export const getTradesUrl = (
  symbol: string,
  from: string,
  to: string,
  tickSize: string
): string => {
  return `${API_CONFIG.PAST_DATA_BASE_URL}/trades/${symbol}?from=${from}&to=${to}&tickSize=${tickSize}`;
};

export const getLiveWebSocketUrl = (symbol: string): string => {
  return `${API_CONFIG.LIVE_DATA_WS_URL}/ws/live@${symbol}`;
};
