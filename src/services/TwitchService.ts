import { WebSocket } from "ws";
import { QueueService } from "./QueueService.js";
import { WorkerService } from "./WorkerService.js";
import { QueueManager } from "../managers/QueueManager.js";

const IRC_WEBSOCKET_URL = "wss://irc-ws.chat.twitch.tv:443";
const NHAN_BOT_USERNAME = "nhanifybot";

export class TwitchBotService {
    private queue: QueueManager;
    private worker: WorkerService;
    private ws: WebSocket;

    constructor(queue: QueueManager, worker: WorkerService) {
        this.queue = queue;
        this.worker = worker;
        this.ws = new WebSocket(IRC_WEBSOCKET_URL);
    }

    async connect(channel: string, oauthToken: string) {
        this.ws = new WebSocket(IRC_WEBSOCKET_URL);

        this.ws.on("open", (evt: any) => {
            this.ws.send(`Pass oauth:${oauthToken}`);
            this.ws.send(`NICK ${NHAN_BOT_USERNAME}`);
            this.ws.send(`JOIN ${channel}`);
        })

        this.ws.on("message", (data) => {
            this.handleMessage(data, channel);
        });

        this.ws.on("close", () => console.log("connection closed"));
    }

    async disconnect(streamerId: string) {
        try {
            await this.queue.clearQueueCache(streamerId);
        } catch (err) {
            console.error("failed to disconnect and clear cache");
        }
    }

    async handleMessage(evt: WebSocket.RawData, channel: string) {
        const msg = evt
            .toString('utf8')
            .normalize("NFKC")
            .replace(/\uDB40\uDC00/g, "")
            .trim();

        if (!msg.includes("PRIVMSG")) return; // Ignore non-chat messages

        if (msg.startsWith("PING :tmi.twitch.tv")) {
            return this.ws.send("PONG :tmi.twitch.tv");
        }

        if (msg.includes(":tmi.twitch.tv NOTICE * :Login authentication failed")) {
            updateAuth('bot', auth.BOT_REFRESH_TWITCH_TOKEN);
        }

        if (msg.includes(":tmi.twitch.tv NOTICE * :Login unsuccessful")) {
            console.log({ msg });
        }

        const parsedMessage = parseMessage(message);
        console.log(`Chat message from IRC server: ${parsedMessage?.parameters}`);
        commandsHandler(parsedMessage, client, chatQueue, webSocketServerClients, nhanifyQueue);

    }

    sendMessage(channel: string, msg: string) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(`PRIVMSG #${channel} : ${msg}`);
        }
    }
}