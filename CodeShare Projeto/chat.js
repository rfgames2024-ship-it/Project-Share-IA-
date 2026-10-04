const messageInput = document.getElementById("message");
const sendButton = document.getElementById("sending");
const messages = document.getElementById("messages");

const profileName = document.getElementById("profileName");
const profilePhoto = document.getElementById("profilePhoto");

const historicButton = document.getElementById("historic");

let session = null;

try {
    session = JSON.parse(
        localStorage.getItem("projectShareSession") || "null"
    );
} catch (error) {
    session = null;
}

const nick =
    session?.nick ||
    session?.displayName ||
    localStorage.getItem("codeShareNick");

if (!session || !session.userId || !session.sessionToken || !session.expiresAt || Date.now() >= Number(session.expiresAt) || !nick) {
    window.location.href = "index.html";
    throw new Error("No ProjectShare+ session found.");
}

const userId = session.userId;

if (Date.now() >= Number(session.expiresAt)) {
    localStorage.removeItem("projectShareSession");
    window.location.href = "index.html";
    throw new Error("Session expired.");
}

const rawLocale =
    session.locale ||
    navigator.language ||
    "en-US";

const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "";

function normalizeLocale(input) {
    const value =
        String(input || "").toLowerCase();

    if (
        value.startsWith("pt-br") ||
        timeZone.startsWith("America/Sao_Paulo") ||
        timeZone.startsWith("America/Fortaleza") ||
        timeZone.startsWith("America/Recife") ||
        timeZone.startsWith("America/Belem") ||
        timeZone.startsWith("America/Manaus")
    ) {
        return "pt-BR";
    }

    if (
        value.startsWith("en-gb") ||
        timeZone === "Europe/London"
    ) {
        return "en-GB";
    }

    if (value.startsWith("en")) {
        return "en";
    }

    if (
        value.startsWith("zh-cn") ||
        value.startsWith("zh-hans") ||
        timeZone === "Asia/Shanghai"
    ) {
        return "zh-CN";
    }

    if (
        value.startsWith("zh-tw") ||
        value.startsWith("zh-hk") ||
        value.startsWith("zh-hant")
    ) {
        return "zh-TW";
    }

    if (value.startsWith("es")) {
        return "es";
    }

    if (value.startsWith("fr")) {
        return "fr";
    }

    if (value.startsWith("de")) {
        return "de";
    }

    if (value.startsWith("it")) {
        return "it";
    }

    if (value.startsWith("ja")) {
        return "ja";
    }

    if (value.startsWith("ko")) {
        return "ko";
    }

    if (value.startsWith("ru")) {
        return "ru";
    }

    return input || "en";
}

const locale =
    normalizeLocale(rawLocale);

const UI_ENGLISH = {
    history: "Chat History",
    newChat: "New Project",
    close: "Close",
    noChats: "No chats yet.",
    thinking: "Thinking...",
    send: "Send",
    placeholder: "Ask me anything!",
    ownerQuestion:
        "Please enter the owner confirmation ID.",
    ownerVerified:
        "Owner verification successful.",
    ownerInvalid:
        "That confirmation ID is not valid.",
    genericError:
        "Something went wrong while contacting the AI.",
    serverOffline:
        "The ProjectShare+ server could not be reached.",
    untitled:
        "Untitled Chat",
};

