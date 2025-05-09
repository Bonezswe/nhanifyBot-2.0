import type { RedisClientType } from "redis";

export class QueueService {
    private cache: RedisClientType;
    private storage: any;

    constructor(storage: any, cache: RedisClientType) {
        this.cache = cache;
        this.storage = storage;
    }

    async addToQueue(streamerId: string, youtubeUrl: string, username: string) {
        try {
            await this.cache.lPush(
                `queue:${streamerId}`,
                JSON.stringify({ youtubeUrl, username })
            );
        } catch (err) {
            console.error("failed to add to queue");
        }
    }

    async getNextSong(streamerId: string) {
        try {
            const song = await this.cache.rPop(`queue:${streamerId}`);

            if (song) {
                return JSON.parse(song);
            }

            const playlist = await this.storage.getPlaylistByStreamerID(streamerId);
            return playlist;
        } catch (err) {
            console.log("failed to get song from queue or playlist");
        }
    }

    async clearQueueCache(streamerId: string) {
        try {
            await this.cache.del(`queue:${streamerId}`);
        } catch (err) {
            console.log("failed to clear queue");
        }
    }
}