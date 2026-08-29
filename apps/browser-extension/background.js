importScripts("api.js");

const MENU_ID = "speakloop-add";
const contextRequestControllers = new Map();

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Add to SpeakLoop",
      contexts: ["selection"],
    });
  });
});

async function pageSelectionDetails(tabId, fallbackSelection) {
  try {
    return await chrome.tabs.sendMessage(tabId, {
      type: "speakloop:get-selection",
      fallbackSelection,
    });
  } catch {
    return { expression: fallbackSelection, contextSentence: "" };
  }
}

async function showCaptureResult(tabId, result) {
  await chrome.storage.local.set({
    lastCapture: {
      cardId: result.cardId,
      expression: result.expression,
      message: result.message,
      createdAt: new Date().toISOString(),
    },
  });
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "speakloop:show-toast",
      cardId: result.cardId,
      expression: result.expression,
      message: result.message,
      canUndo: !result.duplicate,
    });
  } catch {
    await chrome.action.setBadgeBackgroundColor({ color: "#16833a" });
    await chrome.action.setBadgeText({ text: "✓" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1800);
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  const selected = String(info.selectionText || "").trim();
  if (!selected) return;

  try {
    const details = await pageSelectionDetails(tab.id, selected);
    const result = await SpeakLoopApi.capture({
      expression: details.expression || selected,
      contextSentence: details.contextSentence || "",
      sourceType: "webpage",
      sourceTitle: tab.title || "",
      sourceUrl: tab.url || "",
      captureMethod: "browser_context_menu",
      userId: "local_user",
    });
    await showCaptureResult(tab.id, result);
    if (!result.duplicate) {
      void SpeakLoopApi.enhance(result.cardId);
    }
  } catch (error) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: "speakloop:show-toast",
        expression: selected,
        message: `SpeakLoop unavailable: ${error.message}`,
        canUndo: false,
      });
    } catch {
      await chrome.action.setBadgeBackgroundColor({ color: "#ff3b30" });
      await chrome.action.setBadgeText({ text: "!" });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "speakloop:preload-dictionary") {
    void SpeakLoopApi.preloadDictionary(message.expressions || [])
      .then((result) => sendResponse({ success: true, result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message?.type === "speakloop:lookup-moment") {
    const requestId = String(message.requestId || "");
    const controller = new AbortController();
    if (requestId) contextRequestControllers.set(requestId, controller);
    void SpeakLoopApi.lookup(
      {
        expression: message.expression,
        lemma: message.lemma,
        contextHash: message.contextHash,
        contextSentence: message.contextSentence || "",
        userId: "local_user",
      },
      { signal: controller.signal },
    )
      .then((result) => sendResponse({ success: true, result }))
      .catch((error) => {
        if (error.name === "AbortError") {
          sendResponse({ success: false, cancelled: true });
          return;
        }
        sendResponse({ success: false, error: error.message });
      })
      .finally(() => {
        if (requestId) contextRequestControllers.delete(requestId);
      });
    return true;
  }

  if (message?.type === "speakloop:cancel-context-request") {
    const requestId = String(message.requestId || "");
    const controller = contextRequestControllers.get(requestId);
    if (controller) controller.abort();
    contextRequestControllers.delete(requestId);
    sendResponse({ success: true, cancelled: Boolean(controller) });
    return;
  }

  if (message?.type === "speakloop:capture-moment") {
    void (async () => {
      try {
        const result = await SpeakLoopApi.capture({
          expression: message.expression,
          contextSentence: message.contextSentence || "",
          // The card is reachable from video captions and from ordinary page
          // text, so the surface decides the source rather than this handler.
          sourceType: message.sourceType || "browser_video",
          sourceTitle: message.sourceTitle || sender.tab?.title || "",
          sourceUrl: message.sourceUrl || sender.tab?.url || "",
          captureMethod: message.captureMethod || "caption_hover_card",
          userId: "local_user",
        });
        if (sender.tab?.id) await showCaptureResult(sender.tab.id, result);
        if (!result.duplicate) void SpeakLoopApi.enhance(result.cardId);
        sendResponse({ success: true, result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message?.type === "speakloop:view-card") {
    void SpeakLoopApi.baseUrl().then((base) => {
      chrome.tabs.create({
        url: `${base}/?tab=assets&card=${encodeURIComponent(message.cardId)}`,
      });
    });
    sendResponse({ success: true });
    return;
  }

  if (message?.type === "speakloop:undo") {
    void SpeakLoopApi.deleteCard(message.cardId)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});
