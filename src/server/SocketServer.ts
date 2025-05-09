import type { Server as HttpServer } from "http";
import { WebSocket, WebSocketServer, type Server } from 'ws';
import { Queue } from '../videoAPI/queue.js';
import { webServer } from './webServer.js';


// export function startWebSocketServer(chatQueue: Queue, nhanifyQueue: Queue) {
//     const wss = new WebSocketServer({ server: webServer });
//     console.log('WebSocketServer created.');
//     let ircClient: WebSocket | null;
//     wss.on('connection', function connection(ws) {
//         ws.on('error', console.error);
//         ws.on('message', function message(message) {
//             const data = JSON.parse(message.toString());
//             console.log(`message recieved from client:  ${JSON.stringify(data)}`);
//             if (ircClient) {
//                 switch (data.action) {
//                     case "finished":
//                         // if playing on is null we do not remove
//                         if (Queue.getPlayingOn() === 'nhanify') nhanifyQueue.remove();
//                         if (Queue.getPlayingOn() === 'chat') chatQueue.remove();
//                     case "ready":
//                         if (!chatQueue.isEmpty()) {
//                             Queue.setPlayingOn("chat");
//                             ws.send(JSON.stringify({ action: "play", queue: chatQueue.getQueue() }));
//                         } else if (!nhanifyQueue.isEmpty()) {
//                             Queue.setPlayingOn("nhanify");
//                             ws.send(JSON.stringify({ action: "play", queue: nhanifyQueue.getQueue() }));
//                         } else {
//                             Queue.setPlayingOn(null);
//                             ws.send(JSON.stringify({ action: "emptyQueues", queue: null }))
//                         }
//                         break;
//                     case "pause":
//                     case "resume":
//                         //in the future include chatter in properties to send over to the client from the irc to include as port of irc message
//                         ircClient.send(`PRIVMSG #${auth.TWITCH_CHANNEL} : Player ${data.action}d.`);
//                         break;
//                     case "skipSong":
//                         ircClient.send(`PRIVMSG #${auth.TWITCH_CHANNEL} : Skipped song.`);
//                         break;
//                     case "skipPlaylist":
//                         ircClient.send(`PRIVMSG #${auth.TWITCH_CHANNEL} : Skipped playlist.`);
//                 }
//             }
//         });
//     });
//     return {
//         webSocketServerClients: wss.clients,
//         setIrcClient: (client: WebSocket) => {
//             ircClient = client;
//         }
//     }
// }

export type WebSocketType = "TwitchEvents" | "TwitchBot" | "Notifications";

export class WebSocketManager {
    private sockets: Map<string, WebSocket>;

    constructor() {
        this.sockets = new Map();
    }

    connectSocket(
        type: WebSocketType,
        url: string,
        streamerId: string,
        onMessage: (data: string) => void
    ) {
        const socketKey = `${streamerId}_${type}`;
        if (this.sockets.has(socketKey)) {
            console.warn(`Websocket [${socketKey}] is already connected`);
            return;
        }

        const ws = new WebSocket(url);
        this.sockets.set(socketKey, ws);

        ws.on("open", () => console.log(`Websocket [${socketKey}] connected to ${url}`));
        ws.on("message", (data) => onMessage(data.toString()));
        ws.on("close", () => this.reconnect(type, streamerId, url, onMessage));
        ws.on("error", (err) => console.error(`Websocket [${socketKey}] error: `, err));
    }

    sendMessage(type: WebSocketType, streamerId: string, message: string) {
        const socketKey = `${streamerId}_${type}`;
        const ws = this.sockets.get(socketKey);

        if (ws && ws.readyState == WebSocket.OPEN) {
            ws.send(message);
        } else {
            console.warn(`Cannot send message, Websocket [${socketKey}] is not connected`);
        }
    }

    private reconnect(type: WebSocketType, streamerId: string, url: string, onMessage: (data: string) => void) {
        const socketKey = `${streamerId}_${type}`;
        console.warn(`Reconnecting Websocket [${socketKey}]...`);
        this.sockets.delete(socketKey);

        setTimeout(() => this.connectSocket(type, streamerId, url, onMessage), 5000);
    }

