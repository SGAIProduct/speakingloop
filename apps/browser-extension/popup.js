const status = document.querySelector("#status");
const lastCapture = document.querySelector("#last-capture");
const lastExpression = document.querySelector("#last-expression");

async function initialize() {
  try {
    const data = await SpeakingLookApi.request("/api/vocabulary");
    status.textContent = `Connected · ${data.cards.length} saved expression${data.cards.length === 1 ? "" : "s"}`;
  } catch {
    status.textContent = "SpeakingLook is offline. Start http://127.0.0.1:4173 first.";
  }

  const stored = await chrome.storage.local.get("lastCapture");
  if (stored.lastCapture?.expression) {
    lastCapture.hidden = false;
    lastExpression.textContent = stored.lastCapture.expression;
  }
}

document.querySelector("#open-library").addEventListener("click", async () => {
  const base = await SpeakingLookApi.baseUrl();
  chrome.tabs.create({ url: `${base}/?tab=assets` });
});

void initialize();