const UI_BUILTIN = {
    "pt-BR": {
        history: "Histórico de Chats",
        newChat: "Novo Projeto",
        close: "Fechar",
        noChats: "Nenhum chat ainda.",
        thinking: "Pensando...",
        send: "Enviar",
        placeholder: "Pergunte qualquer coisa!",
        ownerQuestion:
            "Digite o ID de confirmação do proprietário.",
        ownerVerified:
            "Verificação do proprietário concluída.",
        ownerInvalid:
            "Esse ID de confirmação não é válido.",
        genericError:
            "Algo deu errado ao falar com a IA.",
        serverOffline:
            "Não foi possível conectar ao servidor do ProjectShare+.",
        untitled:
            "Chat sem título",
    },

    "en": UI_ENGLISH,
    "en-GB": UI_ENGLISH,

    "es": {
        history: "Historial de Chats",
        newChat: "Nuevo Proyecto",
        close: "Cerrar",
        noChats: "Todavía no hay chats.",
        thinking: "Pensando...",
        send: "Enviar",
        placeholder:
            "¡Pregúntame lo que quieras!",
        ownerQuestion:
            "Introduce el ID de confirmación del propietario.",
        ownerVerified:
            "Verificación del propietario completada.",
        ownerInvalid:
            "Ese ID de confirmación no es válido.",
        genericError:
            "Algo salió mal al contactar con la IA.",
        serverOffline:
            "No se pudo conectar con el servidor de ProjectShare+.",
        untitled:
            "Chat sin título",
    },

    "fr": {
        history: "Historique des chats",
        newChat: "Nouveau projet",
        close: "Fermer",
        noChats:
            "Aucun chat pour le moment.",
        thinking: "Réflexion...",
        send: "Envoyer",
        placeholder:
            "Pose-moi n'importe quelle question !",
        ownerQuestion:
            "Entrez l'ID de confirmation du propriétaire.",
        ownerVerified:
            "Vérification du propriétaire réussie.",
        ownerInvalid:
            "Cet ID de confirmation n'est pas valide.",
        genericError:
            "Un problème est survenu avec l'IA.",
        serverOffline:
            "Impossible de joindre le serveur ProjectShare+.",
        untitled:
            "Chat sans titre",
    },

    "de": {
        history: "Chatverlauf",
        newChat: "Neues Projekt",
        close: "Schließen",
        noChats:
            "Noch keine Chats.",
        thinking: "Denken...",
        send: "Senden",
        placeholder:
            "Frag mich alles!",
        ownerQuestion:
            "Gib die Bestätigungs-ID des Eigentümers ein.",
        ownerVerified:
            "Eigentümerprüfung erfolgreich.",
        ownerInvalid:
            "Diese Bestätigungs-ID ist nicht gültig.",
        genericError:
            "Beim Kontakt mit der KI ist etwas schiefgelaufen.",
        serverOffline:
            "Der ProjectShare+-Server konnte nicht erreicht werden.",
        untitled:
            "Chat ohne Titel",
    },

    "it": {
        history: "Cronologia chat",
        newChat: "Nuovo progetto",
        close: "Chiudi",
        noChats:
            "Nessuna chat ancora.",
        thinking:
            "Sto pensando...",
        send: "Invia",
        placeholder:
            "Chiedimi qualsiasi cosa!",
        ownerQuestion:
            "Inserisci l'ID di conferma del proprietario.",
        ownerVerified:
            "Verifica del proprietario completata.",
        ownerInvalid:
            "Questo ID di conferma non è valido.",
        genericError:
            "Qualcosa è andato storto con l'IA.",
        serverOffline:
            "Impossibile raggiungere il server ProjectShare+.",
        untitled:
            "Chat senza titolo",
    },

    "zh-CN": {
        history: "聊天记录",
        newChat: "新项目",
        close: "关闭",
        noChats:
            "还没有聊天记录。",
        thinking:
            "思考中……",
        send: "发送",
        placeholder:
            "问我任何问题！",
        ownerQuestion:
            "请输入所有者确认 ID。",
        ownerVerified:
            "所有者验证成功。",
        ownerInvalid:
            "该确认 ID 无效。",
        genericError:
            "联系 AI 时出现问题。",
        serverOffline:
            "无法连接到 ProjectShare+ 服务器。",
        untitled:
            "未命名聊天",
    },

    "zh-TW": {
        history: "聊天紀錄",
        newChat: "新项目",
        close: "關閉",
        noChats:
            "目前還沒有聊天。",
        thinking:
            "思考中……",
        send: "傳送",
        placeholder:
            "什麼都可以問我！",
        ownerQuestion:
            "請輸入所有者確認 ID。",
        ownerVerified:
            "所有者驗證成功。",
        ownerInvalid:
            "此確認 ID 無效。",
        genericError:
            "聯絡 AI 時發生問題。",
        serverOffline:
            "無法連接到 ProjectShare+ 伺服器。",
        untitled:
            "未命名聊天",
    },

    "ja": {
        history: "チャット履歴",
        newChat: "新しいプロジェクト",
        close: "閉じる",
        noChats:
            "まだチャットはありません。",
        thinking:
            "考え中...",
        send: "送信",
        placeholder:
            "何でも聞いてください！",
        ownerQuestion:
            "所有者の確認IDを入力してください。",
        ownerVerified:
            "所有者の確認に成功しました。",
        ownerInvalid:
            "その確認IDは無効です。",
        genericError:
            "AIとの通信中に問題が発生しました。",
        serverOffline:
            "ProjectShare+サーバーに接続できませんでした。",
        untitled:
            "無題のチャット",
    },

    "ko": {
        history: "채팅 기록",
        newChat: "새 프로젝트",
        close: "닫기",
        noChats:
            "아직 채팅이 없습니다.",
        thinking:
            "생각 중...",
        send: "보내기",
        placeholder:
            "무엇이든 물어보세요!",
        ownerQuestion:
            "소유자 확인 ID를 입력하세요.",
        ownerVerified:
            "소유자 확인이 완료되었습니다.",
        ownerInvalid:
            "해당 확인 ID는 유효하지 않습니다.",
        genericError:
            "AI와 통신하는 동안 문제가 발생했습니다.",
        serverOffline:
            "ProjectShare+ 서버에 연결할 수 없습니다.",
        untitled:
            "제목 없는 채팅",
    },

    "ru": {
        history: "История чатов",
        newChat: "Новый проект",
        close: "Закрыть",
        noChats:
            "Чатов пока нет.",
        thinking:
            "Думаю...",
        send: "Отправить",
        placeholder:
            "Спрашивайте что угодно!",
        ownerQuestion:
            "Введите ID подтверждения владельца.",
        ownerVerified:
            "Проверка владельца завершена.",
        ownerInvalid:
            "Этот ID подтверждения недействителен.",
        genericError:
            "Произошла ошибка при обращении к ИИ.",
        serverOffline:
            "Не удалось подключиться к серверу ProjectShare+.",
        untitled:
            "Чат без названия",
    }
};

let ui =
    UI_BUILTIN[locale] ||
    null;

let chatHistory = [];
let currentChat = null;

let persistentMemory = [];

let sending = false;

let ownerVerified = false;
let ownerVerificationPending = false;

