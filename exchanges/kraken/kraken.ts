/**
 * exchanges/kraken/kraken.ts
 *
 * Copyright (c) 2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   File provides functionality to track coins (all coins supported and
 *   provided by Kraken Pro) using Kraken Pro's Websocket Feed.
 */

import kraken_data from './market';
import ReconnectingWebsocket from '../../utils/reconnecting_websocket';
import { updateExchangeDataOnDB } from '../../db/update_db';
import { getSupportedCoins } from '../../utils/supported_coins';
import { hasKey, hasKeys, Debug } from '../../utils/utils';


class Kraken {
  // Data members:
  // - db: MongoDB database.
  // - request_msg: Websocket request message format. reqid is an optional,
  //   client originated ID reflected in response message. It must be a
  //   positive integer.
  db: any;
  request_msg: any;

  constructor(db) {
    this.db = db;
    this.request_msg = {
      event: 'subscribe',
      reqid: 123456789,
      pair: kraken_data.supported_pairs,
      subscription: {
        name: 'ticker'
      }
    };
  }

  run() {
    const socket = new ReconnectingWebsocket(
      'wss://ws.kraken.com',
      this.request_msg,
      Kraken.processData,
      {db: this.db, exchange: kraken_data.exchange_name}
    );
    socket.run();
  }

  static processData(ws_data, db) {
    ws_data = verifyWebsocketData(ws_data);
    if (ws_data) {
      // Note that this is an async function.
      updateExchangeDataOnDB(db, kraken_data.exchange_name, [ws_data]);
    }
  }
}


// Function verifies websocket data received from Kraken websocket.
// It checks if received data contains corresponding properties and they
// are not null.
//
// Arguments:
// - ws_data: Websocket data received from Kraken.
//
// Returns null if verification failed, otherwise returns verified data.
function verifyWebsocketData(ws_data) {
  try {
    ws_data = JSON.parse(ws_data);
  } catch (e) {
    Debug(e);
    return null;
  }

  // Check if expected keys/properties are provided. I check only properties,
  // which are used in the project
  if (Array.isArray(ws_data) && ws_data.length >= 4 &&
      ws_data[1] && ws_data[3]) {
    let ticker = ws_data[3].split('/')[0];
    const market = ws_data[3].split('/')[1];
    // For now I track only USD market.
    if (market !== 'USD') {
      return null;
    }

    // Few pairs have supported aliases.
    if (ticker === 'XBT') {
      ticker = 'BTC';
    } else if (ticker === 'XDG') {
      ticker = 'DOGE';
    } else if (ticker === 'XTR') {
      ticker = 'XLM';
    }

    const supported_coins = getSupportedCoins(kraken_data.exchange_name);
    if (!supported_coins || !hasKey(supported_coins, ticker)) {
      return null;
    }

    const market_data = ws_data[1];
    if (hasKeys(market_data, ['c', 'o', 'v'])) {
      const coin_data = {
        ticker: String(ticker),
        market: String(market),
        price: Number(market_data.c[0]),
        open_price: Number(market_data.o[1]),
        volume24h: Math.round(Number(market_data.v[1])),
        last_update: new Date()
      };

      return coin_data;
    }
  }

  return null;
}

export default Kraken;
