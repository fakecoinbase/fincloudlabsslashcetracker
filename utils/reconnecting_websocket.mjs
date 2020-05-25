import WebSocket from 'ws';
import { Debug } from './utils.mjs';


// ReconnectingWebsocket is designed to establish websocket connection
// and reconnect if connection closes.
//
// Arguments:
// -url: Websocket URL.
// -request_msg: A message to be sent just after the connection.
// -callback: A function will be invoked after receving a websocket data.
// -options: An object with following properties:
//  {
//    reconnect_interval: <reconnecting interval in ms,
//                         By default it is set to 10 seconds>
//    debug: <By default it is set to true>,
//    exchange: <listening exchange>,
//    db: MongoDB database instance.
//  }
class ReconnectingWebsocket {
  constructor(url, request_msg, callback, options) {
    this.url = url;
    this.request_msg = request_msg;
    this.callback = callback;
    this.options = parseOptions(options);
  }

  run() {
    this.connect();
  }

  connect() {
    const ws = new WebSocket(this.url);

    ws.on('open', () => {
      if (this.request_msg) {
        try {
          ws.send(JSON.stringify(this.request_msg));
        } catch (error) {
          if (this.options.debug) Debug(error);
        }
      }
    });

    ws.on('message', (ws_data) => {
      this.callback(ws_data, this.options.db);
    });

    ws.on('close', () => {
      if (this.options.debug) {
        const msg = 'Websocket was closed, it will reconnect again';
        Debug(`${this.options.exchange} ${msg}`);
      }
      setTimeout(() => { this.connect(); }, this.options.reconnect_interval);
    });

    ws.on('error', (error) => {
      if (this.options.debug) Debug(error);
      if (ws) ws.close();
      setTimeout(() => { this.connect(); }, this.options.reconnect_interval);
    });
  }
}


function parseOptions(options) {
  const default_options = {
    reconnect_interval: 10000,
    debug: true,
    exchange: ''
  };

  if (!options) {
    return default_options;
  }

  const reconnect_interval = options.reconnect_interval ?
    options.reconnect_interval : default_options.reconnect_interval;
  const debug = options.debug === true || options.debug === false ?
    options.debug : default_options.debug;
  const exchange = options.exchange ? options.exchange : default_options.exchange;

  return {
    reconnect_interval,
    debug,
    exchange,
    db: options.db
  };
}

export default ReconnectingWebsocket;
