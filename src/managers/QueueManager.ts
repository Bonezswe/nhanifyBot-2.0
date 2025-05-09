import { Worker } from "worker_threads";
import EventEmitter from "events";
import { cpus } from "os";
import { QueueStorage } from "../storage/QueueStorage.js";

type Song = { id: string; title: string, url: string };
type Queue = Song[];

export class QueueManager extends EventEmitter {
    private store: QueueStorage;
    private workers: Map<string, Worker>;
    private maxWorkers: number;

    constructor(store: QueueStorage) {
        super();
        this.store = store;
        this.workers = new Map();
        this.maxWorkers = cpus().length;
    }

    async addToQueue(streamerId: string, song: Song) {
        await this.store.addToQueue(streamerId, song);

        if (!this.workers.has(streamerId)) {
            this.startWorker(streamerId);
        }
    }

    private startWorker(streamerId: string) {
        if (this.workers.has(streamerId)) return;

        const worker = new Worker("../worker/worker.js");
        this.workers.set(streamerId, worker);

        worker.on("message", (msg) => {
            if (msg.stats == "done") {
                this.processNext(streamerId);
            }
        });

        worker.on("error", err => console.error(`Worker error [${streamerId}]: `, err));

        this.processNext(streamerId);
    }

    private stopWorker(streamerId: string) {
        this.workers.get(streamerId)?.terminate();
        this.workers.delete(streamerId);

        console.log(`Worker for ${streamerId} stopped.`);
    }

    processNext(streamerId: string) {
        const nextSong = this.store.getNext(streamerId);

        if (!nextSong) {
            this.stopWorker(streamerId);
            return;
        }

        this.workers.get(streamerId)?.postMessage(nextSong);
    }
}