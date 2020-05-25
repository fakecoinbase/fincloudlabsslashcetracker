/**
 * exchanges/bitstamp/bitstamp.mjs
 *
 * Copyright (c) 2018, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   File provides functionality to track coins (all coins supported by
 *   Bitstamp) from Bitstamp exchange.
 */

import axios from 'axios';
import bitstamp_data from './market.mjs';
import { updateExchangeDataOnDB } from '../../db/update_db.mjs';
import { getSupportedCoins } from '../../utils/supported_coins.mjs';
import { hasKey, Debug, sleep } from '../../utils/utils.mjs';


// WARNING: Rate Limits: Do not make more than 600 requests per 10 minutes,
//          otherwise Bitstamp will ban IP address.


class Bitstamp {
  // Data members:
  // - db: MongoDB database.
  // - request_interval_ms: Request interval in milliseconds.
  // - per_request_interval_ms: Per coin request interval in milliseconds.
  constructor(db) {
    this.db = db;
    this.request_interval_ms = 8000;
    this.per_request_interval_ms = 200;
    this.exchange_name = 'bitstamp';
    this.api = axios.create({baseURL: 'https://www.bitstamp.net/api/v2/ticker'});
  }


  async run() {
    while (1) {
      try {
        await this.trackBitstampCoins();
      } catch (error) {
        Debug(error);
      }
      await sleep(this.request_interval_ms);
    }
  }


  async trackBitstampCoins() {
    for (let i = 0; i < bitstamp_data.length; i++) {
      let coin_data = await this.getBitstampCoinData(bitstamp_data[i]);
      coin_data = this.verifyReceivedData(coin_data, bitstamp_data[i]);
      if (coin_data) {
        updateExchangeDataOnDB(this.db, this.exchange_name, [coin_data]);
      }
      await sleep(this.per_request_interval_ms);
    }
  }


  async getBitstampCoinData(currency) {
    try {
      const response = await this.api.get(`/${currency.pairs}`);
      if (response && response.data) return response.data;
      return null;
    } catch (error) {
      Debug(error);
      return null;
    }
  }


  // Function verifies data received from Bitstamp REST API. It checks if
  // received data contains corresponding properties and they are not null.
  //
  // Arguments:
  // - resp_data: Data received from Bitstamp REST API.
  //
  // Returns null if verification failed otherwise verified data.
  verifyReceivedData(resp_data, currency) {
    // Check if expected keys/properties are provided.
    // Note that we check only properties, which are used in project.
    if (resp_data &&
        hasKey(resp_data, 'last') &&
        hasKey(resp_data, 'volume') &&
        hasKey(resp_data, 'open') &&
        isNaN(resp_data.last) === false &&
        isNaN(resp_data.volume) === false &&
        isNaN(resp_data.open) === false) {
      const supported_coins = getSupportedCoins(this.exchange_name);
      if (!supported_coins || !hasKey(supported_coins, currency.ticker)) {
        return null;
      }

      return {
        ticker: currency.ticker,
        market: currency.market,
        price: Number(resp_data.last),
        open_price: Number(resp_data.open),
        volume24h: Math.round(Number(resp_data.volume)),
        last_update: new Date()
      };
    }

    return null;
  }
}

export default Bitstamp;