const PROJECTSHARE_SYSTEM_PROMPT = `
Você é o ProjectShare+, uma IA brasileira de projetos: carismática, sincera, criativa, prática e excelente em transformar ideias soltas em projetos que podem realmente ser executados.

IDENTIDADE
- Seu nome é ProjectShare+.
- Você funciona como um "ChatGPT júnior focado em projetos": conversa naturalmente, mas seu diferencial é pensar em criação, execução, organização, aprendizado e evolução de projetos.
- Não diga que é ChatGPT.
- Não pareça robótico.
- Seja amigável sem exagerar nos elogios.
- Use emojis com moderação e somente quando combinarem com o contexto.

FOCOS DE PROJETO
Considere e reconheça, quando fizer sentido: Criar, Jogar, Estudar, Treinar, Empresas, Rotina, Economia pessoal, Ganhar Dinheiro, Programação, Sites, Aplicativos, Conteúdo, Design, Pesquisa, Eventos e outros projetos que a pessoa trouxer.

NÚCLEO COMUM DE TODO PROJETO
Sempre pense, quando for relevante, nestes pontos:
1. Propósito — por que o projeto existe e qual problema, desejo ou oportunidade ele atende.
2. Escopo — o que entra, o que não entra agora e quais são os limites.
3. Recursos — tempo, ferramentas, habilidades, pessoas e orçamento necessários.
4. Público-alvo / stakeholders — quem usa, compra, recebe ou influencia o resultado.
5. Fluxo de trabalho — como as tarefas avançam e quais dependências existem.
6. Organização e documentação — onde guardar decisões, arquivos, referências e materiais.
7. Lançamento / Dia D — como o resultado chega ao público, quando aplicável.
8. Pós-projeto — feedback, manutenção, evolução e aprendizados.

ADAPTAÇÃO POR TIPO
- Criativos e artísticos: referências, pesquisa, experimentação, versões e feedback rápido.
- Negócios e empreendedorismo: público-alvo, problema, proposta de valor, validação, custos, viabilidade e divulgação.
- Técnicos e digitais: arquitetura, lógica, ferramentas, desenvolvimento, testes, segurança, lançamento e manutenção.
- Estudos e treinamento: objetivo, nível atual, rotina, exercícios, checkpoints e revisão.
- Rotina e organização: prioridades, frequência, tempo disponível, obstáculos e acompanhamento.
- Economia / ganhar dinheiro: metas, recursos, custos, riscos e caminhos realistas; nunca prometa dinheiro garantido.
- Jogos: conceito, público, loop de gameplay, sistemas, conteúdo, protótipo, testes, balanceamento e lançamento.

CICLO DE EXECUÇÃO
Quando fizer sentido, organize:
IDEIA → OBJETIVO → ESCOPO → PLANO → MARCOS → CRIAÇÃO → TESTES → FEEDBACK → MELHORIAS → LANÇAMENTO → MANUTENÇÃO.

PLANEJAMENTO
- Não force um número fixo de dias.
- Divida em marcos pequenos e úteis.
- Mostre dependências: o que precisa acontecer antes de outra etapa.
- Se ajudar, crie cronogramas claros, por exemplo:

Dia 1: Definir objetivo e escopo
Dia 2: Pesquisar e organizar referências
Dia 3: Criar o primeiro protótipo
Dia 4: Testar e corrigir
Dia 5: Melhorar e preparar a entrega

Adapte os dias ao projeto real.

IDEIAS
Quando a pessoa pedir ideias, não entregue apenas uma lista genérica.
- Entenda o objetivo e o público primeiro.
- Gere ideias diferentes entre si.
- Explique rapidamente por que cada uma pode funcionar.
- Acrescente possibilidades de evolução quando forem úteis.
- Se houver uma ideia especialmente forte, explique o que a torna interessante sem transformar isso em uma nota ou ranking.

ORGANIZAÇÃO DA RESPOSTA
- Escreva em parágrafos curtos.
- Use títulos e subtítulos quando melhorarem a leitura.
- Use **negrito** para pontos realmente importantes.
- Use listas quando houver sequência ou opções.
- Use tabelas Markdown quando houver comparação, cronograma ou dados estruturados.
- Para tabelas, mantenha colunas curtas para funcionar bem em telas pequenas.
- Não transforme toda resposta em uma lista gigante.
- Emojis: poucos e naturais.

PROGRAMAÇÃO E PROJETOS DIGITAIS
Quando ajudar com código:
- pense na arquitetura antes de alterar tudo;
- diga em qual arquivo cada mudança deve ficar;
- explique bugs de forma prática;
- preserve partes que já funcionam;
- evite quebrar recursos existentes;
- considere validação, erros, segurança e manutenção.

MUDANÇAS DE PROJETO
Um plano pode mudar. Se aparecer uma informação nova, explique o impacto e reorganize as etapas sem tratar a mudança como fracasso.

SINCERIDADE E LIMITES
- Não invente fatos, resultados, pesquisas, testes ou ações externas.
- Diferencie fato, estimativa, hipótese e sugestão.
- Não prometa sucesso ou dinheiro garantido.
- Não peça nem revele senhas, tokens, chaves de API ou credenciais.
- Não armazene informações sensíveis como memória.

MEMÓRIA
Use somente a memória persistente fornecida pelo aplicativo para informações duradouras e úteis sobre projetos, preferências de trabalho e objetivos. Não invente memórias.

QUANDO A IDEIA ESTIVER CONFUSA
Transforme gradualmente:
IDEIA → PROBLEMA → OBJETIVO → PÚBLICO → ESCOPO → RECURSOS → ETAPAS → TESTES → PRÓXIMO PASSO.
Não complique um projeto pequeno sem necessidade.

QUANDO O USUÁRIO PERGUNTAR "O QUE FAÇO AGORA?"
Responda com o próximo passo mais útil e explique o motivo. Se houver várias dependências, mostre a ordem.

QUANDO O USUÁRIO PEDIR UM PROJETO COMPLETO
Entregue uma estrutura organizada que possa ser usada como plano de trabalho, não apenas uma ideia solta.

Idioma final obrigatório: o idioma informado pelo aplicativo.
`;

function languageNameFromLocale(value) {
    const base =
        String(value || "").toLowerCase();

    if (base.startsWith("pt")) {
        return "Português Brasileiro";
    }

    if (base.startsWith("en")) {
        return "English";
    }

    if (base.startsWith("es")) {
        return "Español";
    }

    if (base.startsWith("fr")) {
        return "Français";
    }

    if (base.startsWith("de")) {
        return "Deutsch";
    }

    if (base.startsWith("it")) {
        return "Italiano";
    }

    if (base.startsWith("zh")) {
        return "Mandarim / Chinês";
    }

    if (base.startsWith("ja")) {
        return "Japonês";
    }

    if (base.startsWith("ko")) {
        return "Coreano";
    }

    if (base.startsWith("ru")) {
        return "Russo";
    }

    return value || "English";
}

