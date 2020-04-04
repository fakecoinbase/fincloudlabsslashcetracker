/**
 * exchanges/coinbase/ws_coinbase_pro.mjs
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

import WebSocket from 'ws';

import coinbase_data from './market.mjs';
import { UpdateExchangeDataOnDB } from '../../db/update_db.mjs';
import {
  getUTCISOFormat,
  HasKey,
  Debug,
} from '../../utils/utils.mjs';


class CoinbasePro {
  constructor(db) {
    this.db = db;
    this.reconnect_interval_ms = 5000;
    this.request_msg = {
      type: 'subscribe',
      channels: [{name: 'ticker', product_ids: coinbase_data.product_id}]
    };
  }


  run() {
    this.ListenWebsocket();
  }


  ReconnectSocket() {
    this.ListenWebsocket();
  }


  ListenWebsocket() {
    let ws = new WebSocket('wss://ws-feed.pro.coinbase.com');

    ws.on('open', () => {
      ws.send(JSON.stringify(this.request_msg));
    });

    ws.on('message', (message) => {
      let ws_data = {};
      try {
        ws_data = JSON.parse(message);
      } catch (e) {
        Debug(e);
      }

      ws_data = CoinbasePro.VerifyWebsocketData(ws_data);
      if (ws_data) {
        UpdateExchangeDataOnDB(this.db, coinbase_data.exchange_name, [ws_data]);
      }
    });

    ws.on('close', () => {
      ws = null;
      Debug('Coinbase Pro websocket was closed, it will reconnect again');
      setTimeout(() => { this.ReconnectSocket(); }, this.reconnect_interval_ms);
    });

    ws.on('error', (error) => {
      Debug(error);
    });
  }


  // Function verifies websocket data received from Coinbase Pro websocket.
  // It checks if received data contains corresponding properties and they
  // are not null.
  //
  // Arguments:
  // - ws_data: Websocket data received from Coinbase Pro.
  //
  // Returns null if verification failed otherwise returns verified data.
  static VerifyWebsocketData(ws_data) {
    // Check if expected keys/properties are provided. I check only properties,
    // which are used in the project.
    if (ws_data && HasKey(ws_data, 'type') &&
        ws_data.type === 'ticker' &&
        HasKey(ws_data, 'product_id') &&
        HasKey(ws_data, 'price') &&
        HasKey(ws_data, 'open_24h') &&
        HasKey(ws_data, 'volume_24h') &&
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
        last_update: getUTCISOFormat()
      };

      return coin_data;
    }
    return null;
  }
}

export default CoinbasePro;

