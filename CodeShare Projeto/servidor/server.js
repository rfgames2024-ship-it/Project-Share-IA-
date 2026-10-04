const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = 3000;

const SITE_FOLDER =
    path.resolve(__dirname, "..");

const DATA_FOLDER =
    path.join(
        __dirname,
        "data"
    );

const USERS_FILE =
    path.join(
        DATA_FOLDER,
        "users.json"
    );

const CHATS_FILE =
    path.join(
        DATA_FOLDER,
        "chats.json"
    );

const MEMORY_FILE =
    path.join(
        DATA_FOLDER,
        "memories.json"
    );

const SESSIONS_FILE =
    path.join(
        DATA_FOLDER,
        "sessions.json"
    );

const OLLAMA_URL =
    "http://localhost:11434/api/chat";

const MODEL_NAME =
    "llama3.2";

// Não coloque esse valor no JavaScript do navegador.
// Configure no terminal antes de iniciar o servidor.
const OWNER_ID =
    process.env.PROJECTSHARE_OWNER_ID || "";

function ensureDataFiles() {

    fs.mkdirSync(
        DATA_FOLDER,
        {
            recursive: true
        }
    );

    if (
        !fs.existsSync(
            USERS_FILE
        )
    ) {

        writeJson(
            USERS_FILE,
            {
                users: []
            }
        );
    }

    if (
        !fs.existsSync(
            CHATS_FILE
        )
    ) {

        writeJson(
            CHATS_FILE,
            {
                chats: {}
            }
        );
    }

    if (
        !fs.existsSync(
            MEMORY_FILE
        )
    ) {

        writeJson(
            MEMORY_FILE,
            {
                memories: {}
            }
        );
    }

    if (
        !fs.existsSync(
            SESSIONS_FILE
        )
    ) {

        writeJson(
            SESSIONS_FILE,
            {
                sessions: {}
            }
        );
    }

    // Compatibilidade com versões anteriores do ProjectShare+.
    try {
        const rawUsers = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
        const database = Array.isArray(rawUsers)
            ? { users: rawUsers }
            : (rawUsers && Array.isArray(rawUsers.users) ? rawUsers : { users: [] });

        let changed = Array.isArray(rawUsers);
        const usedNicks = new Set();

        database.users.forEach((user, index) => {
            if (!user || typeof user !== "object") return;

            if (!user.id) {
                user.id = `user_migrated_${index}_${crypto.randomBytes(3).toString("hex")}`;
                changed = true;
            }

            if (!user.nick) {
                const source = String(user.displayName || user.email || `User${index + 1}`);
                let nick = source.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) || `User${index + 1}`;
                if (nick.length < 3) nick = `User${index + 1}`;
                let candidate = nick;
                let counter = 2;
                while (usedNicks.has(candidate.toLowerCase())) {
                    const suffix = String(counter++);
                    candidate = `${nick.slice(0, Math.max(3, 20 - suffix.length))}${suffix}`;
                }
                user.nick = candidate;
                changed = true;
            }

            if (user.passwordHash && typeof user.passwordHash === "object" && user.passwordHash.hash && user.passwordHash.salt) {
                user.passwordHash = `${user.passwordHash.salt}:${user.passwordHash.hash}`;
                changed = true;
            }

            if (!user.displayName) {
                user.displayName = user.nick;
                changed = true;
            }

            usedNicks.add(String(user.nick).toLowerCase());
        });

        if (changed) writeJson(USERS_FILE, database);
    } catch (error) {
        console.error("USER MIGRATION ERROR:", error);
    }
}

function writeJson(
    file,
    data
) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}

function readJson(
    file,
    fallback
) {

    try {

        const content =
            fs.readFileSync(
                file,
                "utf8"
            );

        return JSON.parse(
            content
        );

    } catch {
        return fallback;
    }
}

function hashPassword(
    password,
    salt =
        crypto
            .randomBytes(16)
            .toString("hex")
) {

    const derivedKey =
        crypto.scryptSync(
            String(password),
            salt,
            64
        );

    return (
        `${salt}:${derivedKey.toString(
            "hex"
        )}`
    );
}

