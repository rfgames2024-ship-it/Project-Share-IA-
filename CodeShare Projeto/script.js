const emailInput = document.getElementById("email");
const loginButton = document.getElementById("enterLogin");
const wikiButton = document.getElementById("wikiButton");
const loginTitle = document.getElementById("loginTitle");
const loginDescription = document.getElementById("loginDescription");
const loginStatus = document.getElementById("loginStatus");

const UI_VERSION = "1";
const rawLocale = navigator.language || "en-US";
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

function detectLocale() {
    const locale = rawLocale.toLowerCase();

    if (
        timeZone.startsWith("America/Sao_Paulo") ||
        timeZone.startsWith("America/Fortaleza") ||
        timeZone.startsWith("America/Recife") ||
        timeZone.startsWith("America/Belem") ||
        timeZone.startsWith("America/Manaus") ||
        locale === "pt-br"
    ) {
        return "pt-BR";
    }

    if (
        timeZone === "Europe/London" ||
        locale.startsWith("en-gb")
    ) {
        return "en-GB";
    }

    if (locale.startsWith("en")) {
        return "en";
    }

    if (
        locale.startsWith("zh-cn") ||
        locale.startsWith("zh-hans") ||
        timeZone === "Asia/Shanghai"
    ) {
        return "zh-CN";
    }

    if (
        locale.startsWith("zh-tw") ||
        locale.startsWith("zh-hk") ||
        locale.startsWith("zh-hant")
    ) {
        return "zh-TW";
    }

    if (locale.startsWith("es")) {
        return "es";
    }

    if (locale.startsWith("fr")) {
        return "fr";
    }

    if (locale.startsWith("de")) {
        return "de";
    }

    if (locale.startsWith("it")) {
        return "it";
    }

    if (locale.startsWith("ja")) {
        return "ja";
    }

    if (locale.startsWith("ko")) {
        return "ko";
    }

    if (locale.startsWith("ru")) {
        return "ru";
    }

    return rawLocale;
}

const locale = detectLocale();

const BUILTIN_TRANSLATIONS = {
    "pt-BR": {
        login: "ENTRAR",
        subtitle: "Entre no ProjectShare+ para continuar.",
        emailPlaceholder: "Digite seu e-mail, por favor!",
        emptyLogin: "Digite seu e-mail.",
        invalidLogin: "E-mail inválido.",
        serverError: "Não consegui conectar ao servidor do ProjectShare+."
    },

    "en": {
        login: "LOG IN",
        subtitle: "Log in to ProjectShare+ to continue.",
        emailPlaceholder: "Type your email, please!",
        emptyLogin: "Enter your email.",
        invalidLogin: "Invalid email.",
        serverError: "I couldn't connect to the ProjectShare+ server."
    },

    "en-GB": {
        login: "LOG IN",
        subtitle: "Log in to ProjectShare+ to continue.",
        emailPlaceholder: "Type your email, please!",
        emptyLogin: "Enter your email.",
        invalidLogin: "Invalid email.",
        serverError: "I couldn't connect to the ProjectShare+ server."
    },

    "es": {
        login: "ENTRAR",
        subtitle: "Inicia sesión en ProjectShare+ para continuar.",
        emailPlaceholder: "Escribe tu correo electrónico, por favor.",
        emptyLogin: "Escribe tu correo.",
        invalidLogin: "Correo no válido.",
        serverError: "No pude conectar con el servidor de ProjectShare+."
    },

    "fr": {
        login: "SE CONNECTER",
        subtitle: "Connectez-vous à ProjectShare+ pour continuer.",
        emailPlaceholder: "Entrez votre e-mail, s'il vous plaît.",
        emptyLogin: "Entrez votre e-mail.",
        invalidLogin: "E-mail invalide.",
        serverError: "Impossible de se connecter au serveur ProjectShare+."
    },

    "de": {
        login: "ANMELDEN",
        subtitle: "Melde dich bei ProjectShare+ an, um fortzufahren.",
        emailPlaceholder: "Gib bitte deine E-Mail ein.",
        emptyLogin: "Gib deine E-Mail ein.",
        invalidLogin: "Ungültige E-Mail.",
        serverError: "Verbindung zum ProjectShare+-Server nicht möglich."
    },

    "it": {
        login: "ACCEDI",
        subtitle: "Accedi a ProjectShare+ per continuare.",
        emailPlaceholder: "Inserisci la tua e-mail, per favore.",
        emptyLogin: "Inserisci la tua e-mail.",
        invalidLogin: "E-mail non valida.",
        serverError: "Impossibile collegarsi al server ProjectShare+."
    },

    "zh-CN": {
        login: "登录",
        subtitle: "登录 ProjectShare+ 以继续。",
        emailPlaceholder: "请输入你的电子邮件。",
        emptyLogin: "请输入电子邮件。",
        invalidLogin: "电子邮件无效。",
        serverError: "无法连接到 ProjectShare+ 服务器。"
    },

    "zh-TW": {
        login: "登入",
        subtitle: "登入 ProjectShare+ 以繼續。",
        emailPlaceholder: "請輸入你的電子郵件。",
        emptyLogin: "請輸入電子郵件。",
        invalidLogin: "電子郵件無效。",
        serverError: "無法連接到 ProjectShare+ 伺服器。"
    },

    "ja": {
        login: "ログイン",
        subtitle: "ProjectShare+ にログインして続行します。",
        emailPlaceholder: "メールアドレスを入力してください。",
        emptyLogin: "メールアドレスを入力してください。",
        invalidLogin: "メールアドレスが正しくありません。",
        serverError: "ProjectShare+ サーバーに接続できませんでした。"
    },

    "ko": {
        login: "로그인",
        subtitle: "ProjectShare+에 로그인하여 계속하세요.",
        emailPlaceholder: "이메일을 입력하세요.",
        emptyLogin: "이메일을 입력하세요.",
        invalidLogin: "이메일이 올바르지 않습니다.",
        serverError: "ProjectShare+ 서버에 연결할 수 없습니다."
    },

    "ru": {
        login: "ВОЙТИ",
        subtitle: "Войдите в ProjectShare+, чтобы продолжить.",
        emailPlaceholder: "Введите свой адрес электронной почты.",
        emptyLogin: "Введите электронную почту.",
        invalidLogin: "Неверная почта.",
        serverError: "Не удалось подключиться к серверу ProjectShare+."
    }
};

