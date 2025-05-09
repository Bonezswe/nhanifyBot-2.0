enum HttpStatusCode {
    OK = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    TEAPOT = 418,
    INTERNAL_SERVER = 500,
}

export class BaseError extends Error {
    public readonly name: string;
    public readonly httpCode: HttpStatusCode;
    public readonly isOperational: boolean;

    constructor(name: string, httpCode: HttpStatusCode, desc: string, isOperational: boolean) {
        super(desc);

        Object.setPrototypeOf(this, new.target.prototype);

        this.name = name;
        this.httpCode = httpCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this);
    }
}

export class ApiError extends BaseError {
    constructor(name: string, httpCode: number, desc: string, isOperational = true) {
        super(name, httpCode, desc, isOperational);
    }
}

export class HTTPNotFoundError extends ApiError {
    constructor(desc: string = "not found") {
        super("NOT_FOUND", HttpStatusCode.BAD_REQUEST, desc);
    }
}

export class HTTPUnauthorizedError extends ApiError {
    constructor(desc: string = "invalid credentials") {
        super("Unauthorized", HttpStatusCode.UNAUTHORIZED, desc);
    }
}

export class HTTPForbiddenError extends ApiError {
    constructor(desc: string = "invalid credentials") {
        super("Forbidden", HttpStatusCode.FORBIDDEN, desc);
    }
}

export class HTTPServerError extends ApiError {
    constructor(desc: string = "Internal Server Error") {
        super("INTERNAL ERROR", HttpStatusCode.INTERNAL_SERVER, desc);
    }
}