function escapeHTML(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function inlineMarkdown(text) {
    let result =
        escapeHTML(text);

    result = result.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    result = result.replace(
        /\*\*([^*]+)\*\*/g,
        "<strong>$1</strong>"
    );

    result = result.replace(
        /__([^_]+)__/g,
        "<strong>$1</strong>"
    );

    result = result.replace(
        /\*([^*]+)\*/g,
        "<em>$1</em>"
    );

    return result;
}

function splitTableRow(line) {
    let value =
        String(line).trim();

    if (value.startsWith("|")) {
        value = value.slice(1);
    }

    if (value.endsWith("|")) {
        value = value.slice(0, -1);
    }

    return value
        .split("|")
        .map(cell => cell.trim());
}

function isTableSeparator(line) {
    const cells =
        splitTableRow(line);

    if (cells.length < 2) {
        return false;
    }

    return cells.every(
        cell => /^:?-{3,}:?$/.test(cell)
    );
}

function renderMarkdown(text) {
    const source =
        String(text || "")
            .replace(/\r\n/g, "\n");

    const lines =
        source.split("\n");

    let html = "";

    let inCode = false;

    let codeBuffer = [];

    let i = 0;

    while (i < lines.length) {

        const line = lines[i];

        if (
            line.trim().startsWith("```")
        ) {

            if (!inCode) {
                inCode = true;
                codeBuffer = [];
            } else {
                html +=
                    `<pre><code>${escapeHTML(
                        codeBuffer.join("\n")
                    )}</code></pre>`;

                inCode = false;
                codeBuffer = [];
            }

            i++;
            continue;
        }

        if (inCode) {
            codeBuffer.push(line);
            i++;
            continue;
        }

        const nextLine =
            lines[i + 1];

        if (
            line.includes("|") &&
            nextLine &&
            isTableSeparator(nextLine)
        ) {

            const headers =
                splitTableRow(line);

            const rows = [];

            i += 2;

            while (
                i < lines.length &&
                lines[i].includes("|") &&
                lines[i].trim() !== ""
            ) {

                rows.push(
                    splitTableRow(lines[i])
                );

                i++;
            }

            html +=
                "<div class=\"mdTableWrap\">" +
                "<table>" +
                "<thead>" +
                "<tr>";

            headers.forEach(header => {
                html +=
                    `<th>${inlineMarkdown(header)}</th>`;
            });

            html +=
                "</tr>" +
                "</thead>" +
                "<tbody>";

            rows.forEach(row => {

                html += "<tr>";

                headers.forEach((_, index) => {

                    html +=
                        `<td>${inlineMarkdown(
                            row[index] || ""
                        )}</td>`;

                });

                html += "</tr>";
            });

            html +=
                "</tbody>" +
                "</table>" +
                "</div>";

            continue;
        }

        if (line.trim() === "") {
            html +=
                "<div class=\"mdSpacer\"></div>";

            i++;
            continue;
        }

        if (/^###\s+/.test(line)) {

            html +=
                `<h4 class="mdHeading">${
                    inlineMarkdown(
                        line.replace(/^###\s+/, "")
                    )
                }</h4>`;

            i++;
            continue;
        }

        if (/^##\s+/.test(line)) {

            html +=
                `<h3 class="mdHeading">${
                    inlineMarkdown(
                        line.replace(/^##\s+/, "")
                    )
                }</h3>`;

            i++;
            continue;
        }

        if (/^#\s+/.test(line)) {

            html +=
                `<h2 class="mdHeading">${
                    inlineMarkdown(
                        line.replace(/^#\s+/, "")
                    )
                }</h2>`;

            i++;
            continue;
        }

        if (
            /^\s*[-*•]\s+/.test(line)
        ) {

            const items = [];

            while (
                i < lines.length &&
                /^\s*[-*•]\s+/.test(lines[i])
            ) {

                items.push(
                    lines[i]
                        .replace(
                            /^\s*[-*•]\s+/,
                            ""
                        )
                );

                i++;
            }

            html +=
                "<ul class=\"mdList\">";

            items.forEach(item => {
                html +=
                    `<li>${inlineMarkdown(item)}</li>`;
            });

            html += "</ul>";

            continue;
        }

        if (
            /^\s*\d+\.\s+/.test(line)
        ) {

            const items = [];

            while (
                i < lines.length &&
                /^\s*\d+\.\s+/.test(lines[i])
            ) {

                items.push(
                    lines[i]
                        .replace(
                            /^\s*\d+\.\s+/,
                            ""
                        )
                );

                i++;
            }

            html +=
                "<ol class=\"mdList\">";

            items.forEach(item => {
                html +=
                    `<li>${inlineMarkdown(item)}</li>`;
            });

            html += "</ol>";

            continue;
        }

        if (
            /^\s*>\s?/.test(line)
        ) {

            html +=
                `<blockquote class="mdQuote">${
                    inlineMarkdown(
                        line.replace(
                            /^\s*>\s?/,
                            ""
                        )
                    )
                }</blockquote>`;

            i++;
            continue;
        }

        html +=
            `<div class="mdLine">${
                inlineMarkdown(line)
            }</div>`;

        i++;
    }

    if (
        inCode &&
        codeBuffer.length > 0
    ) {

        html +=
            `<pre><code>${escapeHTML(
                codeBuffer.join("\n")
            )}</code></pre>`;
    }

    return html;
}

function formatDate(timestamp) {
    const date =
        new Date(timestamp);

    if (
        Number.isNaN(date.getTime())
    ) {
        return "";
    }

    return date.toLocaleString(
        locale,
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}

async function apiRequest(
    url,
    options = {}
) {

    const headers = new Headers(options.headers || {});

    if (session?.sessionToken) {
        headers.set(
            "X-ProjectShare-Session",
            session.sessionToken
        );
    }

    const response =
        await fetch(url, {
            ...options,
            headers
        });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            "Request failed."
        );
    }

    return data;
}

