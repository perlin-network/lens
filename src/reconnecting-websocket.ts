import WS from "reconnecting-websocket";

/*  wavelet-client uses a 3rd party library for WebSockets connections
*   We need to override the w3cwebsocket property of require("websocket")

*   websocket-client.cjs.js
*   const WebSocket = require("websocket");
*   const WebSocketClient = WebSocket.w3cwebsocket;

*/
export const w3cwebsocket = WS;
