let loadedPlugins = [];
const splashScreen = document.createElement('div');

/* ═══════════════════════════════════════════════════
   INTERCEPTOR INSTALADO PRIMEIRO
═══════════════════════════════════════════════════ */
const correctAnswers = new Map();
const pendingToasts = [];
let toastifyReady = false;

function sendToast(text, duration = 5000) {
    if (toastifyReady) {
        Toastify({ text, duration, gravity: 'bottom', position: "center", stopOnFocus: true, style: { background: "#000000" } }).showToast();
    } else {
        pendingToasts.push({ text, duration });
    }
}

function flushToasts() {
    toastifyReady = true;
    pendingToasts.forEach(t => sendToast(t.text, t.duration));
    pendingToasts.length = 0;
}

const toFraction = (d) => {
    if (d === 0 || d === 1) return String(d);
    const decimals = (String(d).split('.')[1] || '').length;
    let num = Math.round(d * Math.pow(10, decimals)), den = Math.pow(10, decimals);
    const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
    const div = gcd(Math.abs(num), Math.abs(den));
    return den / div === 1 ? String(num / div) : `${num / div}/${den / div}`;
};

/* ── Extrai o item da resposta independente da estrutura ── */
function extractItem(data) {
    if (!data?.data) return null;
    const d = data.data;

    // Estrutura nova: assessmentItemById
    if (d.assessmentItemById?.item) return d.assessmentItemById.item;

    // Estrutura antiga: qualquer chave com .item
    for (const key in d) {
        if (d[key]?.item) return d[key].item;
    }

    // Estrutura alternativa: direto no data
    if (d.item) return d.item;

    return null;
}

const originalFetch = window.fetch;

