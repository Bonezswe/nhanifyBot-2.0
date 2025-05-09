export class AuthService {
    private static TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
    private static TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
    private static TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
    private static TWITCH_VALIDATE_URL = "https://id.twitch.tv/oauth2/validate";

    static async verify(token: string) {
        const cachedUser = await redis.get("");

        if (cachedUser) {
            return JSON.parse(cachedUser);
        }

        try {
            const response = await fetch(this.TWITCH_VALIDATE_URL, {
                headers: {
                    "Authorization": `OAuth ${token}`,
                }
            });

            if (response.status == 200) {
                const data = await response.json();
                await redis.setEx(``, 3600, JSON.stringify(data));
                return data;
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    static async refresh(refreshToken: string) {
        const payload = {
            "grant_type": "refresh_token",
            "refresh_token": refreshToken,
            "client_id": this.TWITCH_CLIENT_ID!,
            "client_secret": this.TWITCH_CLIENT_SECRET!,
        }

        try {
            const response = await fetch(this.TWITCH_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(payload).toString()
            });

            const data = await response.json();
            if (response.status === 200) {
                console.log(`${response.status}: Refresh token.`);
                return { data };
            }

            return { data };
        } catch (e) {
            return { data: { message: "Something went wrong when refreshing token" } };
        }
    }

    static async getAppAccessToken() {
        const response = await fetch(`${this.TWITCH_TOKEN_URL}?client_id=${this.TWITCH_CLIENT_ID}&client_secret=${this.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
            method: "POST",
        });

        const data = await response.json();

        if (data.access_token) {
            return data.access_token;
        }

        throw new Error("failed to obtain token");
    }
}