function verifyPassword(
    password,
    storedHash
) {

    try {

        if (
            !storedHash ||
            !storedHash.includes(":")
        ) {
            return false;
        }

        const [
            salt,
            hash
        ] =
            storedHash.split(":");

        const derivedKey =
            crypto.scryptSync(
                String(password),
                salt,
                64
            );

        const storedBuffer =
            Buffer.from(
                hash,
                "hex"
            );

        if (
            storedBuffer.length !==
            derivedKey.length
        ) {
            return false;
        }

        return crypto.timingSafeEqual(
            storedBuffer,
            derivedKey
        );

    } catch {
        return false;
    }
}

function sendJson(
    res,
    statusCode,
    data
) {

    res.writeHead(
        statusCode,
        {
            "Content-Type":
                "application/json; charset=utf-8",

            "Cache-Control":
                "no-store"
        }
    );

    res.end(
        JSON.stringify(data)
    );
}

function sendText(
    res,
    statusCode,
    text,
    contentType =
        "text/plain; charset=utf-8"
) {

    res.writeHead(
        statusCode,
        {
            "Content-Type":
                contentType
        }
    );

    res.end(text);
}

function setCors(res) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );
}

function getPathname(req) {

    try {

        return decodeURIComponent(
            new URL(
                req.url,
                "http://localhost"
            ).pathname
        );

    } catch {
        return "/";
    }
}

function readRequestBody(req) {

    return new Promise(
        (resolve, reject) => {

            let body = "";

            req.on(
                "data",
                chunk => {

                    body += chunk;

                    if (
                        body.length >
                        5_000_000
                    ) {

                        reject(
                            new Error(
                                "Request body is too large."
                            )
                        );

                        req.destroy();
                    }
                }
            );

            req.on(
                "end",
                () => {

                    try {

                        resolve(
                            body
                                ? JSON.parse(body)
                                : {}
                        );

                    } catch {
                        reject(
                            new Error(
                                "Invalid JSON body."
                            )
                        );
                    }
                }
            );

            req.on(
                "error",
                reject
            );
        }
    );
}

function cleanText(
    value,
    maxLength = 20000
) {

    return String(
        value ?? ""
    ).slice(
        0,
        maxLength
    );
}

function cleanMessages(
    messages
) {

    if (
        !Array.isArray(messages)
    ) {
        return [];
    }

    return messages
        .slice(-60)
        .filter(
            item =>
                item &&
                (
                    item.role === "user" ||
                    item.role === "assistant"
                ) &&
                typeof item.content ===
                    "string"
        )
        .map(
            item => ({
                role:
                    item.role,

                content:
                    cleanText(
                        item.content
                    )
            })
        );
}

