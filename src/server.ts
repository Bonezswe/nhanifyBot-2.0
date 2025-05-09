import { accessSync, constants, readFile } from "fs";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { extname, join, normalize, resolve } from "path";
import { HttpResponse } from "./utils/httpResponses.js";
import { Logger } from "./logging/Logger.js";

const requiredEnvVars = [
    "TWITCH_CLIENT_ID",
    "TWITCH_CLIENT_SECRET",
    "PORT",
];

const MIME_TYPES = {
    html: "text/html",
    css: "text/css",
    js: "application/json",
}

export class Server {
    static publicDir: string = normalize(resolve("./public"));
    private server;
    private logger: Logger;

    constructor(logger: Logger) {
        // this.preCheck();

        this.server = createServer();
        this.logger = logger;

        this.init();
    }

    private preCheck() {
        try {
            const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

            if (missingVars.length > 0) {
                console.info("The following ENV variables are missing:");
                missingVars.forEach(v => console.info(`\x1b[31m- ${v}\x1b[0m`));

                throw new Error("Failed to start server due to incorrect setup");
            }
        } catch (err) {
            this.logger.error(err as any);
            process.exit(1);
        }
    }

    private init() {
        try {
            this.server.on("request", this.handleRequest);

            this.server.on("error", (e: any) => {
                if (e.code === "EADDRINUSE") {
                    console.error('Address in use, retrying...');
                    setTimeout(() => {
                        this.server.close();
                        this.run();
                    }, 1000);
                } else {
                    throw new Error(e.message);
                }
            });
        } catch (err) {
            this.logger.error(err as any);
        }
    }

    private handleRequest(req: IncomingMessage, res: ServerResponse) {
        try {
            const ext = extname(req.url!).slice(1);
            const type = ext ? MIME_TYPES[ext as keyof typeof MIME_TYPES] : MIME_TYPES.html;
            const supportedExt = Boolean(type);

            if (!supportedExt) {
                HttpResponse.notFound(res);
                return;
            }

            let fileName = req.url!;
            if (fileName === "/") {
                fileName = "index.html";
            } else if (!ext) {
                try {
                    accessSync(join(Server.publicDir, fileName + ".html"), constants.F_OK);
                    fileName += ".html";
                } catch (err) {
                    fileName = join(req.url!, "index.html");
                }
            }

            const filePath = join(Server.publicDir, fileName);
            const isPathUnderRoot = normalize(resolve(filePath)).startsWith(Server.publicDir);

            if (!isPathUnderRoot) {
                HttpResponse.notFound(res);
                return;
            }

            readFile(filePath, (err, data) => {
                if (err) {
                    HttpResponse.notFound(res);
                } else {
                    HttpResponse.file(res, data, type);
                }
            });
        } catch (err) {
            this.logger.error(err as any);
            HttpResponse.error(res);
        }
    }

    run() {
        this.server.listen(3000);

        this.logger.info("Server running on port 3000");
    }
}