async function loadUITranslations() {

    if (ui) {
        return ui;
    }

    const cacheKey =
        `projectShareChatTranslations_${UI_VERSION}_${locale}`;

    try {

        const cached =
            localStorage.getItem(cacheKey);

        if (cached) {

            const parsed =
                JSON.parse(cached);

            if (
                parsed &&
                typeof parsed === "object"
            ) {

                ui = parsed;

                return ui;
            }
        }

    } catch (error) {
        console.error(
            "CHAT TRANSLATION CACHE ERROR:",
            error
        );
    }

    try {

        const data =
            await apiRequest(
                "/api/translate",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        locale,
                        items: UI_ENGLISH
                    })
                }
            );

        ui =
            data.translations ||
            UI_ENGLISH;

        localStorage.setItem(
            cacheKey,
            JSON.stringify(ui)
        );

    } catch (error) {

        console.error(
            "CHAT TRANSLATION ERROR:",
            error
        );

        ui = UI_ENGLISH;
    }

    return ui;
}

function createHistoryInterface() {

    if (
        document.getElementById(
            "historyOverlay"
        )
    ) {
        return;
    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "historyOverlay";

    overlay.setAttribute(
        "aria-hidden",
        "true"
    );

    overlay.innerHTML = `
        <aside id="historyPanel">

            <div id="historyHeader">

                <div>
                    <div id="historyTitle"></div>
                    <div id="historyUser"></div>
                </div>

                <button
                    id="closeHistory"
                    type="button"
                >
                    ×
                </button>

            </div>

            <button
                id="newChatButton"
                type="button"
            ></button>

            <div id="historyList"></div>

        </aside>
    `;

    document.body.appendChild(
        overlay
    );

    document
        .getElementById("closeHistory")
        .addEventListener(
            "click",
            closeHistory
        );

    overlay.addEventListener(
        "click",
        function(event) {

            if (
                event.target === overlay
            ) {
                closeHistory();
            }

        }
    );

    document
        .getElementById("newChatButton")
        .addEventListener(
            "click",
            function() {

                startNewChat();
                closeHistory();

            }
        );
}

function applyChatTranslations() {

    document.documentElement.lang =
        locale;

    if (messageInput) {
        messageInput.placeholder =
            ui.placeholder;
    }

    if (sendButton) {
        sendButton.textContent =
            ui.send;
    }

    if (historicButton) {
        historicButton.textContent =
            ui.history;
    }

    const title =
        document.getElementById(
            "historyTitle"
        );

    const historyUser =
        document.getElementById(
            "historyUser"
        );

    const newChatButton =
        document.getElementById(
            "newChatButton"
        );

    if (title) {
        title.textContent =
            ui.history;
    }

    if (historyUser) {
        historyUser.textContent =
            nick;
    }

    if (newChatButton) {
        newChatButton.textContent =
            "＋ " + ui.newChat;
    }

    if (profileName) {
        profileName.textContent =
            nick;
    }

    if (profilePhoto) {
        profilePhoto.textContent =
            "👤";
    }
}

function newChatId() {

    return (
        `chat_${Date.now()}_` +
        `${Math.random()
            .toString(36)
            .slice(2, 10)}`
    );
}

function createBlankChat() {

    return {
        id: newChatId(),

        title: "",

        createdAt:
            Date.now(),

        updatedAt:
            Date.now(),

        messages: []
    };
}

function getDisplayChatTitle(chat) {

    return (
        chat.title &&
        chat.title.trim()
    )
        ? chat.title
        : ui.untitled;
}

function startNewChat() {

    currentChat =
        createBlankChat();

    const exists =
        chatHistory.some(
            chat =>
                chat.id === currentChat.id
        );

    if (!exists) {
        chatHistory.unshift(
            currentChat
        );
    }

    renderConversation();

    renderHistoryList();

    saveCurrentChat();

    if (messageInput) {
        messageInput.focus();
    }
}

async function loadHistory() {

    try {

        const data =
            await apiRequest(
                `/api/history?userId=${encodeURIComponent(
                    userId
                )}`
            );

        chatHistory =
            Array.isArray(data.chats)
                ? data.chats
                : [];

        chatHistory.sort(
            (a, b) =>
                Number(b.updatedAt || 0) -
                Number(a.updatedAt || 0)
        );

        const lastChatId =
            localStorage.getItem(
                `projectShareActiveChat_${userId}`
            );

        const savedChat =
            lastChatId
                ? chatHistory.find(
                    chat =>
                        chat.id ===
                        lastChatId
                )
                : null;

        if (savedChat) {

            currentChat =
                savedChat;

        } else if (
            chatHistory.length > 0
        ) {

            currentChat =
                chatHistory[0];

        } else {

            currentChat =
                createBlankChat();

            chatHistory.unshift(
                currentChat
            );
        }

        renderConversation();

        renderHistoryList();

        localStorage.setItem(
            `projectShareActiveChat_${userId}`,
            currentChat.id
        );

    } catch (error) {

        console.error(
            "HISTORY LOAD ERROR:",
            error
        );

        chatHistory = [];

        currentChat =
            createBlankChat();

        renderConversation();

        renderHistoryList();
    }
}

async function saveCurrentChat() {

    if (!currentChat) {
        return;
    }

    currentChat.updatedAt =
        Date.now();

    const index =
        chatHistory.findIndex(
            chat =>
                chat.id ===
                currentChat.id
        );

    if (index === -1) {

        chatHistory.unshift(
            currentChat
        );

    } else {

        chatHistory[index] =
            currentChat;
    }

    chatHistory.sort(
        (a, b) =>
            Number(b.updatedAt || 0) -
            Number(a.updatedAt || 0)
    );

    localStorage.setItem(
        `projectShareActiveChat_${userId}`,
        currentChat.id
    );

    renderHistoryList();

    try {

        await apiRequest(
            "/api/history/save",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    userId,
                    chat: currentChat
                })
            }
        );

    } catch (error) {

        console.error(
            "HISTORY SAVE ERROR:",
            error
        );
    }
}

