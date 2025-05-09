import { Worker } from "worker_threads";

export class WorkerService {
    private workers;

    constructor() {
        this.workers = new Map<string, Worker>();
    }

    startWorker(streamerId: string) {
        if (!this.workers.has(streamerId)) return;

        const worker = new Worker("./worker/worker.js");
        this.workers.set(streamerId, worker);

        worker.on("message", (msg) => {
            if (msg.status == "done") {
                this.workers.delete(streamerId);
            }
        });

        worker.postMessage({ streamerId });
    }
}