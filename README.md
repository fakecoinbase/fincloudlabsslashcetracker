# Cryptocurrency Exchanges Tracker - CETracker

**CETracker** is a `Javascript` (`Node.js`) library to track cryptocurency exchanges and store tracked data on the
MongoDB database. Note that, for now, it is designed to track public data.
Currently, supported exchanges are:
- `Coinbase Pro`
- `Kraken`
- `Bittrex`
- `Bitstamp`

## How to Build and Run?
Before installing the project make sure you already installed minimum requirements: `Node.js (>= 12.0.0)` and
`MongoDB`.  Now, download the source code and install Javascript requirements.

```
git clone https://github.com/baloian/cetracker.git
cd cetracker
npm install
```

If installation went well, you can run the project in development mode and in production mode (recommended to use
[PM2](https://pm2.keymetrics.io/)).

##### Development Mode

```
npm run dev
```

##### Production Mode

```
pm2 start npm --name "cetracker" -- run start
```

##### Command Line Arguments
*CETracker* has following command line arguments (optional):

`-db_url:` MongoDB database URL. By default it is set to `mongodb://127.0.0.1:27017`.\
`-db_name:` MongoDB database name. By default it is set to `cetracker_db`.\
`-host:` Override MongoDB hostname for TLS certificate validation. By default it is not set.

For example,

```
node --experimental-modules run_tracker.mjs --db_name my_db
```


## How to Add a New Exchange API?
1. Create a directory in `exchanges` directory and give a name `<exchange_name>`.
2. Create a `supported_coins.mjs` file inside of newly created directory, named by the exchange name, and provide
supported coins in following format:

```
const <exchange name>_currencies = {
  <coin's ticker>: <full name of the coin>,
  ...
};

export { <exchange name>_currencies };
export default <exchange name>_currencies;
```

3. Implement your functionality (coins' tracking via Websocket and/or REST API) inside of the created directory.
4. For every tracked coin(s) you should provide following format after receiving and verifying data.

```
const currency_data = {
  'ticker': <coin's ticker in string format>,
  'market': <coin's market in string format>,
  'price': <coin's price in number format>,
  'open_price': <coin's open price in number format>,
  'volume24h': <coin's 24 hours volume in number format>,
  'last_update': <UTC ISO Format timestamp in string format>
};
```

5. After constructing `4.` format, you should call `UpdateExchangeDataOnDB(db, exchange_name, [currency_data]);`
function for storing the data on the MongoDB database. You may have an array of coins' data as the third argument of
the function must be an array.

6. Open `utils/supported_coins.mjs` file and follow `INSTRUCTION 1.` and `INSTRUCTION 2.`

7. Now, open `coins_tracking.mjs` file in the root directory and call your new exchange's tracking functionality
inside of `RunCoinsTracking` function, and you are all set.


## Contributions
Contributions can be made by submitting GitHub pull requests to this repository. In general, the `CETracker` source code follows [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) and rules specified in `.eslintrc.json` file.