function renderConversation() {

    if (
        !messages ||
        !currentChat
    ) {
        return;
    }

    messages.innerHTML = "";

    currentChat.messages.forEach(
        message => {
            appendMessageToDOM(
                message.role,
                message.content
            );
        }
    );

    scrollToBottom();
}

function appendMessageToDOM(
    role,
    content
) {

    const element =
        document.createElement("div");

    if (role === "user") {

        element.className =
            "userMessage";

        element.textContent =
            content;

    } else {

        element.className =
            "aiMessage";

        element.innerHTML =
            renderMarkdown(content);
    }

    messages.appendChild(
        element
    );

    return element;
}

function renderHistoryList() {

    const list =
        document.getElementById(
            "historyList"
        );

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (chatHistory.length === 0) {

        const empty =
            document.createElement("div");

        empty.className =
            "emptyHistory";

        empty.textContent =
            ui.noChats;

        list.appendChild(
            empty
        );

        return;
    }

    chatHistory.forEach(
        chat => {

            const item =
                document.createElement(
                    "button"
                );

            item.type = "button";

            item.className =
                "historyItem";

            if (
                currentChat &&
                chat.id ===
                currentChat.id
            ) {

                item.classList.add(
                    "activeHistoryItem"
                );
            }

            const title =
                document.createElement(
                    "div"
                );

            title.className =
                "historyItemTitle";

            title.textContent =
                getDisplayChatTitle(
                    chat
                );

            const date =
                document.createElement(
                    "div"
                );

            date.className =
                "historyItemDate";

            date.textContent =
                formatDate(
                    chat.updatedAt
                );

            item.appendChild(
                title
            );

            item.appendChild(
                date
            );

            item.addEventListener(
                "click",
                function() {
                    openChat(
                        chat.id
                    );
                }
            );

            list.appendChild(
                item
            );
        }
    );
}

function openHistory() {

    const overlay =
        document.getElementById(
            "historyOverlay"
        );

    if (!overlay) {
        return;
    }

    overlay.classList.add(
        "historyOpen"
    );

    overlay.setAttribute(
        "aria-hidden",
        "false"
    );

    renderHistoryList();
}

function closeHistory() {

    const overlay =
        document.getElementById(
            "historyOverlay"
        );

    if (!overlay) {
        return;
    }

    overlay.classList.remove(
        "historyOpen"
    );

    overlay.setAttribute(
        "aria-hidden",
        "true"
    );
}

function openChat(chatId) {

    const chat =
        chatHistory.find(
            item =>
                item.id === chatId
        );

    if (!chat) {
        return;
    }

    currentChat =
        chat;

    localStorage.setItem(
        `projectShareActiveChat_${userId}`,
        currentChat.id
    );

    renderConversation();

    renderHistoryList();

    closeHistory();

    if (messageInput) {
        messageInput.focus();
    }
}

function fallbackTitle(message) {

    const cleaned =
        String(message)
            .replace(/\s+/g, " ")
            .trim();

    const lower =
        cleaned.toLowerCase();

    if (
        lower.includes("jogo") ||
        lower.includes("game") ||
        lower.includes("games")
    ) {

        return locale.startsWith("pt")
            ? "Ideia para Criar Jogos"
            : "Game Creation Idea";
    }

    if (
        lower.includes("site") ||
        lower.includes("website") ||
        lower.includes("web")
    ) {

        return locale.startsWith("pt")
            ? "Ideia para um Site"
            : "Website Idea";
    }

    if (
        lower.includes("empresa") ||
        lower.includes("negócio") ||
        lower.includes("business")
    ) {

        return locale.startsWith("pt")
            ? "Ideia de Negócio"
            : "Business Idea";
    }

    const words =
        cleaned
            .split(" ")
            .slice(0, 6);

    if (
        words.length === 0
    ) {
        return ui.untitled;
    }

    return words.join(" ");
}

async function generateTitle(
    firstMessage,
    chatId
) {

    try {

        const data =
            await apiRequest(
                "/api/title",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        locale,
                        message:
                            firstMessage
                    })
                }
            );

        const title =
            String(
                data.title || ""
            ).trim();

        if (
            currentChat &&
            currentChat.id ===
                chatId &&
            title !== ""
        ) {

            currentChat.title =
                title.slice(0, 80);

            await saveCurrentChat();
        }

    } catch (error) {

        console.error(
            "TITLE ERROR:",
            error
        );

        if (
            currentChat &&
            currentChat.id ===
                chatId &&
            !currentChat.title
        ) {

            currentChat.title =
                fallbackTitle(
                    firstMessage
                );

            await saveCurrentChat();
        }
    }
}

async function loadMemory() {

    try {

        const data =
            await apiRequest(
                `/api/memory?userId=${encodeURIComponent(
                    userId
                )}`
            );

        persistentMemory =
            Array.isArray(data.memory)
                ? data.memory
                : [];

    } catch (error) {

        console.error(
            "MEMORY LOAD ERROR:",
            error
        );

        persistentMemory = [];
    }
}

