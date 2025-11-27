let loadedPlugins = [];

/* Element(s?) */
const splashScreen = document.createElement('div');

/* Misc Styles */
document.head.appendChild(Object.assign(document.createElement("style"),{innerHTML:"@font-face{font-family:'MuseoSans';src:url('https://corsproxy.io/?url=https://r2.e-z.host/4d0a0bea-60f8-44d6-9e74-3032a64a9f32/ynddewua.ttf')format('truetype')}" }));
document.head.appendChild(Object.assign(document.createElement('style'),{innerHTML:"::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #ffffff; } ::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; } ::-webkit-scrollbar-thumb:hover { background: #555; }"}));

/* Splash Screen Styles - VERSÃO MELHORADA */
document.head.appendChild(Object.assign(document.createElement('style'), {
    innerHTML: `
        @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-100px) translateX(50px); }
            50% { transform: translateY(-50px) translateX(-50px); }
            75% { transform: translateY(-150px) translateX(30px); }
        }
        
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes glow {
            0%, 100% { text-shadow: 0 0 30px #af00ff, 0 0 60px #af00ff; }
            50% { text-shadow: 0 0 40px #af00ff, 0 0 80px #af00ff, 0 0 100px #af00ff; }
        }
        
        @keyframes hexSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
        }
        
        @keyframes fadeInOut {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
        
        .kd-splash-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #000000 0%, #1a0033 50%, #000000 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 1s ease;
            user-select: none;
            font-family: MuseoSans, sans-serif;
        }
        
        .kd-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        
        .kd-particle {
            position: absolute;
            background: #af00ff;
            border-radius: 50%;
            animation: float 15s infinite ease-in-out;
            opacity: 0.1;
        }
        
        .kd-splash-content {
            position: relative;
            z-index: 2;
            text-align: center;
            animation: slideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        
        .kd-logo-container {
            position: relative;
            margin-bottom: 40px;
        }
        
        .kd-logo-text {
            font-size: 72px;
            font-weight: bold;
            letter-spacing: 4px;
            position: relative;
            display: inline-block;
        }
        
        .kd-logo-khan {
            color: white;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }
        
        .kd-logo-dark {
            color: #af00ff;
            text-shadow: 0 0 30px #af00ff, 0 0 60px #af00ff;
            animation: glow 2s ease-in-out infinite;
        }
        
        .kd-divider {
            width: 300px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #af00ff, transparent);
            margin: 30px auto;
            position: relative;
        }
        
        .kd-divider::before,
        .kd-divider::after {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
            background: #af00ff;
            border-radius: 50%;
            top: -3px;
            box-shadow: 0 0 10px #af00ff;
        }
        
        .kd-divider::before { left: 0; }
        .kd-divider::after { right: 0; }
        
        .kd-loader-container {
            margin: 40px 0;
        }
        
        .kd-hexagon-loader {
            width: 80px;
            height: 80px;
            margin: 0 auto;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .kd-hexagon {
            position: absolute;
            width: 60px;
            height: 60px;
            border: 3px solid transparent;
            border-top-color: #af00ff;
            border-bottom-color: #af00ff;
            border-radius: 10px;
            animation: hexSpin 2s linear infinite;
        }
        
        .kd-hexagon:nth-child(2) {
            width: 45px;
            height: 45px;
            border-top-color: #d966ff;
            border-bottom-color: #d966ff;
            animation-duration: 1.5s;
            animation-direction: reverse;
        }
        
        .kd-hexagon-core {
            width: 20px;
            height: 20px;
            background: #af00ff;
            border-radius: 50%;
            box-shadow: 0 0 20px #af00ff;
            animation: pulse 1.5s ease-in-out infinite;
        }
        
        .kd-loading-text {
            color: #af00ff;
            font-size: 18px;
            margin-top: 20px;
            font-weight: 500;
            letter-spacing: 2px;
            animation: fadeInOut 2s ease-in-out infinite;
        }
        
        .kd-progress-container {
            width: 400px;
            margin: 30px auto 20px;
            position: relative;
        }
        
        .kd-progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(175, 0, 255, 0.1);
            border-radius: 10px;
            overflow: hidden;
            position: relative;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
        }
        
        .kd-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #8b00cc, #af00ff, #d966ff, #af00ff);
            background-size: 200% 100%;
            width: 0%;
            transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
            box-shadow: 0 0 20px #af00ff;
            animation: shimmer 2s linear infinite;
            position: relative;
        }
        
        .kd-progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            animation: slide 1.5s infinite;
        }
        
        .kd-progress-percent {
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            margin-top: 10px;
            font-weight: 500;
        }
        
        .kd-plugin-status {
            color: rgba(255, 255, 255, 0.5);
            font-size: 13px;
            margin-top: 20px;
            min-height: 20px;
            letter-spacing: 1px;
        }
        
        .kd-version {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(175, 0, 255, 0.5);
            font-size: 12px;
            letter-spacing: 2px;
        }
    `
}));

