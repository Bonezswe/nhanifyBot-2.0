import { QueueStorage } from "./QueueStorage.js";

export class MemoryStorageQueue implements QueueStorage {
    private queues: Map<string, Song[]>;

    constructor() {
        this.queues = new Map();
    }

    async addToQueue(streamerId: string, song: Song): Promise<void> {
        if (!this.queues.has(streamerId)) {
            this.queues.set(streamerId, []);
        }
        this.queues.get(streamerId)!.push(song);
    }

    async removeFromQueue(streamerId: string, songId: string): Promise<void> {
        if (this.queues.has(streamerId)) {
            this.queues.set(
                streamerId,
                this.queues.get(streamerId)!.filter(song => song.id != songId),
            );
        }
    }

    async getQueue(streamerId: string): Promise<Song[]> {
        return this.queues.get(streamerId) || [];
    }

    async getNext(streamerId: string): Promise<Song | null> {
        const queue = this.queues.get(streamerId);

        if (!queue || queue.length == 0) {
            return null;
        }

        return queue.shift();
    }
}