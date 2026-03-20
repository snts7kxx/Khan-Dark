javascript:(function(){
    const panel = document.createElement('div');
    panel.style.cssText = `
        position:fixed;top:10px;left:5px;right:5px;max-height:85vh;overflow-y:auto;
        background:#111;color:#eee;font-family:monospace;font-size:11px;
        border:2px solid #00aaff;border-radius:10px;padding:12px;z-index:99999;
    `;
    panel.innerHTML = `<b style="color:#00aaff;font-size:13px">🔍 Sala do Futuro — Diagnóstico</b><br><br>`;
    document.body.appendChild(panel);

    function log(msg, color='#eee') {
        const line = document.createElement('div');
        line.style.cssText = `color:${color};margin:2px 0;border-bottom:1px solid #222;padding:3px 0;word-break:break-all`;
        line.textContent = msg;
        panel.appendChild(line);
        panel.scrollTop = panel.scrollHeight;
    }

    function logOk(msg)   { log('✅ ' + msg, '#4cff91'); }
    function logErr(msg)  { log('❌ ' + msg, '#ff4c4c'); }
    function logInfo(msg) { log('ℹ️ ' + msg, '#4cb8ff'); }
    function logWarn(msg) { log('⚠️ ' + msg, '#ffc84c'); }
    function logJson(msg) { log(msg, '#ffeb3b'); }

    // ── 1. Info básica ──
    logInfo('URL: ' + location.href);
    logInfo('Título: ' + document.title);

    // ── 2. Cookies e localStorage ──
    logInfo('Cookies: ' + document.cookie.substring(0, 200));
    try {
        const keys = Object.keys(localStorage);
        logInfo('localStorage keys: ' + JSON.stringify(keys));
        keys.forEach(k => logInfo(`  ${k}: ${String(localStorage.getItem(k)).substring(0,100)}`));
    } catch(e) { logErr('localStorage bloqueado'); }

    // ── 3. Elementos de tarefa no DOM ──
    const possibleSelectors = [
        '[class*="task"]', '[class*="tarefa"]', '[class*="atividade"]',
        '[class*="activity"]', '[class*="homework"]', '[class*="assignment"]',
        'button', 'a[href*="tarefa"]', 'a[href*="atividade"]',
        '[data-task]', '[data-activity]'
    ];
    possibleSelectors.forEach(sel => {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) logOk(`Seletor "${sel}": ${els.length} elemento(s)`);
    });

    // ── 4. Intercepta TODOS os fetch ──
    logInfo('── Monitorando todas as requisições ──');
    const origFetch = window.fetch;
    window.fetch = async function(input, init={}) {
        const url = (input instanceof Request ? input.url : input) || '';
        const method = init?.method || (input instanceof Request ? input.method : 'GET');
        let body = '';
        try { body = input instanceof Request ? await input.clone().text() : (init?.body||''); } catch(e){}

        // Loga toda requisição
        logInfo(`${method} → ${url.substring(0,100)}`);
        if (body) logJson('  body: ' + String(body).substring(0,200));

        const res = await origFetch.apply(this, arguments);
        const clone = res.clone();

        try {
            const text = await clone.text();
            // Só mostra resposta se parecer relevante (tarefa, atividade, etc)
            const lower = url.toLowerCase() + text.toLowerCase();
            if (lower.includes('tarefa') || lower.includes('atividade') || 
                lower.includes('task') || lower.includes('activity') ||
                lower.includes('homework') || lower.includes('conclu') ||
                lower.includes('done') || lower.includes('complete')) {
                logOk('Resposta relevante encontrada!');
                logJson('URL: ' + url.substring(0,100));
                logJson('Resposta (500 chars): ' + text.substring(0,500));
            }
        } catch(e) {}

        return res;
    };

    // ── 5. Intercepta XMLHttpRequest também ──
    const origXHR = window.XMLHttpRequest;
    const OrigXHRProto = origXHR.prototype;
    const origOpen = OrigXHRProto.open;
    const origSend = OrigXHRProto.send;

    OrigXHRProto.open = function(method, url) {
        this._url = url;
        this._method = method;
        return origOpen.apply(this, arguments);
    };

    OrigXHRProto.send = function(body) {
        const url = this._url || '';
        logWarn(`XHR ${this._method} → ${String(url).substring(0,100)}`);
        if (body) logJson('  XHR body: ' + String(body).substring(0,200));

        this.addEventListener('load', function() {
            const lower = (url + this.responseText).toLowerCase();
            if (lower.includes('tarefa') || lower.includes('atividade') ||
                lower.includes('task') || lower.includes('conclu') ||
                lower.includes('done') || lower.includes('complete')) {
                logOk('XHR relevante!');
                logJson('URL: ' + String(url).substring(0,100));
                logJson('Resposta: ' + this.responseText.substring(0,500));
            }
        });
        return origSend.apply(this, arguments);
    };

    // ── Botão fechar ──
    const btn = document.createElement('button');
    btn.textContent = '✖ Fechar';
    btn.style.cssText = 'margin-top:10px;background:#00aaff;color:white;border:none;border-radius:5px;padding:6px 10px;cursor:pointer;width:100%';
    btn.onclick = () => panel.remove();
    panel.appendChild(btn);

    logInfo('Navegue pelo site e interaja com as tarefas!');
    logInfo('As requisições vão aparecer aqui em tempo real.');
})();