function parseJsonLoose(text) {

    const raw =
        String(text || "")
            .trim();

    try {
        return JSON.parse(raw);
    } catch {
        // continua
    }

    const withoutFence =
        raw
            .replace(
                /^```json\s*/i,
                ""
            )
            .replace(
                /^```\s*/i,
                ""
            )
            .replace(
                /\s*```$/i,
                ""
            )
            .trim();

    try {
        return JSON.parse(
            withoutFence
        );
    } catch {
        return null;
    }
}

function languageName(
    locale
) {

    const value =
        String(
            locale || ""
        ).toLowerCase();

    if (
        value.startsWith("pt")
    ) {
        return "Português Brasileiro";
    }

    if (
        value.startsWith("en")
    ) {
        return "English";
    }

    if (
        value.startsWith("es")
    ) {
        return "Español";
    }

    if (
        value.startsWith("fr")
    ) {
        return "Français";
    }

    if (
        value.startsWith("de")
    ) {
        return "Deutsch";
    }

    if (
        value.startsWith("it")
    ) {
        return "Italiano";
    }

    if (
        value.startsWith("zh")
    ) {
        return "Mandarim / Chinês";
    }

    if (
        value.startsWith("ja")
    ) {
        return "Japonês";
    }

    if (
        value.startsWith("ko")
    ) {
        return "Coreano";
    }

    if (
        value.startsWith("ru")
    ) {
        return "Russo";
    }

    return (
        locale ||
        "English"
    );
}

async function callOllama(
    messages,
    options = {}
) {

    const response =
        await fetch(
            OLLAMA_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    model:
                        MODEL_NAME,

                    messages,

                    stream:
                        false,

                    keep_alive:
                        "10m",

                    options: {
                        temperature:
                            options.temperature ??
                            0.7
                    }
                })
            }
        );

    if (
        !response.ok
    ) {

        const text =
            await response.text();

        throw new Error(
            `Ollama error ${response.status}: ${text}`
        );
    }

    const result =
        await response.json();

    if (
        !result.message ||
        typeof
            result.message.content !==
            "string"
    ) {

        throw new Error(
            "Ollama returned an invalid response."
        );
    }

    return result.message.content.trim();
}

async function streamOllama(res, messages, options = {}) {
    const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: MODEL_NAME,
            messages,
            stream: true,
            keep_alive: "10m",
            options: {
                temperature: options.temperature ?? 0.72,
                num_predict: options.num_predict ?? 900
            }
        })
    });

    if (!response.ok || !response.body) {
        const text = await response.text();
        throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const sendEvent = (payload) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const clean = line.trim();
                if (!clean) continue;

                try {
                    const chunk = JSON.parse(clean);
                    const content =
                        typeof chunk?.message?.content === "string"
                            ? chunk.message.content
                            : "";

                    if (content) {
                        sendEvent({ content, done: false });
                    }

                    if (chunk.done) {
                        sendEvent({ done: true });
                    }
                } catch (error) {
                    console.warn("Chunk inválido do Ollama:", error.message);
                }
            }
        }

        buffer += decoder.decode();
        const finalLine = buffer.trim();
        if (finalLine) {
            try {
                const chunk = JSON.parse(finalLine);
                const content =
                    typeof chunk?.message?.content === "string"
                        ? chunk.message.content
                        : "";
                if (content) sendEvent({ content, done: false });
                if (chunk.done) sendEvent({ done: true });
            } catch {}
        }
    } finally {
        reader.releaseLock();
        res.end();
    }
}

const SESSION_LENGTH = 21 * 24 * 60 * 60 * 1000;

const PROJECTSHARE_CORE_PROMPT = `
Você é o ProjectShare+, uma IA brasileira focada em projetos.
Seu diferencial é transformar ideias em planos claros, úteis e executáveis, mantendo uma conversa natural e carismática.

Focos: Criar, Jogar, Estudar, Treinar, Empresas, Rotina, Economia, Ganhar Dinheiro, Programação, Sites, Aplicativos, Conteúdo, Design, Pesquisa, Eventos e outros projetos.

Para projetos, pense quando fizer sentido em: Propósito, Escopo, Recursos, Público-alvo/Stakeholders, Fluxo de Trabalho, Organização/Documentação, Lançamento/Dia D e Pós-Projeto/Feedback.

Adapte o método ao tipo:
- Criativo/artístico: referências, experimentação e feedback.
- Negócios: público, problema, proposta, validação, custos, viabilidade e divulgação.
- Técnico/digital: arquitetura, lógica, ferramentas, desenvolvimento, testes, segurança, lançamento e manutenção.
- Estudos/treinamento: objetivo, nível, rotina, exercícios e revisão.
- Rotina: prioridades, tempo, frequência e acompanhamento.
- Economia/ganhar dinheiro: metas, recursos, custos e riscos realistas; nunca garanta dinheiro.
- Jogos: conceito, público, gameplay, sistemas, protótipo, testes, balanceamento e lançamento.

Use quando adequado o ciclo: IDEIA → OBJETIVO → ESCOPO → PLANO → MARCOS → CRIAÇÃO → TESTES → FEEDBACK → MELHORIAS → LANÇAMENTO → MANUTENÇÃO.

Responda de forma organizada. Use títulos, **negrito**, listas e tabelas Markdown quando ajudarem. Pode criar cronogramas como:
Dia 1: XXXXX
Dia 2: XXXXX
Dia 3: XXXXX
Não force um número fixo de dias.

Quando o usuário pedir ideias, gere ideias específicas e úteis, explique o motivo e pense em evolução. Quando pedir um projeto completo, transforme a ideia em uma estrutura de execução. Quando perguntar o próximo passo, considere dependências.

Seja sincero. Não invente fatos, testes, pesquisas ou ações externas. Diferencie estimativas de fatos. Não peça nem revele senhas, tokens, chaves ou credenciais. Não prometa sucesso. Use emojis com moderação.
`;

function readSessions() {
    return readJson(SESSIONS_FILE, { sessions: {} });
}

function writeSessions(data) {
    writeJson(SESSIONS_FILE, data);
}

function createSession(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    const database = readSessions();
    database.sessions[token] = {
        userId,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_LENGTH
    };
    writeSessions(database);
    return { token, expiresAt: database.sessions[token].expiresAt };
}

function getSession(token) {
    if (!token) return null;
    const database = readSessions();
    const session = database.sessions[String(token)];
    if (!session) return null;
    if (Number(session.expiresAt) <= Date.now()) {
        delete database.sessions[String(token)];
        writeSessions(database);
        return null;
    }
    return session;
}

function deleteSession(token) {
    if (!token) return;
    const database = readSessions();
    delete database.sessions[String(token)];
    writeSessions(database);
}

function getRequestSession(req) {
    return getSession(req.headers["x-projectshare-session"]);
}

function requireSession(req) {
    const session = getRequestSession(req);
    if (!session) throw new Error("SESSION_EXPIRED");
    return session;
}

async function handleLogin(data) {
    const email =
        cleanText(
            data.email,
            320
        )
            .trim()
            .toLowerCase();

    if (
        !email ||
        !email.includes("@") ||
        email.length < 5
    ) {
        return {
            status: 400,
            body: {
                ok: false,
                errorKey: "invalidLogin"
            }
        };
    }

    const database =
        readJson(
            USERS_FILE,
            { users: [] }
        );

    if (!Array.isArray(database.users)) {
        database.users = [];
    }

    // O login atual do ProjectShare+ usa somente o e-mail.
    // Se ele ainda não existir, o mesmo botão cria a conta.
    let user =
        database.users.find(
            item =>
                String(
                    item?.email || ""
                )
                    .trim()
                    .toLowerCase() ===
                email
        );

    let created = false;

    if (!user) {
        const localPart =
            email
                .split("@")[0]
                .replace(/[^a-zA-Z0-9_]/g, "")
                .slice(0, 20) ||
            "User";

        let nick = localPart;

        if (nick.length < 3) {
            nick = `User${nick}`.slice(0, 20);
        }

        const usedNicks = new Set(
            database.users.map(
                item =>
                    String(
                        item?.nick || ""
                    ).toLowerCase()
            )
        );

        const baseNick = nick;
        let counter = 2;

        while (
            usedNicks.has(
                nick.toLowerCase()
            )
        ) {
            const suffix = String(counter++);
            nick =
                `${baseNick.slice(
                    0,
                    Math.max(3, 20 - suffix.length)
                )}${suffix}`;
        }

        user = {
            id:
                `user_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
            email,
            nick,
            displayName: nick,
            createdAt: Date.now()
        };

        database.users.push(user);
        writeJson(USERS_FILE, database);
        created = true;

    } else {
        // Mantém usuários antigos compatíveis com a versão atual.
        let changed = false;

        if (!user.id) {
            user.id =
                `user_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
            changed = true;
        }

        if (!user.email) {
            user.email = email;
            changed = true;
        }

        if (!user.nick) {
            user.nick =
                email
                    .split("@")[0]
                    .replace(/[^a-zA-Z0-9_]/g, "")
                    .slice(0, 20) ||
                "User";
            changed = true;
        }

        if (!user.displayName) {
            user.displayName =
                user.nick ||
                email;
            changed = true;
        }

        if (changed) {
            writeJson(
                USERS_FILE,
                database
            );
        }
    }

    const session =
        createSession(
            user.id
        );

    return {
        status: 200,

        body: {
            ok: true,
            created,
            sessionToken:
                session.token,
            expiresAt:
                session.expiresAt,

            user: {
                id: user.id,
                email: user.email || email,
                nick:
                    user.nick ||
                    email.split("@")[0],
                displayName:
                    user.displayName ||
                    user.nick ||
                    email,
                locale:
                    data.locale ||
                    "en"
            }
        }
    };
}

async function handleSession(data) {
    const session = getSession(String(data.sessionToken || ""));
    if (!session) return { status: 401, body: { ok: false } };
    const database = readJson(USERS_FILE, { users: [] });
    const user = database.users.find(item => item.id === session.userId);
    if (!user) return { status: 401, body: { ok: false } };
    return {
        status: 200,
        body: {
            ok: true,
            user: { id: user.id, nick: user.nick, displayName: user.displayName || user.nick }
        }
    };
}

async function handleChat(
    data
) {

    const locale =
        cleanText(
            data.locale,
            40
        );

    const systemPrompt =
        cleanText(
            data.systemPrompt,
            50_000
        );

    const messages =
        cleanMessages(
            data.messages
        );

    const systemMessage = {
        role:
            "system",

        content:
            `${PROJECTSHARE_CORE_PROMPT}

${systemPrompt}

Idioma final obrigatório desta resposta:
${languageName(locale)}

Responda no idioma solicitado.
Mantenha nomes, código, URLs e identificadores técnicos quando necessário.`
    };

    const answer =
        await callOllama(
            [
                systemMessage,
                ...messages
            ],
            {
                temperature:
                    0.72
            }
        );

    return {
        model:
            MODEL_NAME,

        message: {
            role:
                "assistant",

            content:
                answer
        },

        done:
            true
    };
}

async function handleTitle(
    data
) {

    const locale =
        cleanText(
            data.locale,
            40
        );

    const firstMessage =
        cleanText(
            data.message,
            10_000
        );

    const prompt = `
Você é o gerador de títulos do ProjectShare+.

Analise a primeira mensagem do usuário.

Identifique o foco principal do chat.

Crie um título curto, natural e específico.

Regras:
- entre 2 e 6 palavras
- fácil de entender
- não use aspas
- não escreva explicações
- não use "Chat" como palavra obrigatória
- use o idioma indicado

Responda SOMENTE com JSON válido:

{"title":"..."}

Idioma:
${languageName(locale)}

Primeira mensagem:
${firstMessage}
`;

    const answer =
        await callOllama(
            [
                {
                    role:
                        "system",

                    content:
                        prompt
                }
            ],
            {
                temperature:
                    0.35
            }
        );

    const parsed =
        parseJsonLoose(
            answer
        );

    let title = "";

    if (
        parsed &&
        typeof parsed.title ===
            "string"
    ) {

        title =
            parsed.title.trim();
    }

    if (!title) {

        title =
            firstMessage
                .replace(
                    /\s+/g,
                    " "
                )
                .trim()
                .split(" ")
                .slice(0, 6)
                .join(" ");
    }

    return {
        title:
            title.slice(
                0,
                80
            )
    };
}

async function handleTranslate(
    data
) {

    const locale =
        cleanText(
            data.locale,
            40
        );

    const items =
        data.items &&
        typeof data.items ===
            "object" &&
        !Array.isArray(
            data.items
        )
            ? data.items
            : {};

    const cleanItems = {};

    Object.entries(items)
        .slice(0, 100)
        .forEach(
            ([key, value]) => {

                cleanItems[key] =
                    cleanText(
                        value,
                        500
                    );
            }
        );

    const prompt = `
Você é o tradutor da interface do ProjectShare+.

Traduza SOMENTE os valores do objeto JSON para o idioma correspondente ao locale:

${locale}

Regras:
- mantenha exatamente as mesmas chaves
- não adicione chaves
- não remova chaves
- não traduza ProjectShare+ quando for o nome da marca
- não explique nada
- responda somente com JSON válido

Objeto:

${JSON.stringify(
    cleanItems,
    null,
    2
)}
`;

    const answer =
        await callOllama(
            [
                {
                    role:
                        "system",

                    content:
                        prompt
                }
            ],
            {
                temperature:
                    0.1
            }
        );

    const parsed =
        parseJsonLoose(
            answer
        );

    if (
        !parsed ||
        typeof parsed !==
            "object"
    ) {

        return {
            translations:
                cleanItems
        };
    }

    const translations = {};

    Object.keys(
        cleanItems
    ).forEach(
        key => {

            translations[key] =
                typeof parsed[key] ===
                    "string"
                    ? parsed[key]
                    : cleanItems[key];
        }
    );

    return {
        translations
    };
}

async function handleMemoryUpdate(
    data
) {

    const userId =
        cleanText(
            data.userId,
            120
        );

    const locale =
        cleanText(
            data.locale,
            40
        );

    const currentMemory =
        Array.isArray(
            data.currentMemory
        )
            ? data.currentMemory
                .map(
                    item =>
                        cleanText(
                            item,
                            250
                        )
                )
                .slice(
                    0,
                    30
                )
            : [];

    const messages =
        cleanMessages(
            data.messages
        )
            .filter(
                item =>
                    item.role ===
                    "user"
            )
            .slice(
                -30
            );

    if (!userId) {
        throw new Error(
            "Missing userId."
        );
    }

    const prompt = `
Você é o sistema de memória do ProjectShare+.

Crie uma memória curta e útil sobre o usuário.

Guarde SOMENTE informações duradouras e úteis, por exemplo:
- preferências de trabalho
- objetivos de projetos
- projetos em andamento
- decisões importantes
- ferramentas usadas
- estilo de resposta preferido

NUNCA guarde:
- senhas
- códigos de confirmação
- tokens
- chaves de API
- credenciais
- endereços exatos
- dados financeiros secretos
- informações médicas
- informações sensíveis desnecessárias
- informações temporárias sem valor futuro

Não invente nada.

Retorne SOMENTE um array JSON de strings.

Máximo:
30 memórias.

Memórias atuais:
${JSON.stringify(
    currentMemory
)}

Mensagens recentes:
${JSON.stringify(
    messages
)}

Idioma:
${languageName(locale)}
`;

    const answer =
        await callOllama(
            [
                {
                    role:
                        "system",

                    content:
                        prompt
                }
            ],
            {
                temperature:
                    0.2
            }
        );

    const parsed =
        parseJsonLoose(
            answer
        );

    const memory =
        Array.isArray(parsed)
            ? parsed
                .filter(
                    item =>
                        typeof item ===
                        "string"
                )
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean)
                .slice(
                    0,
                    30
                )
            : currentMemory;

    const database =
        readJson(
            MEMORY_FILE,
            {
                memories: {}
            }
        );

    database.memories[
        userId
    ] = memory;

    writeJson(
        MEMORY_FILE,
        database
    );

    return {
        memory
    };
}

function handleMemoryRead(
    userId
) {

    const database =
        readJson(
            MEMORY_FILE,
            {
                memories: {}
            }
        );

    return {
        memory:
            Array.isArray(
                database.memories[
                    userId
                ]
            )
                ? database.memories[
                    userId
                ]
                : []
    };
}

function handleHistoryRead(
    userId
) {

    const database =
        readJson(
            CHATS_FILE,
            {
                chats: {}
            }
        );

    const chats =
        Array.isArray(
            database.chats[
                userId
            ]
        )
            ? database.chats[
                userId
            ]
            : [];

    chats.sort(
        (a, b) =>
            Number(
                b.updatedAt || 0
            ) -
            Number(
                a.updatedAt || 0
            )
    );

    return {
        chats
    };
}

function sanitizeChat(
    chat
) {

    if (
        !chat ||
        typeof chat !==
            "object"
    ) {

        throw new Error(
            "Invalid chat."
        );
    }

    const id =
        cleanText(
            chat.id,
            120
        ).trim();

    if (!id) {

        throw new Error(
            "Missing chat id."
        );
    }

    const messages =
        Array.isArray(
            chat.messages
        )
            ? chat.messages
                .filter(
                    item =>
                        item &&
                        (
                            item.role ===
                                "user" ||
                            item.role ===
                                "assistant"
                        ) &&
                        typeof item.content ===
                            "string"
                )
                .map(
                    item => ({
                        role:
                            item.role,

                        content:
                            cleanText(
                                item.content
                            ),

                        createdAt:
                            Number(
                                item.createdAt
                            ) ||
                            Date.now()
                    })
                )
            : [];

    return {
        id,

        title:
            cleanText(
                chat.title,
                120
            ).trim(),

        createdAt:
            Number(
                chat.createdAt
            ) ||
            Date.now(),

        updatedAt:
            Number(
                chat.updatedAt
            ) ||
            Date.now(),

        messages
    };
}

function handleHistorySave(
    userId,
    chat
) {

    const safeUserId =
        cleanText(
            userId,
            120
        ).trim();

    if (!safeUserId) {

        throw new Error(
            "Missing userId."
        );
    }

    const safeChat =
        sanitizeChat(
            chat
        );

    const database =
        readJson(
            CHATS_FILE,
            {
                chats: {}
            }
        );

    if (
        !Array.isArray(
            database.chats[
                safeUserId
            ]
        )
    ) {

        database.chats[
            safeUserId
        ] = [];
    }

    const existingIndex =
        database.chats[
            safeUserId
        ].findIndex(
            item =>
                item.id ===
                safeChat.id
        );

    if (
        existingIndex === -1
    ) {

        database.chats[
            safeUserId
        ].push(
            safeChat
        );

    } else {

        database.chats[
            safeUserId
        ][
            existingIndex
        ] = safeChat;
    }

    database.chats[
        safeUserId
    ].sort(
        (a, b) =>
            Number(
                b.updatedAt || 0
            ) -
            Number(
                a.updatedAt || 0
            )
    );

    writeJson(
        CHATS_FILE,
        database
    );

    return {
        ok:
            true
    };
}

function handleOwnerVerify(
    data
) {

    if (!OWNER_ID) {

        return {
            status:
                503,

            body: {
                verified:
                    false,

                error:
                    "Owner verification is not configured on the server."
            }
        };
    }

    const code =
        cleanText(
            data.code,
            200
        );

    const verified =
        code === OWNER_ID;

    return {
        status:
            200,

        body: {
            verified
        }
    };
}

function getContentType(
    filePath
) {

    const extension =
        path.extname(
            filePath
        ).toLowerCase();

    const types = {
        ".html":
            "text/html; charset=utf-8",

        ".css":
            "text/css; charset=utf-8",

        ".js":
            "text/javascript; charset=utf-8",

        ".json":
            "application/json; charset=utf-8",

        ".png":
            "image/png",

        ".jpg":
            "image/jpeg",

        ".jpeg":
            "image/jpeg",

        ".webp":
            "image/webp",

        ".gif":
            "image/gif",

        ".svg":
            "image/svg+xml",

        ".ico":
            "image/x-icon"
    };

    return (
        types[
            extension
        ] ||
        "application/octet-stream"
    );
}

function serveStaticFile(
    req,
    res
) {

    const pathname =
        getPathname(
            req
        );

    if (
        pathname.startsWith(
            "/api/"
        ) ||
        pathname === "/api"
    ) {
        return;
    }

    // Impede acesso pelo navegador ao backend
    // e aos arquivos das contas.
    if (
        pathname.startsWith(
            "/servidor"
        ) ||
        pathname.startsWith(
            "/data"
        )
    ) {

        sendText(
            res,
            404,
            "Not found."
        );

        return;
    }

    const relativePath =
        pathname === "/"
            ? "index.html"
            : pathname.replace(
                /^\/+/,
                ""
            );

    const filePath =
        path.resolve(
            SITE_FOLDER,
            relativePath
        );

    const relativeCheck =
        path.relative(
            SITE_FOLDER,
            filePath
        );

    if (
        relativeCheck.startsWith(
            ".."
        ) ||
        path.isAbsolute(
            relativeCheck
        )
    ) {

        sendText(
            res,
            403,
            "Forbidden."
        );

        return;
    }

    fs.readFile(
        filePath,
        (
            error,
            content
        ) => {

            if (error) {

                sendText(
                    res,
                    404,
                    "Arquivo não encontrado."
                );

                return;
            }

            res.writeHead(
                200,
                {
                    "Content-Type":
                        getContentType(
                            filePath
                        ),

                    "Cache-Control":
                        "no-cache"
                }
            );

            res.end(
                content
            );
        }
    );
}

ensureDataFiles();

const server =
    http.createServer(
        async (
            req,
            res
        ) => {

            setCors(res);

            if (
                req.method ===
                "OPTIONS"
            ) {

                res.writeHead(
                    204
                );

                res.end();

                return;
            }

            try {

                const pathname =
                    getPathname(
                        req
                    );

                if (
                    pathname ===
                        "/api/login" &&
                    req.method ===
                        "POST"
                ) {

                    const data =
                        await readRequestBody(
                            req
                        );

                    const result =
                        await handleLogin(
                            data
                        );

                    sendJson(
                        res,
                        result.status,
                        result.body
                    );

                    return;
                }

                if (
                    pathname ===
                        "/api/session" &&
                    req.method ===
                        "GET"
                ) {
                    const token = req.headers["x-projectshare-session"];
                    const result = await handleSession({ sessionToken: token });
                    sendJson(res, result.status, result.body);
                    return;
                }

                if (
                    pathname ===
                        "/api/logout" &&
                    req.method ===
                        "POST"
                ) {
                    deleteSession(req.headers["x-projectshare-session"]);
                    sendJson(res, 200, { ok: true });
                    return;
                }

                if (
                    pathname ===
                        "/api/chat/stream" &&
                    req.method ===
                        "POST"
                ) {
                    requireSession(req);

                    const data =
                        await readRequestBody(req);

                    const locale =
                        cleanText(data.locale, 40);

                    const systemPrompt =
                        cleanText(data.systemPrompt, 50_000);

                    const messages =
                        cleanMessages(data.messages);

                    const systemMessage = {
                        role: "system",
                        content: `${PROJECTSHARE_CORE_PROMPT}\n\n${systemPrompt}\n\nIdioma final obrigatório desta resposta:\n${languageName(locale)}\n\nResponda no idioma solicitado.\nMantenha nomes, código, URLs e identificadores técnicos quando necessário.`
                    };

                    await streamOllama(
                        res,
                        [systemMessage, ...messages],
                        { temperature: 0.72, num_predict: 900 }
                    );
                    return;
                }

                if (
                    pathname ===
                        "/api/chat" &&
                    req.method ===
                        "POST"
                ) {
                    const authSession = requireSession(req);

                    const data =
                        await readRequestBody(
                            req
                        );

                    const result =
                        await handleChat(
                            data
                        );

                    sendJson(
                        res,
                        200,
                        result
                    );

                    return;
                }

                if (
                    pathname ===
                        "/api/title" &&
                    req.method ===
                        "POST"
                ) {
                    const authSession = requireSession(req);

                    const data =
                        await readRequestBody(
                            req
                        );

                    const result =
                        await handleTitle(
                            data
                        );

                    sendJson(
                        res,
                        200,
                        result
                    );

                    return;
                }

                if (
                    pathname ===
                        "/api/translate" &&
                    req.method ===
                        "POST"
                ) {

                    const data =
                        await readRequestBody(
                            req
                        );

                    const result =
                        await handleTranslate(
                            data
                        );

                    sendJson(
                        res,
                        200,
                        result
                    );

                    return;
                }

                if (
                    pathname ===
                        "/api/memory" &&
                    req.method ===
                        "GET"
                ) {
                    const authSession = requireSession(req);

                    const url =
                        new URL(
                            req.url,
                            "http://localhost"
                        );

                    const userId = authSession.userId;

                    sendJson(
                        res,
                        200,
                        handleMemoryRead(
                            userId
                        )
                    );

                    return;
                }

                if (
                    pathname ===
                        "/api/memory/update" &&
                    req.method ===
                        "POST"
                ) {
                    const authSession = requireSession(req);

                    const data =
                        await readRequestBody(
                            req
                        );

                    data.userId = authSession.userId;
                    const result =
                        await handleMemoryUpdate(
                            data
                        );

                    sendJson(
                        res,
                        200,
                        result
                    );

                    return;
                }

                if (
                    pathname ===
                        "/api/history" &&
                    req.method ===
                        "GET"
                ) {
                    const authSession = requireSession(req);

                    const url =
                        new URL(
                            req.url,
                            "http://localhost"
                        );

                    const userId = authSession.userId;

                    sendJson(
                        res,
                        200,
                        handleHistoryRead(
                            userId
                        )
                    );

                    return;
                }

                if (
                    pathname ===
                        "/api/history/save" &&
                    req.method ===
                        "POST"
                ) {
                    const authSession = requireSession(req);

                    const data =
                        await readRequestBody(
                            req
                        );

                    const result =
                        handleHistorySave(
                            authSession.userId,
                            data.chat
                        );

                    sendJson(
                        res,
                        200,
                        result
                    );

                    return;
                }

                if (
                    pathname ===
                        "/api/owner/verify" &&
                    req.method ===
                        "POST"
                ) {
                    const authSession = requireSession(req);

                    const data =
                        await readRequestBody(
                            req
                        );

                    const result =
                        handleOwnerVerify(
                            data
                        );

                    sendJson(
                        res,
                        result.status,
                        result.body
                    );

                    return;
                }

                serveStaticFile(
                    req,
                    res
                );

            } catch (error) {

                console.error("ERRO:", error);

                if (error.message === "SESSION_EXPIRED") {
                    sendJson(res, 401, { ok: false, error: "SESSION_EXPIRED" });
                    return;
                }

                sendJson(
                    res,
                    500,
                    {
                        error:
                            error.message ||
                            "Internal server error."
                    }
                );
            }
        }
    );

server.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "=============================="
        );

        console.log(
            "       PROJECTSHARE+ ONLINE"
        );

        console.log(
            "=============================="
        );

        console.log("");

        console.log(
            "Site: http://localhost:3000"
        );

        console.log(
            "IA: Ollama + Llama 3.2"
        );

        console.log(
            "Histórico: servidor + JSON"
        );

        console.log(
            "Memória: servidor + JSON"
        );

        console.log("");

        if (OWNER_ID) {

            console.log(
                "Owner verification: ON"
            );

        } else {

            console.log(
                "Owner verification: OFF"
            );

            console.log(
                "Use PROJECTSHARE_OWNER_ID to enable it."
            );
        }

        console.log("");
    }
);