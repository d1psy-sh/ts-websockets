"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const websocket = __importStar(require("websocket"));
const http = __importStar(require("http"));
// parameters the first 2 are node and path
let args = process.argv.slice(2);
if (args.length !== 1) {
    console.log('Usage: node index.js <mode: s|c>');
    process.exit(1);
}
if (args[0] === '-s') {
    let wsServer = new websocket.server();
    wsServer.on('request', (request) => {
        const connection = request.accept();
        connection.on('message', (message) => {
            if (message.type === 'utf8') {
                console.log('Received message: ' + message.utf8Data);
                connection.sendUTF(`we heard you: ${message.utf8Data}`);
            }
        });
        connection.on('error', (error) => {
            console.log('Received error: ' + error.message);
        });
        connection.on('close', (code, desc) => {
            console.log('Connection closed! Code:' + code + ' - Desc:' + desc);
        });
    });
    const httpServer = new http.Server();
    httpServer.listen(8080, () => {
        console.log('server is running on 8080');
    });
    // mount server to a http server
    // alternative is to configure on new websocket.server()
    wsServer.mount({ httpServer });
}
if (args[0] === '-c') {
    const client = new websocket.client();
    client.on('connectFailed', (error) => {
        console.error('Connect Error: ' + error.toString());
    });
    client.on('connect', (connection) => {
        connection.sendUTF('Hello World!');
        connection.on('error', (error) => {
            console.error('Connection Error: ' + error.toString());
        });
        connection.on('close', () => {
            console.log('Connection Closed');
        });
        connection.on('message', (message) => {
            if (message.type === 'utf8') {
                console.log('Received: ' + message.utf8Data);
            }
        });
    });
    client.connect('ws://localhost:8080/');
}
