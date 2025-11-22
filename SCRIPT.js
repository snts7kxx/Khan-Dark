let loadedPlugins = [];

console.clear();
const noop = () => {};
console.warn = console.error = window.debug = noop;

const splashScreen = document.createElement('splashScreen');

class EventEmitter {
  constructor() { this.events = {}; }
  on(t, e) { (Array.isArray(t) ? t : [t]).forEach(x => (this.events[x] = this.events[x] || []).push(e)); }
  off(t, e) { (Array.isArray(t) ? t : [t]).forEach(x => this.events[x] = (this.events[x] || []).filter(h => h !== e)); }
  emit(t, ...e) { this.events[t]?.forEach(h => h(...e)); }
  once(t, e) { const s = (...i) => { e(...i); this.off(t, s); }; this.on(t, s); }
}

const plppdo = new EventEmitter();

new MutationObserver(m => m.some(x => x.type === 'childList') && plppdo.emit('domChanged'))
  .observe(document.body, { childList: true, subtree: true });

const delay = ms => new Promise(r => setTimeout(r, ms));

function sendToast(text, duration = 5000) {
  Toastify({
    text,
    duration,
    gravity: "bottom",
    position: "center",
    stopOnFocus: true,
    style: { background: "#000000" }
  }).showToast();
}

async function showSplashScreen() {
  splashScreen.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;z-index:9999;opacity:0;transition:opacity 1.5s;";
  splashScreen.innerHTML =
    '<span style="color:white;text-shadow:0 0 0.5px #fff;"><strong>KHAN</strong><span style="color:#af00ff;text-shadow:0 0 0.5px #fff;"><strong>DARK</strong>';
  document.body.appendChild(splashScreen);
  setTimeout(() => splashScreen.style.opacity = "1", 20);
}

async function hideSplashScreen() {
  splashScreen.style.opacity = "0";
  setTimeout(() => splashScreen.remove(), 1500);
}

async function loadScript(url, label) {
  const res = await fetch(url);
  const txt = await res.text();
  loadedPlugins.push(label);
  eval(txt);
}

async function loadCss(url) {
  return new Promise(res => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = url;
    l.onload = res;
    document.head.appendChild(l);
  });
}

function setupMain() {
  const originalFetch = window.fetch;

  window.fetch = async function (input, init) {
    let body;
    if (input instanceof Request) body = await input.clone().text();
    else if (init?.body) body = init.body;

    // AUTO COMPLETE VIDEO
    if (body?.includes('"operationName":"updateUserVideoProgress"')) {
      try {
        let b = JSON.parse(body);
        if (b.variables?.input) {
          const d = b.variables.input.durationSeconds;
          b.variables.input.secondsWatched = d;
          b.variables.input.lastSecondWatched = d;
          body = JSON.stringify(b);

          if (input instanceof Request) input = new Request(input, { body });
          else init.body = body;

          sendToast("🔄 | Vídeo concluído!", 2500);
        }
      } catch {}
    }

    const response = await originalFetch.apply(this, arguments);

    // MODIFICAR QUESTÕES
    try {
      const clone = response.clone();
      const text = await clone.text();
      
      if (!text.trim().startsWith('{')) return response;
      
      const responseObj = JSON.parse(text);

      // Busca itemData em múltiplos lugares
      let itemDataRaw = null;
      let parentObj = null;
      let dataKey = null;

      const paths = [
        { parent: responseObj?.data?.assessmentItem?.item, key: 'itemData' },
        { parent: responseObj?.data?.assessmentItem?.item?.stack, key: 'itemData' },
        { parent: responseObj?.data?.assessmentItem?.item, key: 'itemTemplate' }
      ];

      for (const { parent, key } of paths) {
        if (parent && parent[key]) {
          itemDataRaw = parent[key];
          parentObj = parent;
          dataKey = key;
          break;
        }
      }

      if (!itemDataRaw) return response;

      // Parse (pode estar stringificado múltiplas vezes)
      let itemData = itemDataRaw;
      let parseCount = 0;
      
      while (typeof itemData === "string" && parseCount < 3) {
        try {
          itemData = JSON.parse(itemData);
          parseCount++;
        } catch {
          return response;
        }
      }

      // Se tem pergunta, modifica
      if (itemData?.question?.content != null) {
        
        // Desabilita answerArea
        itemData.answerArea = {
          calculator: false,
          chi2Table: false,
          periodicTable: false,
          tTable: false,
          zTable: false
        };

        // Modifica conteúdo mantendo imagens originais
        itemData.question.content = "💜 Modificado [[☃ radio 1]]";
        
        itemData.question.widgets = {
          "radio 1": {
            type: "radio",
            options: {
              choices: [
                { content: "💜 Resposta Correta", correct: true }
              ],
              randomize: false
            }
          }
        };

        // Stringifica de volta (mesmo número de vezes)
        let finalData = itemData;
        for (let i = 0; i < parseCount; i++) {
          finalData = JSON.stringify(finalData);
        }
        
        parentObj[dataKey] = finalData;

        console.log("✅ Questão modificada!");
        sendToast("✅ | Questão modificada!", 1500);

        return new Response(JSON.stringify(responseObj), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }

    } catch (e) {
      console.error("❌ Erro:", e);
    }

    return response;
  };

  // AUTO CLICK
  (async () => {
    window.khandarkDominates = true;

    while (window.khandarkDominates) {
      let clicked = false;

      // 1. Procura 💜
      for (const el of document.querySelectorAll("*")) {
        const txt = el.textContent?.trim();
        if (txt && (txt === "💜" || txt.includes("💜 Resposta Correta")) && el.offsetParent) {
          console.log("💜 Clicando...");
          el.click();
          clicked = true;
          await delay(800);
          break;
        }
      }

      // 2. Radios normais
      if (!clicked) {
        const selectors = ['input[type="radio"]', '[role="radio"]', '[data-test-id="radio-option"]'];
        for (const s of selectors) {
          const e = document.querySelector(s);
          if (e?.offsetParent) {
            console.log("📻 Radio clicado");
            e.click();
            clicked = true;
            await delay(800);
            break;
          }
        }
      }

      // 3. Botões
      for (const btn of document.querySelectorAll("button, [role=button]")) {
        const t = (btn.innerText || "").trim().toLowerCase();
        
        if (t.includes("pular") || t.includes("skip")) continue;

        const allowed = ["verificar", "próxima", "continuar", "check", "next", "enviar", "conferir"]
          .some(x => t.includes(x));

        if (btn.offsetParent && allowed) {
          console.log("🔘 Botão:", t);
          btn.click();
          clicked = true;
          
          if (t.includes("resumo")) sendToast("🎉 | Concluído!", 2000);
          
          await delay(1200);
          break;
        }
      }

      await delay(clicked ? 800 : 1500);
    }
  })();
}

// INIT
if (!/khanacademy\.org/.test(location.href)) {
  location.href = "https://pt.khanacademy.org/";
} else {
  (async () => {
    await showSplashScreen();

    await Promise.all([
      loadScript("https://cdn.jsdelivr.net/npm/darkreader@4.9.92/darkreader.min.js", "dark"),
      loadCss("https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css"),
      loadScript("https://cdn.jsdelivr.net/npm/toastify-js", "toast")
    ]);

    await delay(2000);
    await hideSplashScreen();
    
    // IMPORTANTE: setupMain ANTES do DarkReader
    setupMain();
    
    DarkReader.setFetchMethod(window.fetch);
    DarkReader.enable();

    sendToast("💜 | Khan Dark Ativado!");
    console.log("🚀 Pronto! Aguardando questões...");
  })();
}