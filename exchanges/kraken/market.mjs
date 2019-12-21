/**
 * exchanges/kraken/market.mjs
 *
 * Copyright (c) 2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   File provides market data for Kraken API.
 */

// Aliases: Few pairs have supported aliases.
//
// Asset Name  Symbol  Alias
// ----------  ------  -----
// Bitcoin     XBT     BTC
// Doge        XDG     DOGE
// Stellar     XLM     STR
const usd_market = [
  'ADA/USD',
  'ATOM/USD',
  'BAT/USD',
  'BCH/USD',
  'BTC/USD',
  'DAI/USD',
  'DASH/USD',
  'EOS/USD',
  'ETC/USD',
  'ETH/USD',
  'GNO/USD',
  'ICX/USD',
  'LINK/USD',
  'LTC/USD',
  'QTUM/USD',
  'REP/USD',
  'SC/USD',
  'STR/USD',
  'USDT/USD',
  'WAVES/USD',
  'XBT/USD',
  'XLM/USD',
  'XMR/USD',
  'XRP/USD',
  'XTZ/USD',
  'ZEC/USD'
];

// For now I track only USD market.
const btc_market = [/*TODO provide BTC market pairs*/];

const supported_pairs = usd_market.concat(btc_market);


const kraken_data = {
  'exchange_name': 'kraken',
  'supported_pairs': supported_pairs
};

export { kraken_data };
export default kraken_data;

