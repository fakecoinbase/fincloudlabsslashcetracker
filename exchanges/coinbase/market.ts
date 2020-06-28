/**
 * exchanges/coinbase/market.ts
 *
 * Copyright (c) 2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   File provides the market data for Coinbase Pro API.
 */

const usd_market = [
  'ALGO-USD',
  'BCH-USD',
  'BTC-USD',
  'DASH-USD',
  'EOS-USD',
  'ETC-USD',
  'ETH-USD',
  'LINK-USD',
  'LTC-USD',
  'REP-USD',
  'XLM-USD',
  'XRP-USD',
  'XTZ-USD',
  'ZRX-USD',
];

const btc_market = [
/*
  'BCH-BTC',
  'EOS-BTC',
  'ETC-BTC',
  'ETH-BTC',
  'LTC-BTC',
  'REP-BTC',
  'XLM-BTC',
  'XRP-BTC',
  'ZRX-BTC'
*/
];

const product_id_list = usd_market.concat(btc_market);


const coinbase_data = {
  exchange_name: 'coinbase',
  product_id: product_id_list
};

export default coinbase_data;
