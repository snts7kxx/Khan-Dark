javascript:(function(){
    // ── UI do painel ──
    const panel = document.createElement('div');
    panel.style.cssText = `
        position:fixed;top:10px;right:10px;width:320px;max-height:80vh;overflow-y:auto;
        background:#111;color:#eee;font-family:monospace;font-size:12px;
        border:2px solid #af00ff;border-radius:10px;padding:12px;z-index:99999;
    `;
    panel.innerHTML = `<b style="color:#af00ff;font-size:14px">🔍 KhanDark Diagnóstico</b><br><br>`;
    document.body.appendChild(panel);

    function log(msg, color='#eee') {
        const line = document.createElement('div');
        line.style.cssText = `color:${color};margin:2px 0;border-bottom:1px solid #222;padding:2px 0`;
        line.textContent = msg;
        panel.appendChild(line);
        panel.scrollTop = panel.scrollHeight;
    }

    function logOk(msg)   { log('✅ ' + msg, '#4cff91'); }
    function logErr(msg)  { log('❌ ' + msg, '#ff4c4c'); }
    function logWarn(msg) { log('⚠️ ' + msg, '#ffc84c'); }
    function logInfo(msg) { log('ℹ️ ' + msg, '#4cb8ff'); }

    // ── 1. Verifica URL ──
    logInfo('URL: ' + location.href.substring(0, 60));
    if (/khanacademy\.org/.test(location.href)) logOk('Está no Khan Academy');
    else logErr('NÃO está no Khan Academy!');

    // ── 2. Verifica se fetch foi interceptado antes ──
    const fetchStr = window.fetch.toString();
    if (fetchStr.includes('native code')) logWarn('fetch NÃO está interceptado (nenhum script rodou antes)');
    else logOk('fetch está interceptado');

    // ── 3. Verifica Toastify ──
    if (typeof Toastify !== 'undefined') logOk('Toastify carregado');
    else logWarn('Toastify NÃO carregado');

    // ── 4. Verifica DarkReader ──
    if (typeof DarkReader !== 'undefined') logOk('DarkReader carregado');
    else logWarn('DarkReader NÃO carregado');

    // ── 5. Inspeciona inputs na tela ──
    const allInputs = document.querySelectorAll('input[type="text"], textarea');
    logInfo(`Inputs de texto na tela: ${allInputs.length}`);
    allInputs.forEach((inp, i) => {
        logInfo(`  input[${i}] class="${inp.className.substring(0,40)}" val="${inp.value}"`);
    });

    // ── 6. Inspeciona elementos Perseus ──
    const perseusWidgets = document.querySelectorAll('[class*="perseus"]');
    logInfo(`Elementos Perseus no DOM: ${perseusWidgets.length}`);

    // ── 7. Intercepta fetch agora e monitora ──
    logInfo('── Monitorando fetch daqui pra frente ──');
    const origFetch = window.fetch;
    window.fetch = async function(input, init={}) {
        const url = (input instanceof Request ? input.url : input) || '';
        if (url.includes('getAssessmentItem')) {
            logOk('getAssessmentItem interceptado!');
            const res = await origFetch.apply(this, arguments);
            const clone = res.clone();
            try {
                const data = await clone.json();
                let item = null;
                if (data?.data) {
                    for (const k in data.data) {
                        if (data.data[k]?.item) { item = data.data[k].item; break; }
                    }
                }
                if (item?.itemData) {
                    const itemData = JSON.parse(item.itemData);
                    const widgets = Object.entries(itemData.question.widgets);
                    logOk(`itemData OK — ${widgets.length} widget(s)`);
                    widgets.forEach(([k, w]) => logInfo(`  widget: ${k} | type: ${w.type}`));
                    logInfo(`content início: "${(itemData.question.content||'').substring(0,50)}"`);
                } else {
                    logErr('item.itemData não encontrado na resposta');
                    logInfo('Estrutura: ' + JSON.stringify(Object.keys(data?.data||{})));
                }
            } catch(e) {
                logErr('Erro ao parsear resposta: ' + e.message);
            }
            return res;
        }
        if (url.includes('attemptProblem') || (init?.body||'').includes('attemptProblem')) {
            logWarn('attemptProblem disparado (resposta sendo enviada)');
        }
        return origFetch.apply(this, arguments);
    };

    // ── 8. Botão fechar ──
    const btn = document.createElement('button');
    btn.textContent = '✖ Fechar';
    btn.style.cssText = 'margin-top:10px;background:#af00ff;color:white;border:none;border-radius:5px;padding:5px 10px;cursor:pointer;width:100%';
    btn.onclick = () => panel.remove();
    panel.appendChild(btn);

    logInfo('Aguardando requisições...');
})();