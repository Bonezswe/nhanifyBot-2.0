import { AuthService } from "../services/AuthService.js";

async function authenticate(req: any, res: any, next: Function) {
    const authHeader = req.headers?.authorization;

    if (!isValidAuthHeader(authHeader)) {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
    }

    const token = authHeader?.split(" ")[1];
    const user = await AuthService.verify(token);

    if (!user) {
        res.writeHead(403, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid Credentials" }));
        return;
    }

    req.user = user;
    next();
}

function isValidAuthHeader(authHeader?: string) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return false;
    }

    return true;
}