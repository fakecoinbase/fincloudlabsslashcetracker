/**
 * run_tracker.ts
 *
 * Copyright (c) 2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   The main module to run CETracker.
 */

import stdio from 'stdio';
import getMongoDB from './db/mongodb_connect';
import { setupDB } from './db/update_db';
import { Debug } from './utils/utils';
import { default_db_url, default_db_name } from './utils/constants';

import Bitstamp from './exchanges/bitstamp/bitstamp';
import Bittrex from './exchanges/bittrex/bittrex';
import CoinbasePro from './exchanges/coinbase/coinbase_pro';
import Kraken from './exchanges/kraken/kraken';


const argv: any = stdio.getopt({
  db_url: {
    key: 'url',
    args: 1,
    description: 'MongoDB database URL',
    default: process.env['MONGODB_URL'] || default_db_url
  },
  db_name: {
    key: 'db_name',
    args: 1,
    description: 'MongoDB database name',
    default: default_db_name
  },
  host: {
    key: 'host',
    args: 1,
    description: 'Override MongoDB hostname for TLS certificate validation',
    default: ''
  }
});



// Function runs all exchanges API.
// Note that If I add a new exchange API I should call it here.
//
// Arguments:
// - db: MongoDB database.
function runCoinsTracking(db) {
  // Bellow objects are going to run/listen always in background and store
  // tracked data on the MongoDB database.

  const bitstamp = new Bitstamp(db);
  bitstamp.run();

  const bittrex = new Bittrex(db);
  bittrex.run();

  const coinbase_pro = new CoinbasePro(db);
  coinbase_pro.run();

  const kraken = new Kraken(db);
  kraken.run();
}



// Command Line Arguments:
// -url: MongoDB database URL.
// -db_name: MongoDB database name.
// -host: Override MongoDB hostname for TLS certificate validation.
//
// For example,
// node dist/run_tracker.ts --db_name my_mongo_db
async function main() {
  try {
    const db = await getMongoDB(argv.db_url, argv.db_name);
    await setupDB(db);
    runCoinsTracking(db);
  } catch (error) {
    Debug(error);
  }
}


(async () => {
  main();
})();
