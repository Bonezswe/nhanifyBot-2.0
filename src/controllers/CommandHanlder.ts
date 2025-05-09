import type { WebSocket } from "ws";
import { parse, type IrcMessage } from "../lib/twitch/irc/irc.js";
import { QueueService } from "../services/QueueService.js";
import { TwitchBotService } from "../services/TwitchService.js";
import { WorkerService } from "../services/WorkerService.js";
import { YoutubeService } from "../services/YoutubeService.js";
import { QueueManager } from "../managers/QueueManager.js";
import { WebSocketManager } from "../managers/WebSocketManager.js";

export class CommandsHandler {
    private twitchService: TwitchBotService;
    private youtubeService: YoutubeService;
    private wsManager: WebSocketManager;
    private queue: QueueManager;
    private worker: WorkerService;

    constructor(
        twitch: TwitchBotService,
        yt: YoutubeService,
        sm: WebSocketManager,
        queue: QueueManager,
        worker: WorkerService,
    ) {
        this.twitchService = twitch;
        this.youtubeService = yt;
        this.wsManager = sm;
        this.queue = queue;
        this.worker = worker;
    }

    private async request(channel: string, url: string, chatter?: string | null) {
        // const chatter = msg.source?.nick;
        // const { channel, botCommand, botCommandParams } = msg.command;
        // const { room_id } = msg.tags;
        // const url = msg.command.botCommandParams ? msg.command.botCommandParams : "";

        try {
            const video = await this.youtubeService.handleRequest(url);

            const restrictions: Record<string, string> = {
                "liveStream": `PRIVMSG ${channel} : @${chatter}, live streams are restricted.`,
                "age": `PRIVMSG ${channel} : @${chatter}, video is age restricted.`,
                "region": `PRIVMSG ${channel} : @${chatter}, video is restricted in the US.`,
                "notEmbeddable": `PRIVMSG ${channel} : @${chatter}, video can't be played on embedded player.`,
                "duration": `PRIVMSG ${channel} : @${chatter}, video duration can't be over 10 minutes.`,
                "undefined": `PRIVMSG ${channel} : @${chatter}, video does not exist. `
            }

            await this.wsManager.notify(
                channel,
                restrictions[video?.restriction ?? "undefined"]
            );

            let message;

            // if (video?.restriction) {

            // }

            await this.queue.addToQueue(channel, {
                id: video.id,
                title: video.title,
                url: url,
            });

            await this.wsManager.notify(channel, ``);
            await this.twitchService.sendMessage(channel, `PRIVMSG ${channel} : @${chatter}, ${video?.title} added to chat queue.`);

            // switch (result.restriction) {
            //     case "liveStream":
            //         client.send(`PRIVMSG ${channel} : @${chatter}, live streams are restricted.`);
            //         break;
            //     case "age":
            //         client.send(`PRIVMSG ${channel} : @${chatter}, video is age restricted.`);
            //         break;
            //     case "region":
            //         client.send(`PRIVMSG ${channel} : @${chatter}, video is restricted in the US.`);
            //         break;
            //     case "notEmbeddable":
            //         client.send(`PRIVMSG ${channel} : @${chatter}, video can't be played on embedded player.`);
            //         break;
            //     case "duration":
            //         client.send(`PRIVMSG ${channel} : @${chatter}, video duration can't be over 10 minutes.`);
            //         break;
            //     default:
            //         client.send(`PRIVMSG ${channel} : @${chatter}, video does not exist. `);
            // }

            // chatQueue.add(result);
            // broadcastQueueUpdate(webSocketServerClients, chatQueue);
            // this.wsManager.sendMessage("Notifications", `${channel} : @${chatter}, ${video.title} added to queue.`);
            // return client.send(`PRIVMSG ${channel} : @${chatter}, ${chatQueue.getLast()?.title} added to chat queue.`); 
        } catch (error) {

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
            return this.wsManager.notify("PONG :tmi.twitch.tv");
        }

        if (msg.includes(":tmi.twitch.tv NOTICE * :Login authentication failed")) {
            // updateAuth('bot', auth.BOT_REFRESH_TWITCH_TOKEN);
        }

        if (msg.includes(":tmi.twitch.tv NOTICE * :Login unsuccessful")) {
            console.log({ msg });
        }

        const parsedMessage = parse(msg);
        console.log(`Chat message from IRC server: ${parsedMessage?.params}`);
        // commandsHandler(parsedMessage, client, chatQueue, webSocketServerClients, nhanifyQueue);
        this.handleCommand(parsedMessage);
    }

    private handleCommand(parsedMessage: IrcMessage) {
        if (parsedMessage?.command !== "botCommand") return;

        const { channel, command } = parsedMessage;
        const url = parsedMessage.params.join(":") ?? "";

        const commandHandlers: Record<string, (...args: any) => Promise<void>> = {
            "bot2sr": async () => await this.request(channel, url, chatter),
            // "bot2resume": async () => ,
            // "bot2pause": async () => ,
            "bot2skipSong": async () => this.queue.processNext(channel),
            // "bot2skipPlaylist": async () => this.queue.clearQueueCache();
        }
    }
}