const ENGLISH_BASE = {
    login: "LOG IN",
    subtitle: "Log in to ProjectShare+ to continue.",
    emailPlaceholder: "Type your email, please!",
    emptyLogin: "Enter your email.",
    invalidLogin: "Invalid email.",
    serverError: "I couldn't connect to the ProjectShare+ server."
};

let translations = BUILTIN_TRANSLATIONS[locale] || null;

function showError(message) {
    let error = document.getElementById("loginError");

    if (!error) {
        error = document.createElement("p");
        error.id = "loginError";

        if (loginButton && loginButton.parentElement) {
            loginButton.parentElement.appendChild(error);
        } else {
            document.body.appendChild(error);
        }
    }

    error.textContent = message;

    error.style.color = "#c62828";
    error.style.fontWeight = "bold";
    error.style.marginTop = "12px";
}

function clearError() {
    const error = document.getElementById("loginError");

    if (error) {
        error.textContent = "";
    }
}

async function translateWithAI(sourceObject) {
    try {
        const response = await fetch("/api/translate", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                locale,
                items: sourceObject
            })
        });

        const data = await response.json();

        if (!response.ok || !data.translations) {
            throw new Error("Translation unavailable.");
        }

        localStorage.setItem(
            `projectShareTranslations_${UI_VERSION}_${locale}`,
            JSON.stringify(data.translations)
        );

        return data.translations;

    } catch (error) {
        console.error("LOGIN TRANSLATION ERROR:", error);

        return sourceObject;
    }
}

async function loadTranslations() {
    if (translations) {
        return translations;
    }

    const cacheKey =
        `projectShareTranslations_${UI_VERSION}_${locale}`;

    try {
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            const parsed = JSON.parse(cached);

            if (parsed && typeof parsed === "object") {
                translations = parsed;
                return translations;
            }
        }

    } catch (error) {
        console.error("TRANSLATION CACHE ERROR:", error);
    }

    translations = await translateWithAI(ENGLISH_BASE);

    return translations;
}

