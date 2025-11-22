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

    try {
      const clone = response.clone();
      const text = await clone.text();
      const responseObj = JSON.parse(text);

      if (responseObj?.data?.assessmentItem?.item?.itemData) {

        let itemData = JSON.parse(responseObj.data.assessmentItem.item.itemData);

        if (itemData?.question?.content != null) {

          // REMOVE answerArea
          delete itemData.answerArea;

          // LIMPA widgets/imagens e coloca conteúdo novo
          itemData.question.images = {};
          itemData.question.widgets = {};
          itemData.question.content = "Modificado por snts7kxx [[☃ radio 1]]";

          itemData.question.widgets = {
            "radio 1": {
              type: "radio",
              options: {
                choices: [
                  { content: "💜", correct: true }
                ]
              }
            }
          };

          responseObj.data.assessmentItem.item.itemData = JSON.stringify(itemData);
        }
      }

      return new Response(JSON.stringify(responseObj), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

    } catch (e) {
      return response;
    }
  };

  // AUTO CLICK
  (async () => {
    window.khandarkDominates = true;

    while (window.khandarkDominates) {

      let clicked = false;

      // Procura 💜
      for (const el of document.querySelectorAll("*")) {
        if (el.textContent.trim() === "💜" && el.offsetParent !== null) {
          el.click();
          clicked = true;
          await delay(800);
          break;
        }
      }

      if (!clicked) {
        const selectors = [
          'input[type="radio"]',
          '[role="radio"]',
          '[data-test-id="radio-option"]'
        ];

        for (const s of selectors) {
          const e = document.querySelector(s);
          if (e && e.offsetParent !== null) {
            e.click();
            clicked = true;
            await delay(800);
            break;
          }
        }
      }

      // Clicar em verificar / next
      for (const btn of document.querySelectorAll("button, [role=button]")) {

        const t = (btn.innerText || "").trim().toLowerCase();

        if (t.includes("pular") || t.includes("skip")) continue;

        const allowed = ["verificar", "próxima", "continuar", "check", "next", "enviar"]
          .some(x => t.includes(x));

        if (btn.offsetParent !== null && allowed) {
          btn.click();
          clicked = true;
          await delay(1200);
          break;
        }
      }

      await delay(clicked ? 800 : 1500);
    }
  })();
}

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

    DarkReader.setFetchMethod(window.fetch);
    DarkReader.enable();

    await delay(2000);
    await hideSplashScreen();
    setupMain();

    sendToast("💜 | Khan Teste iniciado!");
    console.clear();
  })();
}