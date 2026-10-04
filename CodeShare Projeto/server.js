const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = 3000;
const usersFile = path.join(__dirname, "users.json");

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]");
}

function getUsers() {
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

function findUserByNick(users, nick) {

    return users.find(
        user =>
            String(user.nick).toLowerCase() ===
            String(nick).toLowerCase()
    );

}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");

    return {
        hash,
        salt
    };
}

function checkPassword(password, storedHash, salt) {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");

    return crypto.timingSafeEqual(
        Buffer.from(hash, "hex"),
        Buffer.from(storedHash, "hex")
    );
}

function sendJSON(res, status, data) {
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    });

    res.end(JSON.stringify(data));
}

function getBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error("JSON inválido"));
            }
        });

        req.on("error", reject);
    });
}

const server = http.createServer(async (req, res) => {

    // =========================
    // CRIAR CONTA
    // =========================

 if (req.method === "POST" && url.pathname === "/api/register") {

    readBody(req, async (data) => {

        try {

            const nick = String(data.nick || "").trim();
            const password = String(data.password || "");

            if (!nick || !password) {

                return sendJSON(res, 400, {
                    success: false,
                    error: "Please, Put Password And Nickname"
                });

            }

            if (!/^[a-zA-Z0-9_]+$/.test(nick)) {

                return sendJSON(res, 400, {
                    success: false,
                    error: "Please, Only use number, letters or _."
                });

            }

            if (nick.length < 3 || nick.length > 20) {

                return sendJSON(res, 400, {
                    success: false,
                    error: "The nickname must be between 3 and 20 characters."
                });

            }

            if (password.length < 4) {

                return sendJSON(res, 400, {
                    success: false,
                    error: "The password needs to be at least 4 characters long."
                });

            }

            const users = getUsers();

            const existingUser =
                findUserByNick(users, nick);

            if (existingUser) {

                return sendJSON(res, 409, {
                    success: false,
                    error: "This nickname is already being used."
                });

            }

            const passwordHash =
                await hashPassword(password);

            const user = {

                nick: nick,

                passwordHash: passwordHash,

                createdAt: Date.now()

            };

            users.push(user);

            saveUsers(users);

            const sessionToken =
                crypto.randomBytes(32).toString("hex");

            return sendJSON(res, 200, {

                success: true,

                nick: nick,

                sessionToken: sessionToken

            });

        } catch (error) {

            console.error(error);

            return sendJSON(res, 500, {

                success: false,

                error: "Internal error while creating account."

            });

        }

    });

    return;
}

    // =========================
    // LOGIN
    // =========================

   if (req.method === "POST" && url.pathname === "/api/login") {

    readBody(req, async (data) => {

        try {

            const nick = String(data.nick || "").trim();
            const password = String(data.password || "");

            const users = getUsers();

            const user =
                findUserByNick(users, nick);

            if (!user) {

                return sendJSON(res, 401, {

                    success: false,

                    error: "Wrong username or password."

                });

            }

            const valid =
                await checkPassword(
                    password,
                    user.passwordHash
                );

            if (!valid) {

                return sendJSON(res, 401, {

                    success: false,

                    error: "Wrong username or password."

                });

            }

            const sessionToken =
                crypto.randomBytes(32).toString("hex");

            return sendJSON(res, 200, {

                success: true,

                nick: user.nick,

                sessionToken: sessionToken

            });

        } catch (error) {

            console.error(error);

            return sendJSON(res, 500, {

                success: false,

                error: "Internal Error, Try Again!"

            });

        }

    });

    return;
}

    // =========================
    // ARQUIVOS DO SITE
    // =========================

    let filePath = req.url === "/" ? "/index.html" : req.url;

    filePath = path.join(__dirname, filePath);

    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        return res.end("Acesso negado");
    }

    fs.readFile(filePath, (error, content) => {

        if (error) {
            res.writeHead(404);
            return res.end("Arquivo não encontrado");
        }

        const extension = path.extname(filePath);

        const types = {
            ".html": "text/html",
            ".css": "text/css",
            ".js": "text/javascript",
            ".json": "application/json"
        };

        res.writeHead(200, {
            "Content-Type": types[extension] || "text/plain"
        });

        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`CodeShare rodando em http://localhost:${PORT}`);
});