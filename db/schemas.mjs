/**
 * db/schemas.mjs
 *
 * Copyright (c) 2018-2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   File provides exchanges schema's for MongoDB database.
 */

import { getUTCISOFormat } from '../utils/utils.mjs';
import { getSupportedCoins } from '../utils/supported_coins.mjs';

// Function constructs coins' metadata (coins_metadata variable) schema
// for exchange coins.
//
// Arguments:
// - coin_name: Coin's full name.
// - data: Coin's data. It must be in this format:
//   {
//    ticker: <ticker>,
//    market: <market>,
//    price:  <value>,
//    open_orice: <value>,
//    change24h: <value>,
//    volume24h: <value>,
//    last_update: <value>
//   }
function getExchCoinDataSchema(coin_name, data = null) {
  // Schema Properties.
  // - name: Coin's full name.
  // - market_cap: Market capitalization of coin.
  // - volume24h: Trading volume in 24 hours based on base currency.
  // - price: Current price in base currency. e.g. {USD: 120, BTC: 0.01}
  // - open_price: An open price of coin based on base currency.
  // - change24h: Basically this is a difference between an open price of coin
  //              00:00 UTC time standard and current price in percentage.
  const coin_data = {
    'name': String(coin_name),
    'price': {},
    'open_price': {},
    'change24h': {},
    'volume24h': {},
    'supply': 0,
    'market_cap': 0,
    'last_update': getUTCISOFormat()
  };

  if (data) {
    coin_data.price[data.market] = data.price;
    coin_data.open_price[data.market] = data.open_price;
    coin_data.change24h[data.market] = data.change24h;
    coin_data.volume24h[data.market] = data.volume24h;
    coin_data.last_update[data.market] = data.last_update;
  }

  return coin_data;
}



function getCoinsMetadata(exchange) {
  const coins_metadata = {};
  const supported_coins = getSupportedCoins(exchange);
  for (const [ticker, name] of Object.entries(supported_coins)) {
    coins_metadata[ticker] = getExchCoinDataSchema(name);
  }

  return coins_metadata;
}



// Function creates schema for every single exchange in order to store supported
// coins' metadata. Basically this will be used by exchanges_api functionalities.
function getExchangeSchema(exchange_name) {
  // Schema Properties.
  //
  // - exchange: Exchange name.
  // - last_update: The last update of exchange in UTC standard.
  // - coins_metadata: Coins' (supported by exchange) metadata.
  //                   See getExchCoinDataSchema() function for metadata info.
  const exchange_schema = {
    '_id': String(exchange_name),
    'exchange': String(exchange_name),
    'last_update': getUTCISOFormat(),
    'coins_metadata': getCoinsMetadata(exchange_name)
  };

  return exchange_schema;
}

export { getExchangeSchema, getExchCoinDataSchema };

