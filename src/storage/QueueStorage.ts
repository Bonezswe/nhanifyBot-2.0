export interface QueueStorage {
    addToQueue(streamerId: string, song: Song): Promise<void>;
    removeFromQueue(streamerId: string, songId: string): Promise<void>;
    getQueue(streamerId: string): Promise<Song[]>;
    getNext(streamerId: string): Promise<Song | null>;
}