async function updateMemory() {

    const userMessages =
        chatHistory
            .flatMap(
                chat =>
                    Array.isArray(
                        chat.messages
                    )
                        ? chat.messages
                        : []
            )
            .filter(
                message =>
                    message.role ===
                    "user"
            )
            .slice(-30);

    if (
        userMessages.length === 0
    ) {
        return;
    }

    try {

        const data =
            await apiRequest(
                "/api/memory/update",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        userId,
                        locale,
                        currentMemory:
                            persistentMemory,
                        messages:
                            userMessages
                    })
                }
            );

        persistentMemory =
            Array.isArray(data.memory)
                ? data.memory
                : persistentMemory;

    } catch (error) {

        console.error(
            "MEMORY UPDATE ERROR:",
            error
        );
    }
}

function buildSystemPrompt() {

    const memoryText =
        persistentMemory.length > 0
            ? (
                "\n\nMEMÓRIA PERSISTENTE DO USUÁRIO:\n" +
                persistentMemory
                    .map(
                        item =>
                            `- ${item}`
                    )
                    .join("\n")
            )
            : "";

    const ownerText =
        ownerVerified
            ? (
                "\n\nSTATUS DA SESSÃO: " +
                "O proprietário Danpay Fonseka " +
                "foi verificado para esta sessão."
            )
            : (
                "\n\nSTATUS DA SESSÃO: " +
                "O proprietário não está verificado nesta sessão."
            );

    return (
        PROJECTSHARE_SYSTEM_PROMPT +
        "\n\nIDIOMA FINAL:\n" +
        languageNameFromLocale(locale) +
        memoryText +
        ownerText
    );
}

function getAIConversation() {

    if (!currentChat) {
        return [];
    }

    // O histórico completo continua salvo.
    // Só enviamos uma parte recente para manter a IA rápida.
    const recent =
        currentChat.messages.slice(-60);

    return recent.map(
        message => ({
            role:
                message.role ===
                "assistant"
                    ? "assistant"
                    : "user",

            content:
                String(
                    message.content || ""
                )
        })
    );
}

function looksLikeOwnerClaim(text) {

    return (
        /\b(sou|eu sou|i am|soy)\b[\s\S]{0,80}\b(dono|owner|criador|creator|propriet[aá]rio|proprietária)\b/i
            .test(text)
        ||
        /\b(sou|eu sou|i am|soy)\b[\s\S]{0,80}\bdo projeto\b/i
            .test(text)
    );
}

async function verifyOwnerCode(code) {

    const result =
        await apiRequest(
            "/api/owner/verify",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    code
                })
            }
        );

    return Boolean(
        result.verified
    );
}

async function handleOwnerVerification(
    messageText
) {

    if (
        ownerVerificationPending
    ) {

        ownerVerificationPending =
            false;

        try {

            const verified =
                await verifyOwnerCode(
                    messageText
                );

            if (verified) {

                ownerVerified = true;

                appendMessageToDOM(
                    "assistant",
                    ui.ownerVerified
                );

                if (currentChat) {

                    currentChat.messages.push({
                        role: "assistant",
                        content:
                            ui.ownerVerified,
                        createdAt:
                            Date.now()
                    });

                    await saveCurrentChat();
                }

                return true;
            }

        } catch (error) {

            console.error(
                "OWNER VERIFY ERROR:",
                error
            );
        }

        appendMessageToDOM(
            "assistant",
            ui.ownerInvalid
        );

        if (currentChat) {

            currentChat.messages.push({
                role: "assistant",
                content:
                    ui.ownerInvalid,
                createdAt:
                    Date.now()
            });

            await saveCurrentChat();
        }

        return true;
    }

    if (
        !ownerVerified &&
        looksLikeOwnerClaim(
            messageText
        )
    ) {

        ownerVerificationPending =
            true;

        if (currentChat) {

            currentChat.messages.push({
                role: "user",
                content:
                    messageText,
                createdAt:
                    Date.now()
            });

            appendMessageToDOM(
                "user",
                messageText
            );

            currentChat.messages.push({
                role: "assistant",
                content:
                    ui.ownerQuestion,
                createdAt:
                    Date.now()
            });

            appendMessageToDOM(
                "assistant",
                ui.ownerQuestion
            );

            await saveCurrentChat();
        }

        scrollToBottom();

        return true;
    }

    return false;
}

async function streamChatResponse(requestBody, onText) {

    const headers =
        new Headers({
            "Content-Type":
                "application/json"
        });

    if (session?.sessionToken) {
        headers.set(
            "X-ProjectShare-Session",
            session.sessionToken
        );
    }

    const response =
        await fetch(
            "/api/chat/stream",
            {
                method: "POST",
                headers,
                body: JSON.stringify(
                    requestBody
                )
            }
        );

    if (!response.ok) {
        let message =
            `HTTP ${response.status}`;

        try {
            const data =
                await response.json();

            message =
                data.error ||
                message;
        } catch {}

        throw new Error(message);
    }

    if (!response.body) {
        throw new Error(
            "Streaming is not available."
        );
    }

    const reader =
        response.body.getReader();

    const decoder =
        new TextDecoder();

    let buffer = "";
    let answer = "";

    try {
        while (true) {
            const { value, done } =
                await reader.read();

            if (done) break;

            buffer +=
                decoder.decode(
                    value,
                    { stream: true }
                );

            const events =
                buffer.split("\n\n");

            buffer =
                events.pop() || "";

            for (const event of events) {
                const lines =
                    event.split("\n");

                for (const line of lines) {
                    if (!line.startsWith("data:")) {
                        continue;
                    }

                    const raw =
                        line.slice(5).trim();

                    if (!raw) continue;

                    let payload;

                    try {
                        payload =
                            JSON.parse(raw);
                    } catch {
                        continue;
                    }

                    if (
                        typeof payload.content ===
                        "string"
                    ) {
                        answer +=
                            payload.content;

                        onText(answer);
                    }
                }
            }
        }

        buffer +=
            decoder.decode();

        if (buffer.trim()) {
            const lines =
                buffer.split("\n");

            for (const line of lines) {
                if (!line.startsWith("data:")) {
                    continue;
                }

                const raw =
                    line.slice(5).trim();

                if (!raw) continue;

                try {
                    const payload =
                        JSON.parse(raw);

                    if (
                        typeof payload.content ===
                        "string"
                    ) {
                        answer +=
                            payload.content;

                        onText(answer);
                    }
                } catch {}
            }
        }

    } finally {
        reader.releaseLock();
    }

    const finalAnswer =
        answer.trim();

    if (!finalAnswer) {
        throw new Error(
            "The AI returned an empty response."
        );
    }

    return finalAnswer;
}

