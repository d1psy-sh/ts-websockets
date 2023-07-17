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
exports.getClient = exports.stringToMessage = exports.Message = exports.Server = exports.Client = void 0;
const websocket = __importStar(require("websocket"));
const http = __importStar(require("http"));
class Client {
    name;
    room;
    connection;
    constructor(name, room, connection) {
        this.name = name;
        this.room = room;
        this.connection = connection;
    }
    toString() {
        // ::Client::tom::Room::room1
        return '!' + this.name + '::' + this.room;
    }
    send(message) {
        const assembledMessage = this.name + '::' + this.room + '::' + message;
        if (this.connection !== null) {
            this.connection.sendUTF(assembledMessage);
        }
        else {
            console.error('no connection there mister ' +
                this.name +
                ' in this room: ' +
                this.room);
        }
    }
}
exports.Client = Client;
class Server {
    clients = [];
    rooms = [];
    constructor(firstRoom) {
        this.rooms.push(firstRoom);
    }
    addClient(client) {
        this.clients.push(client);
        if (!this.rooms.includes(client.room)) {
            this.addRoom(client.room);
        }
    }
    addRoom(room) {
        this.rooms.push(room);
    }
    sendToRoom(client, message) {
        for (let i = 0; i < this.clients.length; i++) {
            if (this.clients[i].room === client.room) {
                this.clients[i].send(message);
            }
        }
    }
}
exports.Server = Server;
class Message {
    sender;
    message;
    room;
    constructor(sender, message, room) {
        this.sender = sender;
        this.message = message;
        this.room = room;
    }
}
exports.Message = Message;
function stringToMessage(rawMessage) {
    const splitMessage = rawMessage.split('::');
    const s = splitMessage[0];
    const r = splitMessage[1];
    const m = splitMessage[2];
    return new Message(s, m, r);
}
exports.stringToMessage = stringToMessage;
function getClient(connectionMessage, conn) {
    // Message format is: !name::room
    connectionMessage = connectionMessage.slice(1);
    const splitMessage = connectionMessage.split('::');
    return new Client(splitMessage[0], splitMessage[1], conn);
}
exports.getClient = getClient;
// parameters the first 2 are node and path
let args = process.argv.slice(2);
if (args.length !== 1) {
    console.log('Usage: node index.js <mode: s|c>');
    process.exit(1);
}
if (args[0] === '-s') {
    let wsServer = new websocket.server();
    // test all on room one
    const server = new Server('room1');
    wsServer.on('request', (request) => {
        const connection = request.accept();
        connection.on('message', (message) => {
            if (message.type === 'utf8') {
                console.log('Received Message: ' + message.utf8Data);
                if (message.utf8Data.startsWith('!')) {
                    console.log('new client');
                    server.addClient(getClient(message.utf8Data, connection));
                }
                else {
                    console.log('sending to room');
                    const msg = stringToMessage(message.utf8Data);
                    const sender = new Client(msg.sender, msg.room, connection);
                    server.sendToRoom(sender, msg.message);
                    console.log('sent' + msg.message);
                }
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
    // get user input
    // const rl = readline.createInterface({
    //     input: process.stdin,
    //     output: process.stdout,
    // });
    // const prompt = (query: string) => new Promise((resolve) => rl.question(query, resolve));
    //
    //
    // const uname = await prompt('Username: ');
    // const room = await prompt('Room: ');
    //
    // if (uname === null || room === null) {
    //     console.error('no no no');
    // }
    const uname = 'tom' + Math.floor(Math.random() * 1000);
    const room = 'room1';
    const user = new Client(uname, room, null);
    // const client = new WebSocket('ws://localhost:8080/');
    const client = new websocket.client();
    client.on('connectFailed', (error) => {
        console.error('Connect Error: ' + error.toString());
    });
    client.on('connect', (connection) => {
        user.connection = connection;
        console.log('WebSocket Client Connected');
        setupClient(connection);
        console.log('sending ' + user.toString());
        user.connection.sendUTF(user.toString());
        console.log('wait');
        new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
        console.log('sending hello world');
        user.send('Hello World!');
        user.send('I am ' + user.name);
    });
    client.connect('ws://localhost:8080/');
}
// utility functions
function setupClient(connection) {
    connection.on('error', (error) => {
        console.error('Connection Error: ' + error.toString());
    });
    connection.on('close', () => {
        console.log('Connection Closed');
    });
    connection.on('message', (message) => {
        if (message.type === 'utf8') {
            // server has to render the message
            console.log(message.utf8Data);
        }
    });
}
