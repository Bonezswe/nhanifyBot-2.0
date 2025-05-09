const { parentPort } = require("worker_threads");
const QueueService = require("../services/QueueService");

// Redis client setup
const redis = require("redis");
const redisClient = redis.createClient();
const queueService = new QueueService(redisClient);

async function processQueue(streamerId) {
    while (true) {
        const song = await queueService.getNextSong(streamerId);
        if (!song) break; // No more songs, exit loop

        console.log(`🎵 Now playing: ${song.youtubeUrl} (Requested by ${song.username})`);

        // Simulate song duration (3 minutes)
        await new Promise(resolve => setTimeout(resolve, 180000));

        console.log(`✅ Finished playing: ${song.youtubeUrl}`);
    }

    // Notify parent thread that processing is complete
    parentPort.postMessage({ streamerId, status: "done" });
}

parentPort.on("message", (data) => {
    if (data.streamerId) {
        processQueue(data.streamerId);
    }
});