/* Emmiter */
class EventEmitter{constructor(){this.events={}}on(t,e){"string"==typeof t&&(t=[t]),t.forEach(t=>{this.events[t]||(this.events[t]=[]),this.events[t].push(e)})}off(t,e){"string"==typeof t&&(t=[t]),t.forEach(t=>{this.events[t]&&(this.events[t]=this.events[t].filter(t=>t!==e))})}emit(t,...e){this.events[t]&&this.events[t].forEach(t=>{t(...e)})}once(t,e){"string"==typeof t&&(t=[t]);let s=(...i)=>{e(...i),this.off(t,s)};this.on(t,s)}};
const plppdo = new EventEmitter();

new MutationObserver((mutationsList) => { for (let mutation of mutationsList) if (mutation.type === 'childList') plppdo.emit('domChanged'); }).observe(document.body, { childList: true, subtree: true });

/* Misc Functions */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const findAndClickBySelector = selector => { const element = document.querySelector(selector); if (element) { element.click(); } };

function sendToast(text, duration=5000, gravity='bottom') { Toastify({ text: text, duration: duration, gravity: gravity, position: "center", stopOnFocus: true, style: { background: "#000000" } }).showToast(); };

async function showSplashScreen() { 
    splashScreen.className = 'kd-splash-screen';
    
    // Criar partículas
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'kd-particles';
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'kd-particle';
        particle.style.width = Math.random() * 5 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = Math.random() * 10 + 10 + 's';
        particlesContainer.appendChild(particle);
    }

    splashScreen.innerHTML = `
        <div class="kd-splash-content">
            <div class="kd-logo-container">
                <div class="kd-logo-text">
                    <span class="kd-logo-khan">KHAN</span><span class="kd-logo-dark">DARK</span>
                </div>
            </div>

            <div class="kd-divider"></div>

            <div class="kd-loader-container">
                <div class="kd-hexagon-loader">
                    <div class="kd-hexagon"></div>
                    <div class="kd-hexagon"></div>
                    <div class="kd-hexagon-core"></div>
                </div>
            </div>

            <div class="kd-loading-text" id="loadingText">INICIALIZANDO</div>

            <div class="kd-progress-container">
                <div class="kd-progress-bar">
                    <div class="kd-progress-fill" id="progressFill"></div>
                </div>
                <div class="kd-progress-percent" id="progressPercent">0%</div>
            </div>

            <div class="kd-plugin-status" id="pluginStatus">Preparando módulos...</div>
        </div>

        <div class="kd-version">v2.0 • SNTS7KXX</div>
    `; 
    
    splashScreen.insertBefore(particlesContainer, splashScreen.firstChild);
    document.body.appendChild(splashScreen); 
    setTimeout(() => splashScreen.style.opacity = '1', 10);
}

function updateLoadingProgress(percent, status) {
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const pluginStatus = document.getElementById('pluginStatus');

    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressPercent) progressPercent.textContent = `${Math.floor(percent)}%`;
    if (pluginStatus) pluginStatus.textContent = status;
}

async function hideSplashScreen() { 
    document.getElementById('loadingText').textContent = 'CONCLUÍDO';
    await delay(500);
    splashScreen.style.opacity = '0'; 
    setTimeout(() => splashScreen.remove(), 1000); 
}

async function loadScript(url, label) { 
    return fetch(url).then(response => response.text()).then(script => { 
        loadedPlugins.push(label); 
        eval(script);
        updateLoadingProgress((loadedPlugins.length / 3) * 100, `Carregado: ${label}`);
    }); 
}

async function loadCss(url) { 
    return new Promise((resolve) => { 
        const link = document.createElement('link'); 
        link.rel = 'stylesheet'; 
        link.type = 'text/css'; 
        link.href = url; 
        link.onload = () => resolve(); 
        document.head.appendChild(link); 
    }); 
}

