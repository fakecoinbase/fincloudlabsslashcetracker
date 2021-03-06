import WebSocket from 'ws';
import { Debug } from './utils';


// ReconnectingWebsocket is designed to establish websocket connection
// and reconnect if connection closes.
//
// Arguments:
// -url: Websocket URL.
// -request_msg: A message to be sent just after the connection.
// -callback: A function will be invoked after receiving a websocket data.
// -options: An object with following properties:
//  {
//    reconnect_interval: <reconnecting interval in ms,
//                         By default it is set to 10 seconds>
//    debug: <By default it is set to true>,
//    exchange: <listening exchange>,
//    db: MongoDB database instance.
//  }
class ReconnectingWebsocket {
  url: string;
  request_msg: string;
  callback: any;
  options: any;
  timer_id: any;
  constructor(url: string, request_msg: string, callback: any, options: any) {
    this.url = url;
    this.request_msg = request_msg;
    this.callback = callback;
    this.options = parseOptions(options);
    this.timer_id = null;
  }

  run() {
    this.connect();
  }

  connect() {
    const ws = new WebSocket(this.url);
    ws.on('open', () => {
      if (this.options.debug) {
        Debug(`${this.options.exchange} websocket is opened`);
      }

      this.clearTimer();

      if (this.request_msg) {
        try {
          ws.send(JSON.stringify(this.request_msg));
        } catch (error) {
          // TODO should I reconnect in this case?
          if (this.options.debug) Debug(error);
        }
      }
    });

    ws.on('message', (ws_data) => {
      this.callback(ws_data, this.options.db);
    });

    ws.on('close', () => {
      if (this.options.debug && !this.timer_id) {
        const msg = 'websocket was closed, it will reconnect again';
        Debug(`${this.options.exchange} ${msg}`);
      }

      this.setTimer();
    });

    ws.on('error', (error) => {
      if (this.options.debug) Debug(error);
      if (ws) ws.close();
      this.clearTimer();
      this.setTimer();
    });
  }

  setTimer() {
    if (!this.timer_id) {
      this.timer_id = setTimeout(() => { this.connect(); },
        this.options.reconnect_interval);
    }
  }

  clearTimer() {
    if (this.timer_id) {
      clearTimeout(this.timer_id);
      this.timer_id = null;
    }
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