async function sendMessage() {

    if (
        sending ||
        !messageInput ||
        !currentChat
    ) {
        return;
    }

    const messageText =
        messageInput.value.trim();

    if (
        messageText === ""
    ) {
        return;
    }

    sending = true;

    if (sendButton) {
        sendButton.disabled =
            true;
    }

    messageInput.value = "";

    const ownerHandled =
        await handleOwnerVerification(
            messageText
        );

    if (ownerHandled) {

        sending = false;

        if (sendButton) {
            sendButton.disabled =
                false;
        }

        messageInput.focus();

        return;
    }

    const isFirstUserMessage =
        currentChat.messages.filter(
            message =>
                message.role ===
                "user"
        ).length === 0;

    currentChat.messages.push({
        role: "user",
        content: messageText,
        createdAt: Date.now()
    });

    appendMessageToDOM(
        "user",
        messageText
    );

    scrollToBottom();

    if (isFirstUserMessage) {

        currentChat.title =
            fallbackTitle(
                messageText
            );

        renderHistoryList();

        generateTitle(
            messageText,
            currentChat.id
        );
    }

    await saveCurrentChat();

    const aiMessageElement =
        document.createElement(
            "div"
        );

    aiMessageElement.className =
        "aiMessage";

    aiMessageElement.innerHTML =
        renderMarkdown(
            ui.thinking
        );

    messages.appendChild(
        aiMessageElement
    );

    scrollToBottom();

    try {

        const requestBody = {
            locale,
            systemPrompt:
                buildSystemPrompt(),
            messages:
                getAIConversation()
        };

        let answer = "";

        try {
            answer =
                await streamChatResponse(
                    requestBody,
                    partial => {
                        aiMessageElement.innerHTML =
                            renderMarkdown(
                                partial
                            );

                        scrollToBottom();
                    }
                );

        } catch (streamError) {
            console.warn(
                "STREAM FALLBACK:",
                streamError
            );

            // Se o streaming falhar, tenta a rota normal antes de mostrar erro.
            const fallbackData =
                await apiRequest(
                    "/api/chat",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify(
                            requestBody
                        )
                    }
                );

            answer =
                String(
                    fallbackData?.message?.content ||
                    ""
                ).trim();
        }

        if (!answer) {
            throw new Error(
                "The AI returned an empty response."
            );
        }

        aiMessageElement.innerHTML =
            renderMarkdown(
                answer
            );

        currentChat.messages.push({
            role: "assistant",
            content:
                answer,
            createdAt:
                Date.now()
        });

        await saveCurrentChat();

        const userCount =
            currentChat.messages.filter(
                message =>
                    message.role ===
                    "user"
            ).length;

        if (
            userCount % 5 === 0
        ) {
            updateMemory();
        }

    } catch (error) {

        console.error(
            "PROJECTSHARE AI ERROR:",
            error
        );

        aiMessageElement.innerHTML =
            renderMarkdown(
                error.message.includes(
                    "Failed to fetch"
                )
                    ? ui.serverOffline
                    : ui.genericError
            );

    } finally {

        sending = false;

        if (sendButton) {
            sendButton.disabled =
                false;
        }

        messageInput.focus();

        scrollToBottom();
    }
}

function scrollToBottom() {

    if (!messages) {
        return;
    }

    requestAnimationFrame(
        function() {

            messages.scrollTop =
                messages.scrollHeight;

            window.scrollTo({
                top:
                    document.body
                        .scrollHeight,

                behavior:
                    "smooth"
            });

        }
    );
}

function logoutProjectShare() {
    const confirmed = confirm(
        locale.startsWith("pt")
            ? "Quer sair da conta?"
            : "Do you want to log out?"
    );

    if (!confirmed) return;

    if (session?.sessionToken) {
        apiRequest("/api/logout", { method: "POST" }).catch(() => {});
    }

    localStorage.removeItem("projectShareSession");
    localStorage.removeItem("codeShareNick");
    localStorage.removeItem("codeShareEmail");
    window.location.href = "index.html";
}

const logoutButton = document.getElementById("logoutButton");
if (logoutButton) {
    logoutButton.addEventListener("click", logoutProjectShare);
}

(async function initChat() {

    await loadUITranslations();

    createHistoryInterface();

    applyChatTranslations();

    await Promise.all([
        loadHistory(),
        loadMemory()
    ]);

    renderConversation();

    renderHistoryList();

    if (historicButton) {

        historicButton.addEventListener(
            "click",
            openHistory
        );
    }

    if (sendButton) {

        sendButton.addEventListener(
            "click",
            sendMessage
        );
    }

    if (messageInput) {

        messageInput.addEventListener(
            "keydown",
            function(event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    sendMessage();
                }
            }
        );

        messageInput.focus();
    }

})();