/* Main Functions */ 
function setupMain(){
    /* QuestionSpoof */
    (function () {
        const originalFetch = window.fetch;
        const correctAnswers = new Map();

        const toFraction = (d) => { if (d === 0 || d === 1) return String(d); const decimals = (String(d).split('.')[1] || '').length; let num = Math.round(d * Math.pow(10, decimals)), den = Math.pow(10, decimals); const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; }; const div = gcd(Math.abs(num), Math.abs(den)); return den / div === 1 ? String(num / div) : `${num / div}/${den / div}`; };

        window.fetch = async function(input, init) {
            const url = input instanceof Request ? input.url : input;
            let body = input instanceof Request ? await input.clone().text() : init?.body;

            if (url.includes('getAssessmentItem') && body) {
                const res = await originalFetch.apply(this, arguments);
                const clone = res.clone();

                try {
                    const data = await clone.json();

                    let item = null;
                    if (data?.data) {
                        for (const key in data.data) {
                            if (data.data[key]?.item) {
                                item = data.data[key].item;
                                break;
                            }
                        }
                    }

                    if (!item?.itemData) return res;

                    let itemData = JSON.parse(item.itemData);
                    const answers = [];

                    for (const [key, w] of Object.entries(itemData.question.widgets)) {
                        if (w.type === 'radio' && w.options?.choices) {
                            const choices = w.options.choices.map((c, i) => ({ ...c, id: c.id || `radio-choice-${i}` }));
                            const correct = choices.find(c => c.correct);
                            if (correct) answers.push({ type: 'radio', choiceId: correct.id, widgetKey: key });
                        }
                        else if (w.type === 'numeric-input' && w.options?.answers) {
                            const correct = w.options.answers.find(a => a.status === 'correct');
                            if (correct) {
                                const val = correct.answerForms?.some(f => f === 'proper' || f === 'improper') 
                                    ? toFraction(correct.value) : String(correct.value);
                                answers.push({ type: 'numeric', value: val, widgetKey: key });
                            }
                        }
                        else if (w.type === 'expression' && w.options?.answerForms) {
                            const correct = w.options.answerForms.find(f => f.considered === 'correct' || f.form === true);
                            if (correct) answers.push({ type: 'expression', value: correct.value, widgetKey: key });
                        }
                        else if (w.type === 'grapher' && w.options?.correct) {
                            const c = w.options.correct;
                            if (c.type && c.coords) answers.push({ 
                                type: 'grapher', graphType: c.type, coords: c.coords, 
                                asymptote: c.asymptote || null, widgetKey: key 
                            });
                        }
                    }

                    if (answers.length > 0) {
                        correctAnswers.set(item.id, answers);
                        sendToast(`🔎 | ${answers.length} respostas encontradas!`, 750);
                    }

                    if (itemData.question.content?.[0] === itemData.question.content[0].toUpperCase()) {
                        itemData.answerArea = { calculator: false, chi2Table: false, periodicTable: false, tTable: false, zTable: false };
                        itemData.question.content = "\n\nModificado por snts7kxx" + `[[☃ radio 1]]`;
                        itemData.question.widgets = {
                            "radio 1": {
                                type: "radio", alignment: "default", static: false, graded: true,
                                options: {
                                    choices: [
                                        { content: "💜", correct: true, id: "correct-choice" }
                                    ],
                                    randomize: false, multipleSelect: false, displayCount: null, deselectEnabled: false
                                },
                                version: { major: 1, minor: 0 }
                            }
                        };

                        const modified = { ...data };

                        if (modified.data) {
                            for (const key in modified.data) {
                                if (modified.data[key]?.item?.itemData) {
                                    modified.data[key].item.itemData = JSON.stringify(itemData);
                                    break;
                                }
                            }
                        }

                        sendToast("🎉 | Questão concluída!", 1500);
                        return new Response(JSON.stringify(modified), { 
                            status: res.status, statusText: res.statusText, headers: res.headers 
                        });
                    }
                } catch (e) { console.error(`🚨 Error @ questionSpoof.js\n${e}`); }
                return res;
            }

            if (body?.includes('"operationName":"attemptProblem"')) {
                try {
                    let bodyObj = JSON.parse(body);
                    const itemId = bodyObj.variables?.input?.assessmentItemId;
                    const answers = correctAnswers.get(itemId);

                    if (answers?.length > 0) {
                        const content = [], userInput = {};
                        let state = bodyObj.variables.input.attemptState ? JSON.parse(bodyObj.variables.input.attemptState) : null;

                        answers.forEach(a => {
                            if (a.type === 'radio') {
                                content.push({ selectedChoiceIds: [a.choiceId] });
                                userInput[a.widgetKey] = { selectedChoiceIds: [a.choiceId] };
                            }
                            else if (a.type === 'numeric') {
                                content.push({ currentValue: a.value });
                                userInput[a.widgetKey] = { currentValue: a.value };
                                if (state?.[a.widgetKey]) state[a.widgetKey].currentValue = a.value;
                            }
                            else if (a.type === 'expression') {
                                content.push(a.value);
                                userInput[a.widgetKey] = a.value;
                                if (state?.[a.widgetKey]) state[a.widgetKey].value = a.value;
                            }
                            else if (a.type === 'grapher') {
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
                        sendToast(`✏️ | ${answers.length} respostas marcadas!`, 2000);
                    }
                } catch (e) { console.error(`🚨 Error @ questionSpoof.js\n${e}`); }
            }

            return originalFetch.apply(this, arguments);
        };
    })();

    /* VideoSpoof */
    (function () {
        const originalFetch = window.fetch;

        window.fetch = async function (input, init) {
            let body;
            if (input instanceof Request) body = await input.clone().text();
            else if (init && init.body) body = init.body;
            if (body && body.includes('"operationName":"updateUserVideoProgress"')) {
                try {
                    let bodyObj = JSON.parse(body);
                    if (bodyObj.variables && bodyObj.variables.input) {
                        const durationSeconds = bodyObj.variables.input.durationSeconds;
                        bodyObj.variables.input.secondsWatched = durationSeconds;
                        bodyObj.variables.input.lastSecondWatched = durationSeconds;
                        body = JSON.stringify(bodyObj);
                        if (input instanceof Request) { input = new Request(input, { body: body }); } 
                        else init.body = body; 
                        sendToast("🔄 | Vídeo concluído!", 1250)
                    }
                } catch (e) { console.error(`🚨 Error @ videoSpoof.js\n${e}`); }
            }
            return originalFetch.apply(this, arguments);
        };
    })();

    /* MinuteFarm */
    (function () {
        const originalFetch = window.fetch;

        window.fetch = async function (input, init = {}) {
            let body;
            if (input instanceof Request) body = await input.clone().text();
            else if (init.body) body = init.body;
            if (body && input.url.includes("mark_conversions")) {
                try {
                    if (body.includes("termination_event")) { sendToast("🚫 | Limite de Tempo Bloqueado!", 1200); return; }
                } catch (e) { console.error(`🚨 Error @ minuteFarm.js\n${e}`); }
            }
            return originalFetch.apply(this, arguments);
        };
    })();

    /* AutoAnswer */
    (function () {
        const baseSelectors = [
            `.perseus_hm3uu-sq`,
            `[data-testid="exercise-check-answer"]`, 
            `[data-testid="exercise-next-question"]`, 
            `._1wi2tma4`
        ];

        khanDarkDominates = true;

        (async () => { 
            while (khanDarkDominates) {                    
                const selectorsToCheck = [...baseSelectors];

                for (const q of selectorsToCheck) {
                    findAndClickBySelector(q);
                    if (document.querySelector(q+"> div") && document.querySelector(q+"> div").innerText === "Mostrar resumo") {
                        sendToast("🎉 | Questão concluída!", 1500);
                    }
                }
                await delay(2200);
            }
        })();
    })();
}

/* Inject */
if (!/^https?:\/\/([a-z0-9-]+\.)?khanacademy\.org/.test(window.location.href)) { 
    alert("❌ | KhanDark não iniciou!\n\nVocê precisa executar o Script na Plataforma Khan Academy! (https://pt.khanacademy.org/)"); 
    window.location.href = "https://pt.khanacademy.org/"; 
}

showSplashScreen();
updateLoadingProgress(0, 'Inicializando...');

const startTime = Date.now();

loadScript('https://cdn.jsdelivr.net/npm/darkreader@4.9.92/darkreader.min.js', 'DarkReader')
.then(()=>{ 
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

    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, 3000 - elapsedTime);
    await delay(remainingTime);

    sendToast("💜 | KhanDark iniciou!");
    sendToast("Entre no nosso Discord!");

    await delay(2000);

    hideSplashScreen();
    setupMain();

    console.clear();
});