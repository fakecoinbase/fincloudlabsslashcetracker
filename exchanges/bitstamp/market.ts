/**
 * exchanges/bitstamp/market.ts
 *
 * Copyright (c) 2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   File provides the market data for Bitstamp API.
 */

// If Bitstamp adds any new coin support or removes existing one we should
// modify here, add or remove.
const bitstamp_data = [
  {ticker: 'BTC', pairs: 'btcusd', market: 'USD'},
  {ticker: 'ETH', pairs: 'ethusd', market: 'USD'},
  {ticker: 'LTC', pairs: 'ltcusd', market: 'USD'},
  {ticker: 'XRP', pairs: 'xrpusd', market: 'USD'},
  {ticker: 'BCH', pairs: 'bchusd', market: 'USD'}
];

export default bitstamp_data;

