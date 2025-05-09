import { BaseError } from "src/utils/httpErrors.js";
import { Logger } from "./logging/Logger.js";

export class ErrorHandler {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    public async handleError(err: Error): Promise<void> {
        this.logger.error(err.message);
    }

    public isTrustedError(err: Error) {
        if (err instanceof BaseError) {
            return err.isOperational;
        }
        return false;
    }
}