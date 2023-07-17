import * as websocket from 'websocket';
import * as http from 'http';

export class Client {
    public name: string;
    public room: string;
    public connection: websocket.connection | null;

    constructor(
        name: string,
        room: string,
        connection: websocket.connection | null,
    ) {
        this.name = name;
        this.room = room;
        this.connection = connection;
    }

    public toString(): string {
        // ::Client::tom::Room::room1
        return '!' + this.name + '::' + this.room;
    }

    public send(message: string): void {
        const assembledMessage = this.name + '::' + this.room + '::' + message;
        if (this.connection !== null) {
            this.connection.sendUTF(assembledMessage);
        } else {
            console.error(
                'no connection there mister ' +
                    this.name +
                    ' in this room: ' +
                    this.room,
            );
        }
    }
}

export class Server {
    private clients: Client[] = [];
    private rooms: string[] = [];

    constructor(firstRoom: string) {
        this.rooms.push(firstRoom);
    }

    public addClient(client: Client): void {
        this.clients.push(client);
        if (!this.rooms.includes(client.room)) {
            this.addRoom(client.room);
        }
    }

    public addRoom(room: string): void {
        this.rooms.push(room);
    }

    public sendToRoom(client: Client, message: string): void {
        for (let i = 0; i < this.clients.length; i++) {
            if (this.clients[i].room === client.room) {
                this.clients[i].send(message);
            }
        }
    }
}

export class Message {
    public sender: string;
    public message: string;
    public room: string;

    constructor(sender: string, message: string, room: string) {
        this.sender = sender;
        this.message = message;
        this.room = room;
    }
}

export function stringToMessage(rawMessage: string): Message {
    const splitMessage = rawMessage.split('::');

    const s = splitMessage[0];
    const r = splitMessage[1];
    const m = splitMessage[2];

    return new Message(s, m, r);
}

export function getClient(
    connectionMessage: string,
    conn: websocket.connection,
): Client {
    // Message format is: !name::room
    connectionMessage = connectionMessage.slice(1);
    const splitMessage = connectionMessage.split('::');
    return new Client(splitMessage[0], splitMessage[1], conn);
}

// parameters the first 2 are node and path
let args = process.argv.slice(2);
if (args.length !== 1) {
    console.log('Usage: node index.js <mode: s|c>');
    process.exit(1);
}
if (args[0] === '-s') {
    let wsServer: websocket.server = new websocket.server();

    // test all on room one
    const server = new Server('room1');
    wsServer.on('request', (request: websocket.request) => {
        const connection = request.accept();

        connection.on('message', (message: websocket.Message) => {
            if (message.type === 'utf8') {
                console.log('Received Message: ' + message.utf8Data);
                if (message.utf8Data.startsWith('!')) {
                    console.log('new client');
                    server.addClient(getClient(message.utf8Data, connection));
                } else {
                    console.log('sending to room');
                    const msg = stringToMessage(message.utf8Data);
                    const sender = new Client(msg.sender, msg.room, connection);
                    server.sendToRoom(sender, msg.message);
                    console.log('sent' + msg.message);
                }
            }
        });

        connection.on('error', (error: Error) => {
            console.log('Received error: ' + error.message);
        });

        connection.on('close', (code: number, desc: string) => {
            console.log('Connection closed! Code:' + code + ' - Desc:' + desc);
        });
    });

    const httpServer: http.Server = new http.Server();
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

    const user = new Client(uname as string, room as string, null);

    // const client = new WebSocket('ws://localhost:8080/');

    const client = new websocket.client();
    client.on('connectFailed', (error: Error) => {
        console.error('Connect Error: ' + error.toString());
    });

    client.on('connect', (connection: websocket.connection) => {
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
function setupClient(connection: websocket.connection) {
    connection.on('error', (error: Error) => {
        console.error('Connection Error: ' + error.toString());
    });

    connection.on('close', () => {
        console.log('Connection Closed');
    });

    connection.on('message', (message: websocket.Message) => {
        if (message.type === 'utf8') {
            // server has to render the message
            console.log(message.utf8Data);
        }
    });
}
