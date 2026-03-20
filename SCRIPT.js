javascript:(function(){
    const panel = document.createElement('div');
    panel.style.cssText = `
        position:fixed;top:10px;left:5px;right:5px;max-height:85vh;overflow-y:auto;
        background:#111;color:#eee;font-family:monospace;font-size:11px;
        border:2px solid #af00ff;border-radius:10px;padding:12px;z-index:99999;
    `;
    panel.innerHTML = `<b style="color:#af00ff;font-size:13px">🔍 Diagnóstico v2</b><br><br>`;
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

    const origFetch = window.fetch;
    window.fetch = async function(input, init={}) {
        const url = (input instanceof Request ? input.url : input) || '';
        let body = input instanceof Request ? await input.clone().text() : (init?.body||'');

        if (url.includes('getAssessmentItem')) {
            logOk('getAssessmentItem capturado!');
            logInfo('URL: ' + url.substring(0,80));

            const res = await origFetch.apply(this, arguments);
            const clone = res.clone();

            try {
                const text = await clone.text();
                logInfo('Tamanho resposta: ' + text.length + ' chars');

                // Mostra os primeiros 800 chars do JSON bruto
                logInfo('JSON (primeiros 800 chars):');
                log(text.substring(0, 800), '#ffeb3b');

                // Tenta parsear e mostrar as chaves
                try {
                    const data = JSON.parse(text);
                    logOk('JSON parseado com sucesso');
                    logInfo('Chaves raiz: ' + JSON.stringify(Object.keys(data)));
                    if (data.data) {
                        logInfo('Chaves data: ' + JSON.stringify(Object.keys(data.data)));
                        // Navega em cada chave
                        for (const k in data.data) {
                            logInfo(`data.${k} keys: ` + JSON.stringify(Object.keys(data.data[k]||{})));
                            if (data.data[k]?.item) {
                                logOk(`Encontrou item em data.${k}.item!`);
                                logInfo('item keys: ' + JSON.stringify(Object.keys(data.data[k].item)));
                                if (data.data[k].item.itemData) {
                                    logOk('itemData encontrado!');
                                    const itemData = JSON.parse(data.data[k].item.itemData);
                                    logInfo('widgets: ' + JSON.stringify(Object.keys(itemData.question?.widgets||{})));
                                    for (const [wk, wv] of Object.entries(itemData.question?.widgets||{})) {
                                        logInfo(`  ${wk} → type: ${wv.type}`);
                                    }
                                } else {
                                    logErr('item existe mas itemData é undefined/null');
                                    logInfo('item completo: ' + JSON.stringify(data.data[k].item).substring(0,300));
                                }
                            }
                        }
                    }
                } catch(pe) {
                    logErr('Erro ao parsear JSON: ' + pe.message);
                }

            } catch(e) {
                logErr('Erro ao ler resposta: ' + e.message);
            }

            return res;
        }

        return origFetch.apply(this, arguments);
    };

    const btn = document.createElement('button');
    btn.textContent = '✖ Fechar';
    btn.style.cssText = 'margin-top:10px;background:#af00ff;color:white;border:none;border-radius:5px;padding:6px 10px;cursor:pointer;width:100%';
    btn.onclick = () => panel.remove();
    panel.appendChild(btn);

    logInfo('Aguardando getAssessmentItem...');
    logInfo('Navegue para uma questão agora!');
})();