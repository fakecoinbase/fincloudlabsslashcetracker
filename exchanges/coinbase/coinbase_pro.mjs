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

import async from 'async';
import coinbase_pro from 'coinbase-pro';

import coinbase_data from './market.mjs';
import { UpdateExchangeDataOnDB } from '../../db/update_db.mjs';
import { getSupportedCoins } from '../../utils/supported_coins.mjs';
import {
  getUTCISOFormat,
  HasKey,
  Debug,
  Sleep
} from '../../utils/utils.mjs';

// Global variable to store product stats.
const product_stats = {};


class CoinbasePro {
  // Data members:
  // - db: MongoDB database.
  // - request_cycle_interval: Request product stats interval in milliseconds.
  // - per_request_interval: Per request interval in milliseconds.
  // - public_client: Public client object of the Coinbase Pro package.
  constructor(db) {
    this.db = db;
    this.request_cycle_interval = 5 * 60000;
    this.per_request_interval = 1300;
    this.public_client = new coinbase_pro.PublicClient();
  }


  run() {
    this.TrackProductStats();
    this.ListenWebsocket();
  }


  ReconnectSocket() {
    this.ListenWebsocket();
  }


  // Function listens Coinbase Pro websocket feed, tracks corresponding data,
  // updates coins current state and stores/updates in the MongoDB database.
  ListenWebsocket() {
    const ws = new coinbase_pro.WebsocketClient(coinbase_data.product_id);

    ws.on('message', (ws_data) => {
      ws_data = CoinbasePro.VerifyWebsocketData(ws_data);
      if (ws_data) {
        UpdateExchangeDataOnDB(this.db, coinbase_data.exchange_name, [ws_data]);
      }
    });

    ws.on('error', (error) => {
      Debug('Coinbase Pro websocket error:', error);
    });

    ws.on('close', () => {
      const reconnect_interval_ms = 10000;
      const msg = 'Coinbase Pro websocket was closed, it will reconnect again';
      Debug(msg);
      setTimeout(() => { this.ReconnectSocket(); }, reconnect_interval_ms);
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
        ws_data.type === 'match' &&
        HasKey(ws_data, 'product_id') &&
        HasKey(ws_data, 'price') &&
        ws_data.product_id && ws_data.price) {
      const product_id = String(ws_data.product_id);
      const ticker = String((product_id.split('-'))[0]);
      const market = String((product_id.split('-'))[1]);

      const supported_coins = getSupportedCoins(coinbase_data.exchange_name);
      if (!supported_coins || !HasKey(supported_coins, ticker)) {
        return null;
      }

      let open_price = null;
      let volume24h = null;
      if (product_stats && HasKey(product_stats, ticker) &&
          HasKey(product_stats[ticker], market)) {
        open_price = product_stats[ticker][market].open_price;
        volume24h = product_stats[ticker][market].volume24h;
      }

      const coin_data = {
        'ticker': String(ticker),
        'market': String(market),
        'price': Number(ws_data.price),
        'open_price': open_price,
        'volume24h': volume24h,
        'last_update': getUTCISOFormat()
      };

      return coin_data;
    }
    return null;
  }


  // Note that there is a rate limits. Coinbase throttles public endpoints by IP:
  // 3 requests per second, up to 6 requests per second in bursts.
  async getCoinbaseProductStats() {
    async.eachSeries(coinbase_data.product_id, (market_id, next) => {
      setTimeout(() => this.public_client.getProduct24HrStats(market_id,
        (error, response, data) => {
          if (error) {
            Debug(error);
          } else if (data && HasKey(data, 'open') && HasKey(data, 'volume') &&
                     data.open && data.volume) {
            const ticker = String((market_id.split('-'))[0]);
            const market = String((market_id.split('-'))[1]);
            const open_price = Number(data.open);
            const volume24h = Math.round(Number(data.volume));
            if (!HasKey(product_stats, ticker)) {
              product_stats[ticker] = {};
            }

            product_stats[ticker][market] = {
              'open_price': open_price,
              'volume24h': volume24h
            };
          }

          next();
        }), this.per_request_interval);
    }, () => {});
  }


  async TrackProductStats() {
    while (1) {
      try {
        await this.getCoinbaseProductStats();
      } catch (e) {
        Debug(e);
      } finally {
        if (!this.public_client) {
          this.public_client = new coinbase_pro.PublicClient();
        }
      }

      await Sleep(this.request_cycle_interval);
    }
  }
}

export default CoinbasePro;