function translateOtherLoginTexts() {
    const ignoredIds = new Set([
        "subtitulo",
        "enterLogin",
        "email",
        "loginTitle",
        "loginDescription",
        "loginStatus",
        "loginError",
        "wikiButton"
    ]);

    const elements = [
        ...document.querySelectorAll(
            "h1, h2, h3, h4, p, label, button"
        )
    ];

    elements.forEach(element => {
        if (ignoredIds.has(element.id)) {
            return;
        }

        if (
            element.closest("#log") ||
            element.hasAttribute("data-no-translate")
        ) {
            return;
        }

        const text = element.textContent.trim();

        if (
            !text ||
            text === "Project Share +" ||
            text === "ProjectShare+"
        ) {
            return;
        }

        element.dataset.originalText = text;
    });
}

function applyLoginTranslations() {
    const current = translations || ENGLISH_BASE;

    document.documentElement.lang = locale;

    if (loginTitle) {
        loginTitle.textContent =
            locale.startsWith("pt")
                ? "Entre com seu e-mail atual:"
                : current.subtitle;
    }

    if (loginDescription) {
        loginDescription.textContent =
            locale.startsWith("pt")
                ? "Use seu e-mail atual para criar ou entrar na sua conta do ProjectShare+."
                : current.subtitle;
    }

    if (emailInput) {
        emailInput.placeholder =
            current.emailPlaceholder;
    }

    if (loginButton) {
        loginButton.textContent =
            locale.startsWith("pt")
                ? "Entrar"
                : current.login;
    }

    if (wikiButton) {
        wikiButton.textContent =
            locale.startsWith("pt")
                ? "Ver Wiki (ATUALIZAÇÕES)"
                : "View Wiki (UPDATES)";
    }

    translateOtherLoginTexts();
}

async function login() {
    clearError();

    const email = emailInput
        ? emailInput.value.trim().toLowerCase()
        : "";

    if (email === "") {
        showError(
            translations?.emptyLogin ||
            ENGLISH_BASE.emptyLogin
        );

        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError(
            translations?.invalidLogin ||
            ENGLISH_BASE.invalidLogin
        );

        return;
    }

    if (loginButton) {
        loginButton.disabled = true;

        loginButton.dataset.originalText =
            loginButton.textContent;

        loginButton.textContent = "...";
    }

    try {
        const response = await fetch(
            "/api/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    locale
                })
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (
            !response.ok ||
            !data.ok ||
            !data.user ||
            !data.sessionToken
        ) {
            console.error(
                "LOGIN SERVER RESPONSE:",
                response.status,
                data
            );

            showError(
                data.error ||
                translations?.serverError ||
                ENGLISH_BASE.serverError
            );

            return;
        }

        const session = {
            userId: data.user.id,

            nick:
                data.user.nick ||
                data.user.displayName ||
                email.split("@")[0],

            email,

            displayName:
                data.user.displayName ||
                data.user.nick ||
                email,

            locale:
                data.user.locale ||
                locale,

            sessionToken:
                data.sessionToken,

            expiresAt:
                Number(
                    data.expiresAt ||
                    (
                        Date.now() +
                        21 * 24 * 60 * 60 * 1000
                    )
                )
        };

        localStorage.setItem(
            "projectShareSession",
            JSON.stringify(session)
        );

        localStorage.setItem(
            "codeShareEmail",
            email
        );

        localStorage.setItem(
            "codeShareNick",
            session.nick
        );

        window.location.href = "chat.html";

    } catch (error) {
        console.error(
            "LOGIN CONNECTION ERROR:",
            error
        );

        showError(
            translations?.serverError ||
            ENGLISH_BASE.serverError
        );

    } finally {
        if (loginButton) {
            loginButton.disabled = false;

            loginButton.textContent =
                loginButton.dataset.originalText ||
                translations?.login ||
                ENGLISH_BASE.login;
        }
    }
}

if (wikiButton) {
    wikiButton.addEventListener(
        "click",
        function() {
            window.location.href = "view.html";
        }
    );
}

(async function initLogin() {

    try {
        translations =
            await loadTranslations();

        applyLoginTranslations();

    } catch (error) {

        console.error(
            "LOGIN INIT ERROR:",
            error
        );

        translations =
            translations ||
            ENGLISH_BASE;

        applyLoginTranslations();
    }

    if (loginButton) {
        loginButton.addEventListener(
            "click",
            login
        );
    }

    if (emailInput) {
        emailInput.addEventListener(
            "keydown",
            function(event) {
                if (event.key === "Enter") {
                    login();
                }
            }
        );
    }

})();