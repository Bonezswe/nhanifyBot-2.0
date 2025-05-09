class AppController {
    constructor(queueService, twitchEventService) {
        this.router = express.Router();
        this.queueService = queueService;
        this.twitchEventService = twitchEventService;

        this.router.post("/toggle/:streamerId", (req, res) => this.toggleRequests(req, res));
    }

    async toggleRequests(req, res) {
        const { streamerId } = req.params;
        const { enabled } = req.body;

        if (enabled) {
            await this.twitchEventService.onStreamStart(streamerId);
        } else {
            await this.twitchEventService.onStreamEnd(streamerId);
        }

        res.json({ success: true });
    }
}