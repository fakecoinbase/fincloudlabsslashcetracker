/**
 * exchanges/coinbase/ws_coinbase_pro.ts
 *
 * Copyright (c) 2018-2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   File provides functionality to track coins (all coins supported by
 *   Coinbase Pro) from Coinbase Pro exchange using Coinbase Pro's Websocket
 *   Feed. The websocket feed provides real-time market data updates for orders
 *   and trades.
 */

import ReconnectingWebsocket from '../../utils/reconnecting_websocket';
import coinbase_data from './market';
import { updateExchangeDataOnDB } from '../../db/update_db';
import { hasKey, hasKeys, Debug } from '../../utils/utils';


class CoinbasePro {
  db: any;
  request_msg: any;

  constructor(db) {
    this.db = db;
    this.request_msg = {
      type: 'subscribe',
      channels: [{name: 'ticker', product_ids: coinbase_data.product_id}]
    };
  }

  run() { this.connect(); }

  connect() {
    const socket = new ReconnectingWebsocket(
      'wss://ws-feed.pro.coinbase.com',
      this.request_msg,
      CoinbasePro.processData,
      {db: this.db, exchange: coinbase_data.exchange_name}
    );
    socket.run();
  }

  static processData(ws_data, db) {
    try {
      ws_data = JSON.parse(ws_data);
    } catch (error) {
      Debug(error);
      return;
    }
    ws_data = verifyWebsocketData(ws_data);
    if (ws_data) {
      updateExchangeDataOnDB(db, coinbase_data.exchange_name, [ws_data]);
    }
  }
}


// Function verifies websocket data received from Coinbase Pro websocket.
// It checks if received data contains corresponding properties and they
// are not null.
//
// Arguments:
// - ws_data: Websocket data received from Coinbase Pro.
//
// Returns null if verification failed otherwise returns verified data.
function verifyWebsocketData(ws_data) {
  // Check if expected keys/properties are provided. I check only properties,
  // which are used in the project.
  if (ws_data && hasKey(ws_data, 'type') &&
      ws_data.type === 'ticker' &&
      hasKeys(ws_data, ['product_id', 'price', 'open_24h', 'volume_24h']) &&
      ws_data.product_id && ws_data.price) {
    const product_id = String(ws_data.product_id);
    const ticker = String((product_id.split('-'))[0]);
    const market = String((product_id.split('-'))[1]);

    const coin_data = {
      ticker: String(ticker),
      market: String(market),
      price: Number(ws_data.price),
      open_price: Number(ws_data.open_24h),
      volume24h: Number(ws_data.volume_24h),
      last_update: new Date()
    };

    return coin_data;
  }

  return null;
}

export default CoinbasePro;
