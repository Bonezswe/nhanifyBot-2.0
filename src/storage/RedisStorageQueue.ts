import { createClient } from "redis";
import { QueueStorage } from "./QueueStorage.js";

export class RedisStorageQueue implements QueueStorage {
    private client;

    constructor(url: string) {
        this.client = createClient({ url });
        this.client.connect();
    }

    async addToQueue(streamerId: string, song: Song): Promise<void> {
        await this.client.rPush(`queue:${streamerId}`, JSON.stringify(song));
    }

    async removeFromQueue(streamerId: string, songId: string): Promise<void> {
        const queue = await this.getQueue(streamerId);
        const updateQueue = queue.filter(song => song.id !== songId);

        await this.client.del(`queue:${streamerId}`);

        for (const song of updateQueue) {
            await this.addToQueue(streamerId, song);
        }
    }

    async getQueue(streamerId: string): Promise<Song[]> {
        const queue = await this.client.lRange(`queue:${streamerId}`, 0, -1);
        return queue.map(d => JSON.parse(d));
    }

    async getNext(streamerId: string): Promise<Song | null> {
        const song = await this.client.lPop(`queue:${streamerId}`);
        return song ? JSON.parse(song) : null;
    }
}