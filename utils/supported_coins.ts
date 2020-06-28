// INSTRUCTION 1.
// Import a new exchange's supported coins in following format:
// <exchange_name>_currencies from '../exchanges/<exchange_name>/supported_coins.ts';
import bitstamp_currencies from '../exchanges/bitstamp/supported_coins';
import bittrex_currencies from '../exchanges/bittrex/supported_coins';
import coinbase_currencies from '../exchanges/coinbase/supported_coins';
import kraken_currencies from '../exchanges/kraken/supported_coins';

// INSTRUCTION 2.
// Add a new exchange to the dictionary in following format:
// '<exchange_name>': <exchange_name>_currencies
const exchange_currencies = {
  bitstamp: bitstamp_currencies,
  bittrex: bittrex_currencies,
  coinbase: coinbase_currencies,
  kraken: kraken_currencies
};



function getSupportedCoins(exchange) {
  return exchange_currencies[exchange];
}

function getSupportedExchanges() {
  return Object.keys(exchange_currencies);
}

export { getSupportedCoins, getSupportedExchanges };

