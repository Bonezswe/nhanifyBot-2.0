export type YTVideo = {
    title: string;
    id: string;
    restriction?: string;
};

type QueueType<Type extends string> = {
    type: Type;
    title?: string;
    creator?: string;
    length?: number;
    videos: YTVideo[]
}

export type ChatQueue = QueueType<'chat'>;
export type NhanifyQueue = QueueType<'nhanify'>;

export class VideoError extends Error { };

const restrictionMessages: Record<string, string> = {
    "liveStream": "live streams are restricted.",
    "age": "video is age restricted.",
    "region": "video is restricted in the US.",
    "notEmbeddable": "video can't be played on an embedded player.",
    "duration": "video duration can't be over 10 minutes.",
};

export class YoutubeService {
    private key?: string;

    constructor(key: string | undefined) {
        this.key = key;

        if (this.key == undefined) {
            throw new Error("A youtube API key must be provided");
        }
    }

    public async handleRequest(url: string) {
        if (!url || !this.isValidUrl(url)) {
            throw new Error("no or invalid url");
        }

        const vidId = this.parseUrl(url);

        try {
            const result = await this.getVideoById(vidId, this.key!);

            if (!result) {
                throw new Error("video not found");
            } else {
                const restrictionMessage = result.restriction
                    ? restrictionMessages[result.restriction]
                    : "video does not exist.";
                result.restriction = restrictionMessage;
            }

            return result;
        } catch (err) {
            throw err;
        }
    }

    private isValidUrl(url: string): boolean {
        const {
            protocol,
            hostname,
            pathname,
            searchParams,
        } = new URL(url);

        const vidId = searchParams.get("v");

        if (protocol !== "https:" && protocol !== "http:") return false;

        if (
            (hostname == "www.youtube.com" && pathname == "/watch" && vidId) ||
            (hostname == "youtu.be" && pathname) ||
            (hostname == "m.youtube.com" && pathname == "/watch" && vidId)
        ) return true;

        return false;
    }

    private parseUrl(url: string): string {
        const { hostname, pathname, searchParams } = new URL(url);

        if (hostname == "youtu.be") return pathname.substring(1);

        return searchParams.get("v")!;
    }

    private async getVideoById(id: string, YT_API_KEY: string): Promise<YTVideo | null> {
        try {
            const url = new URL("https://www.googleapis.com/youtube/v3/videos");
            url.search = new URLSearchParams({
                key: YT_API_KEY,
                id: id,
                part: ["liveStreamingDetails", "snippet", "contentDetails", "status"].join(","),
            }).toString();

            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                }
            });

            if (!response.ok) return null;

            const json = await response.json();
            const item = json.items[0];

            if (!item) return null;

            const {
                status: { embeddable },
                liveStreamingDetails,
                contentDetails
            } = item;
            const {
                regionRestriction,
                duration,
                contentRating: { ytRating: ageRestriction }
            } = contentDetails;

            const isLive =
                (liveStreamingDetails && !liveStreamingDetails.actualEndTime) ||
                (liveStreamingDetails && liveStreamingDetails?.actualEndTime > new Date());

            if (isLive)
                throw new Error("liveStream");

            if (ageRestriction && ageRestriction === "ytAgeRestricted")
                throw new Error("age");

            if (regionRestriction) {
                if (!regionRestriction.allowed?.includes('US') || regionRestriction.blocked?.includes('US'))
                    throw new Error("region");
            }

            if (embeddable === false)
                throw new Error("notEmbeddable");

            if (convertSeconds(duration) > 600)
                throw new Error("duration");

            return {
                id: item.id,
                title: item.snippet.title,
            };
        } catch (err) {
            return null;
        }
    }
}

function convertSeconds(duration: string): number {
    const durationStr = duration.split("T")[1];
    let seconds = 0;
    let numStr = "";

    durationStr.split("").forEach((char) => {
        if (!Number.isNaN(Number(char))) {
            numStr += char;
        } else {
            if (char === "H") seconds += +numStr * 3600;
            if (char === "M") seconds += +numStr * 60;
            if (char === "S") seconds += +numStr;
            numStr = "";
        }
    });
    return seconds;
}