window.fetch = async function(input, init = {}) {
    const url = (input instanceof Request ? input.url : input) || '';
    let body = input instanceof Request ? await input.clone().text() : (init?.body || '');

    /* ══ QuestionSpoof ══ */
    if (url.includes('getAssessmentItem') && body) {
        const res = await originalFetch.apply(this, arguments);
        const clone = res.clone();
        try {
            const data = await clone.json();
            const item = extractItem(data); // ✅ usa função robusta

            if (!item?.itemData) return res;

            let itemData = JSON.parse(item.itemData);
            const answers = [];
            let hasRadioOnly = true;

            for (const [key, w] of Object.entries(itemData.question.widgets)) {
                if (w.type === 'radio' && w.options?.choices) {
                    const choices = w.options.choices.map((c, i) => ({ ...c, id: c.id || `radio-choice-${i}` }));
                    const correct = choices.find(c => c.correct);
                    if (correct) answers.push({ type: 'radio', choiceId: correct.id, widgetKey: key });
                }
                else if (w.type === 'numeric-input' && w.options?.answers) {
                    hasRadioOnly = false;
                    const correct = w.options.answers.find(a => a.status === 'correct');
                    if (correct) {
                        const val = correct.answerForms?.some(f => f === 'proper' || f === 'improper')
                            ? toFraction(correct.value) : String(correct.value);
                        answers.push({ type: 'numeric', value: val, widgetKey: key });
                    }
                }
                else if (w.type === 'expression' && w.options?.answerForms) {
                    hasRadioOnly = false;
                    const correct = w.options.answerForms.find(f => f.considered === 'correct' || f.form === true);
                    if (correct) answers.push({ type: 'expression', value: correct.value, widgetKey: key });
                }
                else if (w.type === 'grapher' && w.options?.correct) {
                    hasRadioOnly = false;
                    const c = w.options.correct;
                    if (c.type && c.coords) answers.push({
                        type: 'grapher', graphType: c.type, coords: c.coords,
                        asymptote: c.asymptote || null, widgetKey: key
                    });
                }
            }

            if (answers.length > 0) {
                correctAnswers.set(item.id, answers);
                sendToast(`🔎 | ${answers.length} resposta(s) encontrada(s)!`, 750);

                const numericAnswers = answers.filter(a => a.type === 'numeric' || a.type === 'expression');
                if (numericAnswers.length > 0) autoFillNumericAnswers(numericAnswers);
            }

            // Substitui por radio simples apenas se for só radio
            if (itemData.question.content && hasRadioOnly && answers.length > 0) {
                itemData.answerArea = { calculator: false, chi2Table: false, periodicTable: false, tTable: false, zTable: false };
                itemData.question.content = "\n\nModificado por snts7kxx [[☃ radio 1]]";
                itemData.question.widgets = {
                    "radio 1": {
                        type: "radio", alignment: "default", static: false, graded: true,
                        options: {
                            choices: [{ content: "💜", correct: true, id: "correct-choice" }],
                            randomize: false, multipleSelect: false, displayCount: null, deselectEnabled: false
                        },
                        version: { major: 1, minor: 0 }
                    }
                };

                // ✅ Reconstrói a resposta respeitando a estrutura real (assessmentItemById ou outra)
                const modified = JSON.parse(JSON.stringify(data));
                if (modified.data?.assessmentItemById?.item) {
                    modified.data.assessmentItemById.item.itemData = JSON.stringify(itemData);
                } else if (modified.data) {
                    for (const key in modified.data) {
                        if (modified.data[key]?.item?.itemData !== undefined) {
                            modified.data[key].item.itemData = JSON.stringify(itemData);
                            break;
                        }
                    }
                }

                sendToast("🎉 | Questão substituída!", 1500);
                return new Response(JSON.stringify(modified), {
                    status: res.status,
                    statusText: res.statusText,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

        } catch (e) { console.error(`🚨 Error @ questionSpoof\n${e}`); }
        return res;
    }

    /* ══ AttemptProblem ══ */
    if (body?.includes('"operationName":"attemptProblem"')) {
        try {
            let bodyObj = JSON.parse(body);
            const itemId = bodyObj.variables?.input?.assessmentItemId;
            const answers = correctAnswers.get(itemId);

            if (answers?.length > 0) {
                const content = [], userInput = {};
                let state = bodyObj.variables.input.attemptState
                    ? JSON.parse(bodyObj.variables.input.attemptState) : null;

                answers.forEach(a => {
                    if (a.type === 'radio') {
                        content.push({ selectedChoiceIds: [a.choiceId] });
                        userInput[a.widgetKey] = { selectedChoiceIds: [a.choiceId] };
                    } else if (a.type === 'numeric') {
                        content.push({ currentValue: a.value });
                        userInput[a.widgetKey] = { currentValue: a.value };
                        if (state?.[a.widgetKey]) state[a.widgetKey].currentValue = a.value;
                    } else if (a.type === 'expression') {
                        content.push(a.value);
                        userInput[a.widgetKey] = a.value;
                        if (state?.[a.widgetKey]) state[a.widgetKey].value = a.value;
                    } else if (a.type === 'grapher') {
                        const graph = { type: a.graphType, coords: a.coords, asymptote: a.asymptote };
                        content.push(graph);
                        userInput[a.widgetKey] = graph;
                        if (state?.[a.widgetKey]) state[a.widgetKey].plot = graph;
                    }
                });

                bodyObj.variables.input.attemptContent = JSON.stringify([content, []]);
                bodyObj.variables.input.userInput = JSON.stringify(userInput);
                if (state) bodyObj.variables.input.attemptState = JSON.stringify(state);

                body = JSON.stringify(bodyObj);
                if (input instanceof Request) input = new Request(input, { body });
                else init.body = body;
                sendToast(`✏️ | ${answers.length} resposta(s) enviada(s)!`, 2000);
            }
        } catch (e) { console.error(`🚨 Error @ attemptProblem\n${e}`); }
    }

    /* ══ VideoSpoof ══ */
    if (body?.includes('"operationName":"updateUserVideoProgress"')) {
        try {
            let bodyObj = JSON.parse(body);
            if (bodyObj.variables?.input) {
                const dur = bodyObj.variables.input.durationSeconds;
                bodyObj.variables.input.secondsWatched = dur;
                bodyObj.variables.input.lastSecondWatched = dur;
                body = JSON.stringify(bodyObj);
                if (input instanceof Request) input = new Request(input, { body });
                else init.body = body;
                sendToast("🔄 | Vídeo concluído!", 1000);
            }
        } catch (e) { console.error(`🚨 Error @ videoSpoof\n${e}`); }
    }

    /* ══ MinuteFarm ══ */
    if (url.includes('mark_conversions')) {
        try {
            if (body?.includes('termination_event')) {
                sendToast("🚫 | Limite de Tempo Bloqueado!", 1200);
                return;
            }
        } catch (e) { console.error(`🚨 Error @ minuteFarm\n${e}`); }
    }

    return originalFetch.apply(this, arguments);
};

/* ══ Auto-fill numeric ══ */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function fillReactInput(el, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function autoFillNumericAnswers(answers) {
    const selectors = [
        '.perseus-widget-numeric-input input',
        '.perseus-widget-expression input',
        'input[type="text"].perseus-input',
        '.perseus-input',
        'input[type="text"]'
    ];
    for (const answer of answers) {
        let filled = false, attempts = 0;
        while (!filled && attempts < 25) {
            attempts++;
            await delay(300);
            for (const sel of selectors) {
                for (const inp of document.querySelectorAll(sel)) {
                    if (inp.offsetParent !== null && !inp.disabled && !inp.readOnly) {
                        inp.focus();
                        fillReactInput(inp, answer.value);
                        inp.blur();
                        sendToast(`✍️ | Preenchido: ${answer.value}`, 1200);
                        filled = true;
                        break;
                    }
                }
                if (filled) break;
            }
        }
    }
}

/* ══ Misc Styles ══ */
document.head.appendChild(Object.assign(document.createElement("style"),{innerHTML:"@font-face{font-family:'MuseoSans';src:url('https://corsproxy.io/?url=https://r2.e-z.host/4d0a0bea-60f8-44d6-9e74-3032a64a9f32/ynddewua.ttf')format('truetype')}" }));
document.head.appendChild(Object.assign(document.createElement('style'),{innerHTML:"::-webkit-scrollbar{width:8px}::-webkit-scrollbar-track{background:#fff}::-webkit-scrollbar-thumb{background:#888;border-radius:10px}::-webkit-scrollbar-thumb:hover{background:#555}"}));
document.head.appendChild(Object.assign(document.createElement('style'), {
    innerHTML: `
        @keyframes float{0%,100%{transform:translateY(0) translateX(0)}25%{transform:translateY(-100px) translateX(50px)}50%{transform:translateY(-50px) translateX(-50px)}75%{transform:translateY(-150px) translateX(30px)}}
        @keyframes slideUp{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes glow{0%,100%{text-shadow:0 0 30px #af00ff,0 0 60px #af00ff}50%{text-shadow:0 0 40px #af00ff,0 0 80px #af00ff,0 0 100px #af00ff}}
        @keyframes hexSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:.7}}
        @keyframes fadeInOut{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        .kd-splash-screen{position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#000 0%,#1a0033 50%,#000 100%);display:flex;align-items:center;justify-content:center;z-index:9999;opacity:0;transition:opacity 1s ease;user-select:none;font-family:MuseoSans,sans-serif}
        .kd-particles{position:absolute;width:100%;height:100%;overflow:hidden}
        .kd-particle{position:absolute;background:#af00ff;border-radius:50%;animation:float 15s infinite ease-in-out;opacity:.1}
        .kd-splash-content{position:relative;z-index:2;text-align:center;animation:slideUp .8s cubic-bezier(.22,1,.36,1)}
        .kd-logo-text{font-size:72px;font-weight:700;letter-spacing:4px;display:inline-block}
        .kd-logo-khan{color:#fff;text-shadow:0 0 20px rgba(255,255,255,.5)}
        .kd-logo-dark{color:#af00ff;text-shadow:0 0 30px #af00ff,0 0 60px #af00ff;animation:glow 2s ease-in-out infinite}
        .kd-divider{width:300px;height:2px;background:linear-gradient(90deg,transparent,#af00ff,transparent);margin:30px auto;position:relative}
        .kd-divider::before,.kd-divider::after{content:'';position:absolute;width:8px;height:8px;background:#af00ff;border-radius:50%;top:-3px;box-shadow:0 0 10px #af00ff}
        .kd-divider::before{left:0}.kd-divider::after{right:0}
        .kd-hexagon-loader{width:80px;height:80px;margin:0 auto;position:relative;display:flex;align-items:center;justify-content:center}
        .kd-hexagon{position:absolute;width:60px;height:60px;border:3px solid transparent;border-top-color:#af00ff;border-bottom-color:#af00ff;border-radius:10px;animation:hexSpin 2s linear infinite}
        .kd-hexagon:nth-child(2){width:45px;height:45px;border-top-color:#d966ff;border-bottom-color:#d966ff;animation-duration:1.5s;animation-direction:reverse}
        .kd-hexagon-core{width:20px;height:20px;background:#af00ff;border-radius:50%;box-shadow:0 0 20px #af00ff;animation:pulse 1.5s ease-in-out infinite}
        .kd-loading-text{color:#af00ff;font-size:18px;margin-top:20px;font-weight:500;letter-spacing:2px;animation:fadeInOut 2s ease-in-out infinite}
        .kd-progress-container{width:400px;margin:30px auto 20px;position:relative}
        .kd-progress-bar{width:100%;height:6px;background:rgba(175,0,255,.1);border-radius:10px;overflow:hidden;position:relative}
        .kd-progress-fill{height:100%;background:linear-gradient(90deg,#8b00cc,#af00ff,#d966ff,#af00ff);background-size:200% 100%;width:0%;transition:width .5s cubic-bezier(.22,1,.36,1);box-shadow:0 0 20px #af00ff;animation:shimmer 2s linear infinite;position:relative}
        .kd-progress-percent{text-align:center;color:rgba(255,255,255,.7);font-size:14px;margin-top:10px;font-weight:500}
        .kd-plugin-status{color:rgba(255,255,255,.5);font-size:13px;margin-top:20px;min-height:20px;letter-spacing:1px}
        .kd-version{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);color:rgba(175,0,255,.5);font-size:12px;letter-spacing:2px}
    `
}));

/* ══ Emitter ══ */
class EventEmitter{constructor(){this.events={}}on(t,e){"string"==typeof t&&(t=[t]),t.forEach(t=>{this.events[t]||(this.events[t]=[]),this.events[t].push(e)})}off(t,e){"string"==typeof t&&(t=[t]),t.forEach(t=>{this.events[t]&&(this.events[t]=this.events[t].filter(t=>t!==e))})}emit(t,...e){this.events[t]&&this.events[t].forEach(t=>{t(...e)})}once(t,e){"string"==typeof t&&(t=[t]);let s=(...i)=>{e(...i),this.off(t,s)};this.on(t,s)}};
const plppdo = new EventEmitter();
new MutationObserver((mutationsList) => { for (let mutation of mutationsList) if (mutation.type === 'childList') plppdo.emit('domChanged'); }).observe(document.body, { childList: true, subtree: true });

const findAndClickBySelector = selector => { const el = document.querySelector(selector); if (el) el.click(); };

async function showSplashScreen() {
    splashScreen.className = 'kd-splash-screen';
    const pc = document.createElement('div');
    pc.className = 'kd-particles';
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'kd-particle';
        p.style.cssText = `width:${Math.random()*5+2}px;height:${Math.random()*5+2}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*15}s;animation-duration:${Math.random()*10+10}s`;
        pc.appendChild(p);
    }
    splashScreen.innerHTML = `
        <div class="kd-splash-content">
            <div class="kd-logo-text"><span class="kd-logo-khan">KHAN</span><span class="kd-logo-dark">DARK</span></div>
            <div class="kd-divider"></div>
            <div style="margin:40px 0">
                <div class="kd-hexagon-loader">
                    <div class="kd-hexagon"></div><div class="kd-hexagon"></div><div class="kd-hexagon-core"></div>
                </div>
            </div>
            <div class="kd-loading-text" id="loadingText">INICIALIZANDO</div>
            <div class="kd-progress-container">
                <div class="kd-progress-bar"><div class="kd-progress-fill" id="progressFill"></div></div>
                <div class="kd-progress-percent" id="progressPercent">0%</div>
            </div>
            <div class="kd-plugin-status" id="pluginStatus">Preparando módulos...</div>
        </div>
        <div class="kd-version">v2.3 • SNTS7KXX</div>
    `;
    splashScreen.insertBefore(pc, splashScreen.firstChild);
    document.body.appendChild(splashScreen);
    setTimeout(() => splashScreen.style.opacity = '1', 10);
}

function updateLoadingProgress(percent, status) {
    const pf = document.getElementById('progressFill');
    const pp = document.getElementById('progressPercent');
    const ps = document.getElementById('pluginStatus');
    if (pf) pf.style.width = `${percent}%`;
    if (pp) pp.textContent = `${Math.floor(percent)}%`;
    if (ps) ps.textContent = status;
}

async function hideSplashScreen() {
    document.getElementById('loadingText').textContent = 'CONCLUÍDO';
    await delay(500);
    splashScreen.style.opacity = '0';
    setTimeout(() => splashScreen.remove(), 1000);
}

async function loadScript(url, label) {
    return fetch(url).then(r => r.text()).then(script => {
        loadedPlugins.push(label);
        eval(script);
        updateLoadingProgress((loadedPlugins.length / 3) * 100, `Carregado: ${label}`);
    });
}

async function loadCss(url) {
    return new Promise(resolve => {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.type = 'text/css'; link.href = url;
        link.onload = () => resolve();
        document.head.appendChild(link);
    });
}

function setupAutoClick() {
    const baseSelectors = [
        `.perseus_hm3uu-sq`,
        `[data-testid="exercise-check-answer"]`,
        `[data-testid="exercise-next-question"]`,
        `._1wi2tma4`
    ];
    let khanDarkDominates = true;
    (async () => {
        while (khanDarkDominates) {
            for (const q of baseSelectors) {
                findAndClickBySelector(q);
                const el = document.querySelector(q + "> div");
                if (el && el.innerText === "Mostrar resumo") sendToast("🎉 | Questão concluída!", 1500);
            }
            await delay(1900);
        }
    })();
}

/* ══ Inject ══ */
if (!/^https?:\/\/([a-z0-9-]+\.)?khanacademy\.org/.test(window.location.href)) {
    alert("❌ | KhanDark não iniciou!\n\nVocê precisa executar o Script na Plataforma Khan Academy! (https://pt.khanacademy.org/)");
    window.location.href = "https://pt.khanacademy.org/";
}

showSplashScreen();
updateLoadingProgress(0, 'Inicializando...');
const startTime = Date.now();

loadScript('https://cdn.jsdelivr.net/npm/darkreader@4.9.92/darkreader.min.js', 'DarkReader')
.then(() => {
    DarkReader.setFetchMethod(window.fetch);
    DarkReader.enable();
    updateLoadingProgress(33, 'DarkReader carregado');
})
.then(() => loadCss('https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css'))
.then(() => {
    updateLoadingProgress(66, 'Estilos carregados');
    return loadScript('https://cdn.jsdelivr.net/npm/toastify-js', 'Toastify');
})
.then(async () => {
    updateLoadingProgress(100, 'Finalizado!');
    flushToasts();
    const elapsed = Date.now() - startTime;
    await delay(Math.max(0, 3000 - elapsed));
    sendToast("💜 | KhanDark iniciou!");
    await delay(2000);
    hideSplashScreen();
    setupAutoClick();
    console.clear();
});
