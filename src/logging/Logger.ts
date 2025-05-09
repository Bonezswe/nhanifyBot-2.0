import { Console } from "console";
import { createWriteStream } from "fs";

const RESET = "\\x1b[0m";

enum LOG_LEVEL {
    FATAL, // 0
    ERROR, // 1
    WARN, // 2
    INFO, // 3
    DEBUG, // 4
    TRACE, // 5
    DEFAULT, // 6
}

const COLORS = [
    "\\x1b[31m", // Red
    "\\x1b[31m", // Red
    "\\x1b[33m", // Yellow
    "\\x1b[34m", // Blue
    "\\x1b[35m", // Magenta
    "\\x1b[36m", // Cyan
    "\\x1b[37m", // White
];


export class Logger {
    private console;

    constructor() {
        this.console = new Console({
            colorMode: true,
            stdout: createWriteStream("./nhanify.log", { encoding: "utf8", flags: "a" }),
            stderr: createWriteStream("./errors.log", { encoding: "utf8", flags: "a" }),
            // inspectOptions: {
            //     colors: true,
            // },
        });
    }

    private format(name: string, msg: string, meta?: any) {
        return `${new Date().toISOString()} [${name}]: ${msg} ${meta ? JSON.stringify(meta) : ""}${RESET}`;
    }

    log(msg: string) {
        this.console.log(this.format("LOG", msg, msg));
    }

    trace(msg: string, meta?: any) {
        this.console.trace("%s" + this.format("TRACE", msg, meta), COLORS[LOG_LEVEL.TRACE]);
    }

    debug(msg: string, meta?: any) {
        this.console.debug("%s" + this.format("DEBUG", msg, meta), COLORS[LOG_LEVEL.DEBUG]);
    }

    info(msg: string, meta?: any) {
        this.console.info("%s" + this.format("INFO", msg, meta), COLORS[LOG_LEVEL.INFO]);
    }

    warn(msg: string, meta?: any) {
        this.console.warn("%s" + this.format("WARN", msg, meta), COLORS[LOG_LEVEL.WARN]);
    }

    error(msg: string, meta?: any) {
        this.console.error("%s" + this.format("ERROR", msg, meta), COLORS[LOG_LEVEL.ERROR]);
    }

    fatal(msg: string, meta?: any) {
        this.console.error("%s" + this.format("FATAL", msg, meta), COLORS[LOG_LEVEL.FATAL]);
    }
}
