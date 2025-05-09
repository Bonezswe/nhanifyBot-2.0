import { ServerResponse } from "http";

export class HttpResponse {
    static json(res: ServerResponse, data: any, status: number = 200) {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(data));
    }

    static file(res: ServerResponse, file: Buffer<ArrayBufferLike>, type: string) {
        res.writeHead(200, { "content-type": type });
        res.end(file);
    }

    static badRequest(res: ServerResponse, status: number) {
        this.json(res, { message: "not found" }, status);
        // res.writeHead(400, { "content-type": "text/html" });
        // res.end("400: Bad Request");
    }

    static unauthorized(res: ServerResponse) {
        this.json(res, { message: "not found" }, 401);
        // res.writeHead(401, { "content-type": "text/html" });
        // res.end("401: Unauthorized");
    }

    static notFound(res: ServerResponse) {
        this.json(res, { message: "not found" }, 404);
        // res.writeHead(404, { "content-type": "text/html" });
        // res.end("404: file not found from HTTP RESPONSE");
    }

    static error(res: ServerResponse) {
        this.json(res, { message: "not found" });
        // res.writeHead(500, { "content-type": "text/html" });
        // res.end("500: Internal Server Error");
    }
}