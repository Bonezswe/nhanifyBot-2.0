import { createClient } from "redis";
import { PubSub } from "../managers/WebSocketManager.js";

export class RedisPubSub implements PubSub {
    private pub;
    private sub;

    constructor(url: string) {
        this.pub = createClient({ url });
        this.sub = createClient({ url });

        this.pub.connect();
        this.sub.connect();
    }

    publish(streamerId: string, msg: any): void {
        this.pub.publish(`queue:${streamerId}`, JSON.stringify(msg));
    }

    subscribe(cb: (bcMsg: { streamerId: string; data: any; }) => void): void {
        this.sub.on("message", (channel, message) => {
            const streamerId = channel.split(":")[1];
            cb({
                streamerId,
                data: JSON.parse(message)
            });
        });
    }
}