    disconnect(type: WebSocketType, streamerId: string) {
        const socketKey = `${streamerId}_${type}`;
        const ws = this.sockets.get(socketKey);

        if (ws) {
            ws.close();
            this.sockets.delete(socketKey);
            console.log(`Websocket [${socketKey}] disconnected`);
        }
    }

    disconnectAllForStreamer(streamerId: string) {
        const keysToDelete = [...this.sockets.keys()].filter(key => key.startsWith(`${streamerId}_`));

        keysToDelete.forEach(k => {
            this.sockets.get(k)?.close();
            this.sockets.delete(k);
        });
        console.log(`All Websockets for streamer [${streamerId}] disconnected`);
    }

    // private wss: Server;
    // private conns;
    // public service;

    // constructor(server: HttpServer, service: any) {
    //     this.wss = new WebSocketServer({ server });
    //     this.conns = new Map<string, WebSocket>();
    //     this.service = service;

    //     this.init();
    // }

    // private init() {
    //     this.wss.on("connection", this.handleConnection);
    // }

    // private handleConnection(ws: WebSocket, req: Request) {
    //     const streamerId = req.url.split("?streamerId=")[1];

    //     if (!this.conns.has(streamerId)) {
    //         this.conns.set(streamerId, ws);
    //     }

    //     ws.on("message", (msg: WebSocket.RawData) => this.handleMessages(ws, msg));

    //     ws.on("close", () => this.closeConn(streamerId));
    // }

    // private closeConn(streamerId: string) {
    //     this.conns.delete(streamerId);
    // }


    // private handleMessages(ws: WebSocket, msg: WebSocket.RawData) {
    //     const data = JSON.parse(msg.toString());
    //     if (ws) {
    //         switch (data.action) {
    //             case "finished":
    //                 // if playing on is null we do not remove
    //                 if (Queue.getPlayingOn() === 'nhanify') nhanifyQueue.remove();
    //                 if (Queue.getPlayingOn() === 'chat') chatQueue.remove();
    //             case "ready":
    //                 if (!chatQueue.isEmpty()) {
    //                     Queue.setPlayingOn("chat");
    //                     ws.send(JSON.stringify({ action: "play", queue: chatQueue.getQueue() }));
    //                 } else if (!nhanifyQueue.isEmpty()) {
    //                     Queue.setPlayingOn("nhanify");
    //                     ws.send(JSON.stringify({ action: "play", queue: nhanifyQueue.getQueue() }));
    //                 } else {
    //                     Queue.setPlayingOn(null);
    //                     ws.send(JSON.stringify({ action: "emptyQueues", queue: null }))
    //                 }
    //                 break;
    //             case "pause":
    //             case "resume":
    //                 //in the future include chatter in properties to send over to the client from the irc to include as port of irc message
    //                 ws.send(`PRIVMSG #${auth.TWITCH_CHANNEL} : Player ${data.action}d.`);
    //                 break;
    //             case "skipSong":
    //                 ws.send(`PRIVMSG #${auth.TWITCH_CHANNEL} : Skipped song.`);
    //                 break;
    //             case "skipPlaylist":
    //                 ws.send(`PRIVMSG #${auth.TWITCH_CHANNEL} : Skipped playlist.`);
    //         }
    //     }
    // }

    // public broadcastToStreamer(streamerId: string, data: any) {
    //     if (this.conns.has(streamerId)) {
    //         const conn = this.conns.get(streamerId);
    //         conn?.send(JSON.stringify(data));
    //     }
    // }

    // TODO: Add this after setting up Redis
    // async addToQueue(streamerId: string, youtubeUrl: string, username: string) {
    //     await redis.lpush(`queue:${streamerId}`, JSON.stringify({ youtubeUrl, username }));

    //     // Notify Twitch extension panel
    //     this.broadcastToStreamer(streamerId, { action: "new_song", song: youtubeUrl });
    // }
}