/**
 * exchanges/kraken/kraken.mjs
 *
 * Copyright (c) 2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   File provides functionality to track coins (all coins supported and
 *   provided by Kraken Pro) using Kraken Pro's Websocket Feed.
 */


import kraken_data from './market.mjs';
import { UpdateExchangeDataOnDB } from '../../db/update_db.mjs';
import { getSupportedCoins } from '../../utils/supported_coins.mjs';
import {
  getUTCISOFormat,
  HasKey,
  Debug
} from '../../utils/utils.mjs';

import assert from 'assert';
import WebSocket from 'ws';


class Kraken {
  // Data members:
  // - db: MongoDB database.
  // - request_msg: Websocket request message format. reqid is an optional,
  //   client originated ID reflected in response message. It must be a
  //   positive integer.
  constructor(db) {
    this.db = db;
    this.request_msg = {
      'event': "subscribe",
      'reqid': 123456789,
      'pair': kraken_data.supported_pairs,
      'subscription': {
        'name': 'ticker'
      }
    };
  }


  run() {
    this.ListenWebsocket();
  };


  ReconnectSocket() {
    this.ListenWebsocket();
  }


  // Function listens Kraken Pro's Websocket Feed, particularly the ticker
  // channel, calls UpdateKrakenCoinsStateInDB() function in order to update
  // coins current state.
  // Note that function is going to run/listen always in background, if any
  // errors occur It won't handle it.
  ListenWebsocket() {

    let ws = new WebSocket('wss://ws.kraken.com');

    ws.on('open', () => {
      ws.send(JSON.stringify(this.request_msg));
    });


    ws.on('message', (ws_data) => {
      ws_data = this.VerifyWebsocketData(ws_data);
      if (ws_data) {
        // Note that this is an async function.
        UpdateExchangeDataOnDB(this.db, kraken_data.exchange_name, [ws_data]);
      }
    });


    ws.on('close', () => {
      ws = null;
      const reconnect_interval_ms = 10000;
      const msg = 'Kraken socket was closed, it will reconnect again';
      Debug(msg);
      setTimeout(() => { this.ReconnectSocket() }, reconnect_interval_ms);
    });
  }


  // Function verifies websocket data received from Kraken websocket.
  // It checks if received data contains corresponding properties and they
  // are not null.
  //
  // Arguments:
  // - ws_data: Websocket data received from Kraken.
  //
  // Returns null if verification failed, otherwise returns verified data.
  VerifyWebsocketData(ws_data) {

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
      if (ticker == 'XBT') {
        ticker = 'BTC';
      } else if (ticker == 'XDG') {
        ticker = 'DOGE';
      } else if (ticker == 'XTR') {
        ticker = 'XLM';
      }

      const supported_coins = getSupportedCoins(kraken_data.exchange_name);
      if (!supported_coins || !supported_coins.hasOwnProperty(ticker)) {
        return null;
      }

      let market_data = ws_data[1];
      if (HasKey(market_data, 'c') &&
          HasKey(market_data, 'o') &&
          HasKey(market_data, 'v')) {

        const coin_data = {
          'ticker': String(ticker),
          'market': String(market),
          'price': Number(market_data.c[0]),
          'open_price': Number(market_data.o[1]),
          'volume24h': Math.round(Number(market_data.v[1])),
          'last_update': getUTCISOFormat()
        };

        return coin_data;
      }
    }

    return null;
  }
};

export default Kraken;

