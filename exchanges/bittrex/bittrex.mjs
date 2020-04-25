/**
 * exchanges/bittrex/bittrex.mjs
 *
 * Copyright (c) 2018, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   File provides functionality to track coins (all coins supported by
 *   Bittrex) from Bittrex exchange through websocket.
 */

import SignalR from 'signalr-client';
import jsonic from 'jsonic';
import zlib from 'zlib';

import { getSupportedCoins } from '../../utils/supported_coins.mjs';
import { UpdateExchangeDataOnDB } from '../../db/update_db.mjs';
import { hasKey, Debug, sleep } from '../../utils/utils.mjs';


class Bittrex {
  // Data members:
  // - db: MongoDB database.
  constructor(db) {
    this.db = db;
    this.exchange_name = 'bittrex';
    this.ws_url = 'wss://socket.bittrex.com/signalr';
    this.client = null;
    this.socket_connected = false;
    this.ws_recall_interval_ms = 8000;
  }


  async run() {
    while (1) {
      if (this.socket_connected === false) {
        this.ConnectSocket();
      } else {
        this.ClientCall();
      }
      await sleep(this.ws_recall_interval_ms);
    }
  }


  ConnectSocket() {
    this.client = new SignalR.client(this.ws_url, ['c2'], 2);
    this.client.serviceHandlers.connected = (connection) => {
      if (connection) {
        this.socket_connected = true;
        this.ListenWebsocket();
      }
    };
  }


  CloseSocket() {
    this.socket_connected = false;
    if (this.client) {
      this.client.end();
    }
  }


  ClientCall() {
    if (this.client.state && this.client.state.desc === 'connecting') {
      this.client.call('c2', 'QuerySummaryState').done((error) => {
        if (error) {
          this.client.end();
          this.socket_connected = false;
          Debug(error);
        }
      });
    }
  }


  ListenWebsocket() {
    this.client.serviceHandlers.messageReceived = (message) => {
      const data = jsonic(message.utf8Data);
      if (hasKey(data, 'R') && data.R) {
        const b64 = data.R;
        const raw = new Buffer.from(b64, 'base64');
        zlib.inflateRaw(raw, (error, inflated) => {
          if (!error) {
            const json_data = JSON.parse(inflated.toString('utf8'));
            const coins_data = this.VerifyReceivedData(json_data);
            if (coins_data) {
              // Note that this is an async function.
              UpdateExchangeDataOnDB(this.db, this.exchange_name, coins_data);
            }
          }
        }); // End of zlib.inflateRaw
      }
    };

    this.client.serviceHandlers.onerror = (error) => {
      Debug('Bittrex WebSocket on error:', error);
      this.CloseSocket();
    };

    this.client.serviceHandlers.disconnected = () => {
      Debug('Bittrex WebSocket disconnected');
      this.CloseSocket();
    };

    this.client.serviceHandlers.connectFailed = (error) => {
      Debug('Bittrex WebSocket connect failed:', error);
      this.CloseSocket();
    };

    this.client.serviceHandlers.bindingError = (error) => {
      Debug('Bittrex WebSocket binding error:', error);
      this.CloseSocket();
    };

    this.client.serviceHandlers.connectionLost = (error) => {
      Debug('Bittrex Websocket Connection Lost:', error);
      this.CloseSocket();
    };

    this.client.serviceHandlers.disconnected = () => {
      Debug('Bittrex WebSocket disconnected');
      this.CloseSocket();
    };

    this.client.serviceHandlers.reconnecting = (retry) => {
      Debug('Bittrex Websocket Retrying:', retry);
      // return retry.count >= 3; /* cancel retry true */
      return false;
    };
  }


  // Function verifies data received from Bittrex Websocket's QuerySummaryState
  // feed. It checks if received data contains corresponding properties and they
  // are not null or an empty.
  // See https://bittrex.github.io/#QuerySummaryState for details.
  //
  // Note:
  // Volume is the amount traded in that altcoin over the past 24 hours.
  // BaseVolume is the total value traded in the base currency, for example, BTC.
  //
  // Arguments:
  // - bittrex_data: Data received from Bittrex Websocket feed.
  //
  // Returns null if verification failed otherwise an array of verified summary
  // data and data contains market name, volume, last price and previous day price.
  VerifyReceivedData(bittrex_data) {
    if (bittrex_data && hasKey(bittrex_data, 's') && bittrex_data.s) {
      const market_summary = [];
      const summary_data = bittrex_data.s;
      for (let i = 0; i < summary_data.length; i++) {
        const market_data = summary_data[i];
        if (hasKey(market_data, 'M') &&
            hasKey(market_data, 'm') &&
            hasKey(market_data, 'l') &&
            hasKey(market_data, 'PD') &&
            isNaN(market_data.V) === false &&
            isNaN(market_data.l) === false &&
            isNaN(market_data.PD) === false) {
          const market_name = String(market_data.M);
          const ticker = market_name.split('-')[1];
          const market = market_name.split('-')[0];

          const supported_coins = getSupportedCoins(this.exchange_name);
          if (supported_coins && hasKey(supported_coins, ticker)) {
            const coin_data = {
              ticker: String(ticker),
              market: String(market),
              price: Number(market_data.l),
              open_price: Number(market_data.PD),
              volume24h: Math.round(Number(market_data.m)),
              last_update: new Date()
            };
            market_summary.push(coin_data);
          }
        }
      }

      if (market_summary.length >= 1) {
        return market_summary;
      }
    }

    return null;
  }
}

export default Bittrex;

