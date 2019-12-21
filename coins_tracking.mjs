/**
 * tracking.mjs
 *
 * Copyright (c) 2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   The main module to call and run exchanges' tracking.
 */

import Bitstamp from './exchanges/bitstamp/bitstamp.mjs';
import Bittrex from './exchanges/bittrex/bittrex.mjs';
import CoinbasePro from './exchanges/coinbase/coinbase_pro.mjs';
import Kraken from './exchanges/kraken/kraken.mjs';


// Function runs all exchanges API.
// Note that If I add a new exchange API I should call it here.
//
// Arguments:
// - db: MongoDB database.
function RunCoinsTracking(db) {
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

export { RunCoinsTracking };
export default RunCoinsTracking;

