let loadedPlugins = [];

console.clear();
const noop = () => {};
console.warn = console.error = window.debug = noop;

const splashScreen = document.createElement('splashScreen');

class EventEmitter {
  constructor() { this.events = {}; }
  on(t, e) {
    (Array.isArray(t) ? t : [t]).forEach(t => {
      (this.events[t] = this.events[t] || []).push(e);
    });
  }
  off(t, e) {
    (Array.isArray(t) ? t : [t]).forEach(t => {
      this.events[t] && (this.events[t] = this.events[t].filter(h => h !== e));
    });
  }
  emit(t, ...e) {
    this.events[t]?.forEach(h => h(...e));
  }
  once(t, e) {
    const s = (...i) => {
      e(...i);
      this.off(t, s);
    };
    this.on(t, s);
  }
}

const plppdo = new EventEmitter();

new MutationObserver(mutationsList => 
  mutationsList.some(m => m.type === 'childList') && plppdo.emit('domChanged')
).observe(document.body, { childList: true, subtree: true });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function sendToast(text, duration = 5000, gravity = 'bottom') {
  Toastify({
    text,
    duration,
    gravity,
    position: "center",
    stopOnFocus: true,
    style: { background: "#000000" }
  }).showToast();
}

async function showSplashScreen() {
  splashScreen.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;background-color:#000;display:flex;align-items:center;justify-content:center;z-index:9999;opacity:0;transition:opacity 1.5s ease;user-select:none;color:white;font-family:MuseoSans,sans-serif;font-size:35px;text-align:center;";
  splashScreen.innerHTML =
    '<span style="color:white;text-shadow: 0 0 0.5px rgba(255,255,255,1);"><strong>KHAN</strong><span style="color:#af00ff;text-shadow: 0 0 0.5px rgba(255,255,255,1);"><strong>DARK</strong>';
  document.body.appendChild(splashScreen);
  setTimeout(() => (splashScreen.style.opacity = "1"), 10);
}

async function hideSplashScreen() {
  splashScreen.style.opacity = "1";
  setTimeout(() => splashScreen.remove(), 2300);
}

async function loadScript(url, label) {
  const response = await fetch(url);
  const script = await response.text();
  loadedPlugins.push(label);
  eval(script);
}

async function loadCss(url) {
  return new Promise(resolve => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = url;
    link.onload = resolve;
    document.head.appendChild(link);
  });
}

