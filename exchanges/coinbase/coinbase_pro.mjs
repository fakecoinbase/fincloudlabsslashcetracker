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

import coinbase_pro_node from 'coinbase-pro-node';

import coinbase_data from './market.mjs';
import { UpdateExchangeDataOnDB } from '../../db/update_db.mjs';
import {
  getUTCISOFormat,
  HasKey,
  Debug,
} from '../../utils/utils.mjs';

const {CoinbasePro, WebSocketChannelName, WebSocketEvent} = coinbase_pro_node;


class CoinbaseProClass {
  // Data members:
  // - db: MongoDB database.
  // - client: Public client object of the Coinbase Pro package.
  constructor(db) {
    this.db = db;
    this.client = new CoinbasePro({
      apiKey: '',
      apiSecret: '',
      passphrase: '',
      useSandbox: false,
    });
    this.channel = {
      name: WebSocketChannelName.TICKER,
      product_ids: coinbase_data.product_id,
    };
  }

  async run() {
    await this.init();
    this.ListenWebsocket();
  }

  async init() {
    try {
      await this.client.ws.connect({
        connectionTimeout: 8000,
        debug: false,
        maxReconnectionDelay: 10000,
        maxRetries: Infinity,
        minReconnectionDelay: 8000,
        reconnectionDelayGrowFactor: 1,
      });
      this.client.ws.subscribe([this.channel]);
    } catch (error) {
      Debug(error);
    }
  }

  async ListenWebsocket() {
    this.client.ws.on(WebSocketEvent.ON_MESSAGE_TICKER, (ws_data) => {
      ws_data = CoinbaseProClass.VerifyWebsocketData(ws_data);
      if (ws_data) {
        UpdateExchangeDataOnDB(this.db, coinbase_data.exchange_name, [ws_data]);
      }
    });

    this.client.ws.on(WebSocketEvent.ON_OPEN, () => {
       // TODO check if it is connected
       Debug('Coinbase Pro websocket established connection!');
    });

    this.client.ws.on(WebSocketEvent.ON_ERROR, (error) => {
      //Debug('Coinbase Pro websocket error:', error.message);
    });

    this.client.ws.on(WebSocketEvent.ON_CLOSE, () => {
      Debug('Coinbase Pro websocket was closed, it will reconnect again');
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

export default CoinbaseProClass;

