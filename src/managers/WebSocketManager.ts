import { WebSocket } from "ws";

type BroadcastMessage = {
    streamerId: string;
    data: any;
};

export interface PubSub {
    publish(streamerId: string, msg: any): void;
    subscribe(cb: (bcMsg: BroadcastMessage) => void): void;
}

export class WebSocketManager {
    private clients: Map<string, Set<WebSocket>>;
    private pubSub: PubSub;

    constructor(pubSub: PubSub) {
        this.clients = new Map();
        this.pubSub = pubSub;

        this.pubSub.subscribe((bcMsg) => this.broadcast(bcMsg));
    }

    addClient(streamerId: string, ws: WebSocket) {
        if (!this.clients.has(streamerId)) {
            this.clients.set(streamerId, new Set());
        }

        this.clients.get(streamerId)!.add(ws);
    }

    notify(streamerId: string, data: any) {
        this.pubSub.publish(streamerId, data);
    }

    private broadcast(msg: BroadcastMessage) {
        this.clients.get(msg.streamerId)?.forEach(
            c => c.send(JSON.stringify(msg.data)),
        );
    }
}