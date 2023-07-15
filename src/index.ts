import * as websocket from 'websocket';
import * as http from 'http';

// parameters the first 2 are node and path
let args = process.argv.slice(2);
if (args.length !== 1) {
    console.log('Usage: node index.js <mode: s|c>');
    process.exit(1);
}
if (args[0] === '-s') {
    let wsServer: websocket.server = new websocket.server();

    wsServer.on('request', (request: websocket.request) => {
        const connection = request.accept();

        connection.on('message', (message: websocket.Message) => {
            if (message.type === 'utf8') {
                console.log('Received message: ' + message.utf8Data);
                connection.sendUTF(`we heard you: ${message.utf8Data}`);
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
    const client = new websocket.client();
    client.on('connectFailed', (error: Error) => {
        console.error('Connect Error: ' + error.toString());
    });
    client.on('connect', (connection: websocket.connection) => {
        connection.sendUTF('Hello World!');
        connection.on('error', (error: Error) => {
            console.error('Connection Error: ' + error.toString());
        });

        connection.on('close', () => {
            console.log('Connection Closed');
        });

        connection.on('message', (message: websocket.Message) => {
            if (message.type === 'utf8') {
                console.log('Received: ' + message.utf8Data);
            }
        });
    });
    client.connect('ws://localhost:8080/');
}
