/**
 * db/update_db.ts
 *
 * Copyright (c) 2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   File provides functionality to update database for given exchange.
 */

import { crypto_market_data_coll } from '../utils/constants';
import { getExchangeSchema, getExchCoinDataSchema } from './schemas';
import {
  getPercentageChange,
  Debug,
  hasKey
} from '../utils/utils';
import {
  getSupportedCoins,
  getSupportedExchanges
} from '../utils/supported_coins';


// Function updates already existing on the database exchange data.
//
// Arguments:
// - exchanges_col: MongoDB collection which stores all exchanges' documents.
// - exchange_name: Exchange name.
// - ws_data: Exchange data received by websocket or REST API.
function updateExistingData(exchanges_col, exchange_name, ws_data_list) {
  const update = {};
  for (let i = 0; i < ws_data_list.length; i++) {
    const coin_data = ws_data_list[i];
    const embedded_path = 'data.' + coin_data.ticker;
    const market = coin_data.market;

    coin_data['change24h'] = getPercentageChange(coin_data.price, coin_data.open_price);

    update['last_update'] = new Date();
    update[embedded_path + '.price.' + market] = coin_data.price;
    update[embedded_path + '.open_price.' + market] = coin_data.open_price;
    update[embedded_path + '.volume24h.' + market] = coin_data.volume24h;
    update[embedded_path + '.change24h.' + market] = coin_data.change24h;
    update[embedded_path + '.market_cap'] = null;
    update[embedded_path + '.last_update'] = coin_data.last_update;
  }

  const query = {_id: exchange_name};
  exchanges_col.updateOne(query, {$set: update}, (error) => {
    // If we get an error here it is okay, it will be updated again in a few
    // seconds.
    if (error) {
      Debug(error.message, 'This is okay');
    }
  });
}



// Function updates exchanges' data on the MongoDB database.
//
// Arguments:
// - db: MongoDB database.
// - exchange_name: Exchange name.
// - data_list: Exchange data received by websocket or REST API.
function updateExchangeDataOnDB(db, exchange_name, data_list) {
  // TODO I should invoke a function to get coins' supply.

  if (data_list && data_list.length > 0) {
    const coll = db.collection(crypto_market_data_coll);
    updateExistingData(coll, exchange_name, data_list);
  }
}



// Function does MongoDB database setup. If exchange does not exist it creates
// a new exchange schema and inserts, otherwise it checks if already stored
// exchange supports current list of coins, if it does not, it adds a new coin's
// schema.
async function setupMongoDB(coll, exch_name) {
  return new Promise((resolve, reject) => {
    const exch_coins = getSupportedCoins(exch_name);
    const query = {_id: exch_name};

    coll.findOne(query, (error, found) => {
      if (error) {
        reject(error.message);
      } else if (found) {
        const update = {};
        // TODO What if a coin was removed from the given exchange?
        Object.keys(exch_coins).forEach(ticker => {
          const embedded_path = 'data.' + ticker;
          update[embedded_path] = getExchCoinDataSchema(exch_coins[ticker]);
        });

        if (Object.keys(update).length > 0) {
          coll.updateOne(query, {$set: update}, (error) => {
            if (error) {
              reject(error.message);
            } else {
              resolve('ok');
            }
          });
        } else {
          resolve('ok');
        }
      } else {
        const exch_schema = getExchangeSchema(exch_name);
        coll.insertOne(exch_schema, (error) => {
          if (error) {
            reject(error.message);
          } else {
            resolve('ok');
          }
        });
      }
    });
  });
}



// Function creates database schemas for exchanges if they do not exist.
//
// Arguments:
// - db: MongoDB database.
async function setupDB(db) {
  const coll = db.collection(crypto_market_data_coll);
  const exchanges = getSupportedExchanges();

  await Promise.all(exchanges.map(async (exch) => setupMongoDB(coll, exch)));
}

export { setupDB, updateExchangeDataOnDB };