function setupMain() {
  const originalFetch = window.fetch;

  window.fetch = async function (input, init) {
    let body;
    if (input instanceof Request) {
      body = await input.clone().text();
    } else if (init?.body) {
      body = init.body;
    }

    // AUTO COMPLETE VIDEO
    if (body?.includes('"operationName":"updateUserVideoProgress"')) {
      try {
        let bodyObj = JSON.parse(body);
        if (bodyObj.variables?.input) {
          const durationSeconds = bodyObj.variables.input.durationSeconds;
          bodyObj.variables.input.secondsWatched = durationSeconds;
          bodyObj.variables.input.lastSecondWatched = durationSeconds;
          body = JSON.stringify(bodyObj);

          if (input instanceof Request) {
            input = new Request(input, { body });
          } else {
            init.body = body;
          }

          sendToast("🔄 | Vídeo concluído!", 2500);
        }
      } catch (e) {
        console.error("Erro ao processar vídeo:", e);
      }
    }

    const originalResponse = await originalFetch.apply(this, arguments);

    // ====== PATCH COMPLETO DE RESPOSTAS ======
    try {
      const clonedResponse = originalResponse.clone();
      const responseBody = await clonedResponse.text();
      
      // Verifica se é JSON válido
      if (!responseBody.trim().startsWith('{')) {
        return originalResponse;
      }
      
      let responseObj = JSON.parse(responseBody);

      // Tenta localizar itemData em diferentes locais possíveis
      let itemDataRaw = null;
      let itemDataPath = null;

      const paths = [
        { path: ['data', 'assessmentItem', 'item', 'itemData'], ref: responseObj },
        { path: ['data', 'assessmentItem', 'item', 'stack', 'itemData'], ref: responseObj },
        { path: ['data', 'assessmentItem', 'item', 'itemTemplate'], ref: responseObj }
      ];

      for (const { path, ref } of paths) {
        let current = ref;
        let valid = true;
        
        for (const key of path) {
          if (current && typeof current === 'object' && key in current) {
            current = current[key];
          } else {
            valid = false;
            break;
          }
        }
        
        if (valid && current) {
          itemDataRaw = current;
          itemDataPath = path;
          break;
        }
      }

      if (!itemDataRaw) return originalResponse;

      // Parse itemData (pode estar stringificado múltiplas vezes)
      let itemData = itemDataRaw;
      let parseAttempts = 0;
      
      while (typeof itemData === "string" && parseAttempts < 3) {
        try {
          itemData = JSON.parse(itemData);
          parseAttempts++;
        } catch (e) {
          console.error("Erro ao parsear itemData:", e);
          return originalResponse;
        }
      }

      // Verifica se tem a estrutura de pergunta
      if (itemData?.question?.content) {
        console.log("🎯 Modificando questão...");

        // Modifica a questão
        itemData.answerArea = {
          calculator: false,
          chi2Table: false,
          periodicTable: false,
          tTable: false,
          zTable: false,
          table: false,
          equationEditor: false,
          formulaInput: false,
          textArea: false,
          numberInput: false,
        };

        itemData.question.content = "Modificado por snts7kxx [[☃ radio 1]]";

        itemData.question.widgets = {
          "radio 1": {
            type: "radio",
            options: {
              choices: [{ content: "💜", correct: true }],
              randomize: false,
              deselectEnabled: false
            }
          }
        };

        // Reconstrói o caminho inverso
        let current = responseObj;
        for (let i = 0; i < itemDataPath.length - 1; i++) {
          current = current[itemDataPath[i]];
        }
        
        // Stringifica de volta (mesmo número de vezes que estava)
        let finalData = itemData;
        for (let i = 0; i < parseAttempts; i++) {
          finalData = JSON.stringify(finalData);
        }
        
        current[itemDataPath[itemDataPath.length - 1]] = finalData;

        const modifiedResponse = new Response(JSON.stringify(responseObj), {
          status: originalResponse.status,
          statusText: originalResponse.statusText,
          headers: originalResponse.headers
        });

        console.log("✅ Questão modificada com sucesso!");
        sendToast("✅ | Questão modificada!", 2000);
        
        return modifiedResponse;
      }
    } catch (e) {
      console.error("Erro ao modificar resposta:", e);
    }

    return originalResponse;
  };

  // AUTO CLICKER
  (async () => {
    window.khandarkDominates = true;

    while (window.khandarkDominates) {
      let clicked = false;

      // Procura pelo coração primeiro
      const allElements = document.querySelectorAll("*");
      for (const el of allElements) {
        const text = (el.textContent || "").trim();
        if (text === "💜" && el.offsetParent !== null) {
          console.log("💜 Clicando no coração...");
          el.click();
          clicked = true;
          await delay(800);
          break;
        }
      }

      // Se não encontrou coração, tenta radios normais
      if (!clicked) {
        const radioSelectors = [
          'input[type="radio"]',
          'label[role="radio"]',
          '[data-test-id="radio-option"]',
          '[role="radio"]'
        ];

        for (const selector of radioSelectors) {
          const element = document.querySelector(selector);
          if (element && element.offsetParent !== null) {
            console.log("📻 Clicando em radio...");
            element.click();
            clicked = true;
            await delay(800);
            break;
          }
        }
      }

      // Clica nos botões
      const buttons = document.querySelectorAll(
        "button:not([disabled]), [role='button']"
      );

      for (const button of buttons) {
        const buttonText = (button.textContent || button.innerText || "")
          .trim()
          .toLowerCase();
        const isVisible = button.offsetParent !== null;

        if (buttonText.includes("pular") || buttonText.includes("skip")) {
          continue;
        }

        const allowedButtons = [
          "verificar",
          "próxima",
          "continuar",
          "check",
          "next",
          "enviar",
          "submit"
        ];

        const isAllowed = allowedButtons.some(text => buttonText.includes(text));

        if (isVisible && isAllowed) {
          console.log("🔘 Clicando em:", buttonText);
          button.click();
          clicked = true;

          if (buttonText.includes("resumo") || buttonText.includes("summary")) {
            sendToast("🎉 | Questão concluída!", 2000);
          }

          await delay(1500);
          break;
        }
      }

      await delay(clicked ? 800 : 1500);
    }
  })();
}

// AUTO REDIRECT
if (!/^https?:\/\/([a-z0-9-]+\.)?khanacademy\.org/.test(window.location.href)) {
  window.location.href = "https://pt.khanacademy.org/";
} else {
  (async function init() {
    await showSplashScreen();

    await Promise.all([
      loadScript(
        "https://cdn.jsdelivr.net/npm/darkreader@4.9.92/darkreader.min.js",
        "darkReaderPlugin"
      ).then(() => {
        DarkReader.setFetchMethod(window.fetch);
        DarkReader.enable();
      }),
      loadCss("https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css"),
      loadScript("https://cdn.jsdelivr.net/npm/toastify-js", "toastifyPlugin")
    ]);

    await delay(3000);
    await hideSplashScreen();

    setupMain();
    sendToast("💜 | Khan Teste");
    console.clear();
  })();
}