function selectionContext(selection) {
  if (!selection?.rangeCount) return "";
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
    ? range.commonAncestorContainer.parentElement
    : range.commonAncestorContainer;
  const contextNode = container?.closest?.("p, li, blockquote, article, section, div");
  return String(contextNode?.innerText || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);
}

function removeToast() {
  document.querySelector("[data-speakloop-extension-toast]")?.remove();
}

function showToast(message) {
  removeToast();
  const toast = document.createElement("aside");
  toast.dataset.speakloopExtensionToast = "true";
  toast.style.cssText = [
    "position:fixed",
    "right:20px",
    "bottom:20px",
    "z-index:2147483647",
    "display:grid",
    "gap:10px",
    "min-width:280px",
    "max-width:380px",
    "padding:16px",
    "border:1px solid #e5e5ea",
    "border-radius:8px",
    "background:#fff",
    "box-shadow:0 18px 50px rgba(0,0,0,.18)",
    "font:14px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
    "color:#1d1d1f",
  ].join(";");

  const title = document.createElement("strong");
  title.textContent = message.message || "Added to SpeakingLook";
  const expression = document.createElement("span");
  expression.textContent = message.expression || "";
  expression.style.cssText = "color:#6e6e73;font-size:13px";
  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;gap:8px;justify-content:flex-end";

  if (message.cardId) {
    const view = document.createElement("button");
    view.textContent = "View Card";
    view.style.cssText = "border:1px solid #d2d2d7;border-radius:6px;background:#fff;padding:7px 10px;cursor:pointer";
    view.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "speakloop:view-card", cardId: message.cardId });
      removeToast();
    });
    actions.append(view);
  }

  if (message.cardId && message.canUndo) {
    const undo = document.createElement("button");
    undo.textContent = "Undo";
    undo.style.cssText = "border:1px solid #d2d2d7;border-radius:6px;background:#fff;padding:7px 10px;cursor:pointer";
    undo.addEventListener("click", () => {
      chrome.runtime.sendMessage(
        { type: "speakloop:undo", cardId: message.cardId },
        () => removeToast(),
      );
    });
    actions.append(undo);
  }

  toast.append(title, expression, actions);
  document.documentElement.append(toast);
  setTimeout(removeToast, 6000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "speakloop:get-selection") {
    const selection = window.getSelection();
    sendResponse({
      expression: String(selection || message.fallbackSelection || "").trim(),
      contextSentence: selectionContext(selection),
    });
    return;
  }
  if (message?.type === "speakloop:show-toast") {
    showToast(message);
    sendResponse({ success: true });
  }
});

(() => {
  const knownCaptionSelector = [
    ".ytp-caption-segment",
    ".vjs-text-track-cue",
    ".vjs-text-track-cue > div",
    ".plyr__caption",
    ".jw-text-track-cue",
    ".jw-text-track-display > div",
    "[data-purpose='captions-cue-text']",
    "[data-testid*='caption' i]",
    "[class*='caption-text' i]",
    "[class*='captionText']",
    "[class*='subtitle-text' i]",
    "[class*='subtitleText']",
  ].join(",");
  const genericCaptionSelector = [
    "[class*='caption' i]",
    "[class*='subtitle' i]",
    "[data-purpose*='caption' i]",
  ].join(",");
  const dictionary = globalThis.SpeakingLookDictionary || {
    lemma: (value) => String(value || "").toLowerCase().replace(/[^a-z]+/g, ""),
    lookup: () => null,
    lookupBatch: () => ({}),
  };
  const HOVER_ENRICHMENT_DEBOUNCE_MS = 200;
  const DICTIONARY_PRELOAD_DEBOUNCE_MS = 80;
  const basicDictionaryCache = new Map();
  const contextLookupCache = new Map();
  const dictionaryPreloadQueue = new Set();
  const savedExpressions = new Set();
  let activeToken = null;
  let hoverCard = null;
  let hideTimer = null;
  let scanFrame = null;
  let preloadTimer = null;
  let enrichmentTimer = null;
  let activeContextRequestId = "";
  let lookupSequence = 0;

  function runtimeMessage(payload) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(payload, (response) => {
          const runtimeError = chrome.runtime.lastError;
          if (runtimeError) {
            reject(new Error(runtimeError.message));
            return;
          }
          resolve(response || { success: false });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function ensureHoverCard() {
    if (hoverCard?.isConnected) return hoverCard;
    hoverCard = document.createElement("aside");
    hoverCard.dataset.speakloopCaptionCard = "true";
    hoverCard.hidden = true;
    hoverCard.setAttribute("role", "dialog");
    hoverCard.setAttribute("aria-label", "SpeakingLook context card");
    hoverCard.innerHTML = `
      <div class="slcc-heading">
        <div>
          <strong data-slcc-expression></strong>
          <small data-slcc-language></small>
        </div>
        <button type="button" data-slcc-listen aria-label="Listen to pronunciation">Listen</button>
      </div>
      <div class="slcc-definition">
        <small>中文释义</small>
        <strong data-slcc-meaning></strong>
      </div>
      <div class="slcc-context-enrichment" data-slcc-enrichment hidden>
        <small>In this context</small>
        <p data-slcc-context-meaning></p>
        <div data-slcc-phrases></div>
      </div>
      <div class="slcc-context">
        <small>Original sentence</small>
        <p data-slcc-context></p>
      </div>
      <button type="button" class="slcc-save" data-slcc-save>+ Save Moment</button>
    `;
    hoverCard.addEventListener("pointerenter", cancelHide);
    hoverCard.addEventListener("pointerleave", scheduleHide);
    hoverCard.querySelector("[data-slcc-listen]").addEventListener("click", () => {
      const expression = hoverCard.querySelector("[data-slcc-expression]").textContent.trim();
      if (!expression || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(expression);
      utterance.lang = "en-US";
      utterance.rate = 0.86;
      window.speechSynthesis.speak(utterance);
    });
    hoverCard.querySelector("[data-slcc-save]").addEventListener("click", saveActiveMoment);
    document.documentElement.append(hoverCard);
    return hoverCard;
  }

  function cancelHide() {
    if (hideTimer) window.clearTimeout(hideTimer);
    hideTimer = null;
  }

  function hideCard() {
    cancelHide();
    cancelContextEnrichment();
    if (hoverCard) hoverCard.hidden = true;
    activeToken = null;
  }

  function scheduleHide() {
    cancelHide();
    hideTimer = window.setTimeout(hideCard, 240);
  }

  function handleTokenLeave() {
    cancelContextEnrichment();
    scheduleHide();
  }

  function cancelContextEnrichment() {
    if (enrichmentTimer) window.clearTimeout(enrichmentTimer);
    enrichmentTimer = null;
    if (!activeContextRequestId) return;
    const requestId = activeContextRequestId;
    activeContextRequestId = "";
    void runtimeMessage({ type: "speakloop:cancel-context-request", requestId }).catch(() => {});
  }

  function contextHash(value) {
    let hash = 2166136261;
    const text = String(value || "").trim().toLowerCase();
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), Math.max(min, max));
  }

  function viewportBounds() {
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0;
    const top = viewport?.offsetTop || 0;
    const width = viewport?.width || document.documentElement.clientWidth || window.innerWidth;
    const height = viewport?.height || document.documentElement.clientHeight || window.innerHeight;
    return {
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
    };
  }

  function positionCard(token) {
    const card = ensureHoverCard();
    const anchor = token.getBoundingClientRect();
    const margin = 12;
    const viewport = viewportBounds();
    const availableWidth = Math.max(120, viewport.width - margin * 2);
    const cardWidth = Math.min(360, availableWidth);
    card.style.setProperty("width", `${Math.round(cardWidth)}px`, "important");
    card.style.setProperty("max-width", `${Math.round(availableWidth)}px`, "important");
    card.style.setProperty("right", "auto", "important");
    card.style.setProperty("bottom", "auto", "important");
    card.style.setProperty("transform", "none", "important");

    const cardRect = card.getBoundingClientRect();
    const measuredWidth = cardRect.width || cardWidth;
    const measuredHeight = cardRect.height || 220;
    const left = clamp(
      anchor.left + anchor.width / 2 - measuredWidth / 2,
      viewport.left + margin,
      viewport.right - measuredWidth - margin,
    );
    const above = anchor.top - measuredHeight - 12;
    const below = anchor.bottom + 12;
    const top = above >= viewport.top + margin
      ? above
      : clamp(below, viewport.top + margin, viewport.bottom - measuredHeight - margin);
    card.style.setProperty("left", `${Math.round(left)}px`, "important");
    card.style.setProperty("top", `${Math.round(top)}px`, "important");
  }

  function renderCard(data) {
    const card = ensureHoverCard();
    const expression = String(data.expression || "").trim();
    const pronunciation = String(data.pronunciation || "").trim();
    const partOfSpeech = String(data.partOfSpeech || "word").trim();
    card.querySelector("[data-slcc-expression]").textContent = expression;
    card.querySelector("[data-slcc-language]").textContent =
      [pronunciation, partOfSpeech].filter(Boolean).join(" · ");
    card.querySelector("[data-slcc-meaning]").textContent =
      data.meaningZh || "本地词典暂未收录；可结合原句理解";
    card.querySelector("[data-slcc-context]").textContent = data.contextSentence || "";
    const enrichment = card.querySelector("[data-slcc-enrichment]");
    const contextMeaning = String(data.contextMeaningZh || "").trim();
    const phrases = Array.isArray(data.phraseCandidates) ? data.phraseCandidates.filter(Boolean) : [];
    enrichment.hidden = !contextMeaning && !phrases.length;
    card.querySelector("[data-slcc-context-meaning]").textContent = contextMeaning;
    card.querySelector("[data-slcc-phrases]").replaceChildren(
      ...phrases.map((phrase) => {
        const chip = document.createElement("span");
        chip.textContent = phrase;
        return chip;
      }),
    );
    const save = card.querySelector("[data-slcc-save]");
    const saved = savedExpressions.has(expression.toLowerCase());
    save.disabled = saved;
    save.textContent = saved ? "Saved to Moment Review" : "+ Save Moment";
  }

  function showCard(token) {
    cancelHide();
    cancelContextEnrichment();
    const renderStartedAt = performance.now();
    activeToken = token;
    const expression = token.dataset.speakloopExpression || token.textContent.trim();
    const lemma = token.dataset.speakloopLemma || dictionary.lemma(expression);
    const cue = token.closest("[data-speakloop-caption-processed]");
    const contextSentence = cue?.dataset.speakloopCaptionSource || expression;
    const sentenceHash = contextHash(contextSentence);
    const cacheKey = `${lemma}::${sentenceHash}`;
    const basic = basicDictionaryCache.get(lemma) || dictionary.lookup(expression) || {
      lemma,
      meaningZh: "本地词典暂未收录；可结合原句理解",
      pronunciation: "",
      partOfSpeech: "word",
      source: "local_fallback",
    };
    basicDictionaryCache.set(lemma, basic);
    const contextual = contextLookupCache.get(cacheKey) || {};
    renderCard({ expression, contextSentence, ...basic, ...contextual });
    hoverCard.hidden = false;
    positionCard(token);
    hoverCard.dataset.hoverStartedAt = renderStartedAt.toFixed(2);
    hoverCard.dataset.basicRenderMs = (performance.now() - renderStartedAt).toFixed(2);
    window.requestAnimationFrame(() => {
      if (activeToken === token) positionCard(token);
    });
    if (!contextLookupCache.has(cacheKey)) {
      scheduleContextEnrichment({ token, expression, lemma, contextSentence, sentenceHash, cacheKey, basic });
    }
  }

  function scheduleContextEnrichment({
    token,
    expression,
    lemma,
    contextSentence,
    sentenceHash,
    cacheKey,
    basic,
  }) {
    enrichmentTimer = window.setTimeout(async () => {
      enrichmentTimer = null;
      if (activeToken !== token || hoverCard?.hidden) return;
      const requestId = `hover_${Date.now()}_${++lookupSequence}`;
      activeContextRequestId = requestId;
      try {
        const response = await runtimeMessage({
          type: "speakloop:lookup-moment",
          requestId,
          expression,
          lemma,
          contextHash: sentenceHash,
          contextSentence,
        });
        if (activeContextRequestId === requestId) activeContextRequestId = "";
        if (!response.success || !response.result) return;
        contextLookupCache.set(cacheKey, response.result);
        if (activeToken !== token || hoverCard.hidden) return;
        renderCard({ expression, contextSentence, ...basic, ...response.result });
        positionCard(token);
      } catch {
        if (activeContextRequestId === requestId) activeContextRequestId = "";
      }
    }, HOVER_ENRICHMENT_DEBOUNCE_MS);
  }

  function queueDictionaryPreload(words) {
    const localEntries = dictionary.lookupBatch(words);
    for (const [lemma, entry] of Object.entries(localEntries)) {
      basicDictionaryCache.set(lemma, entry);
    }
    for (const word of words) {
      const lemma = dictionary.lemma(word);
      if (lemma && !basicDictionaryCache.has(lemma)) dictionaryPreloadQueue.add(word);
    }
    if (!dictionaryPreloadQueue.size || preloadTimer) return;
    preloadTimer = window.setTimeout(flushDictionaryPreload, DICTIONARY_PRELOAD_DEBOUNCE_MS);
  }

  async function flushDictionaryPreload() {
    preloadTimer = null;
    const expressions = Array.from(dictionaryPreloadQueue).slice(0, 100);
    expressions.forEach((expression) => dictionaryPreloadQueue.delete(expression));
    if (!expressions.length) return;
    try {
      const response = await runtimeMessage({
        type: "speakloop:preload-dictionary",
        expressions,
      });
      const entries = response.result?.entries || {};
      for (const [key, entry] of Object.entries(entries)) {
        const lemma = dictionary.lemma(entry.lemma || key);
        if (lemma) basicDictionaryCache.set(lemma, entry);
      }
    } catch {
      // Hover remains instant with the bundled dictionary and local fallback.
    }
    if (dictionaryPreloadQueue.size && !preloadTimer) {
      preloadTimer = window.setTimeout(flushDictionaryPreload, DICTIONARY_PRELOAD_DEBOUNCE_MS);
    }
  }

  async function saveActiveMoment() {
    if (!activeToken) return;
    const expression = activeToken.dataset.speakloopExpression || activeToken.textContent.trim();
    const cue = activeToken.closest("[data-speakloop-caption-processed]");
    const contextSentence = cue?.dataset.speakloopCaptionSource || expression;
    const save = hoverCard.querySelector("[data-slcc-save]");
    save.disabled = true;
    save.textContent = "Saving…";
    try {
      const response = await runtimeMessage({
        type: "speakloop:capture-moment",
        expression,
        contextSentence,
        sourceTitle: document.title,
        sourceUrl: location.href,
      });
      if (!response.success) throw new Error(response.error || "Capture failed");
      savedExpressions.add(expression.toLowerCase());
      save.textContent = "Saved to Moment Review";
    } catch {
      save.disabled = false;
      save.textContent = "Start SpeakingLook, then try again";
    }
  }

  function captionOverlapsVideo(element, videos) {
    const rect = element.getBoundingClientRect();
    if (rect.width < 30 || rect.height < 8 || rect.height > window.innerHeight * 0.35) return false;
    return videos.some((video) => {
      const videoRect = video.getBoundingClientRect();
      if (videoRect.width < 160 || videoRect.height < 90) return false;
      const horizontalOverlap = Math.min(rect.right, videoRect.right) - Math.max(rect.left, videoRect.left);
      const centerY = rect.top + rect.height / 2;
      return horizontalOverlap > Math.min(rect.width, videoRect.width) * 0.35 &&
        centerY > videoRect.top + videoRect.height * 0.28 &&
        centerY < videoRect.bottom + 24;
    });
  }

  function isVisibleCaption(element, { generic = false, videos = [] } = {}) {
    if (!(element instanceof HTMLElement)) return false;
    if (element.closest("[data-speakloop-caption-card], [data-speakloop-extension-toast]")) return false;
    if (element.closest("[data-speakloop-caption-processed]") && !element.dataset.speakloopCaptionProcessed) return false;
    const text = String(element.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length < 2 || text.length > 320 || !/[A-Za-z]/.test(text)) return false;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    if (!generic) return true;
    if (element.childElementCount > 8) return false;
    return captionOverlapsVideo(element, videos);
  }

  function makeCaptionInteractive(element) {
    const text = String(element.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    if (
      element.dataset.speakloopCaptionSource === text &&
      element.querySelector("[data-speakloop-caption-token]")
    ) return;

    const pieces = text.match(/[A-Za-z]+(?:['’\-][A-Za-z]+)*|\s+|[^A-Za-z\s]+/g) || [text];
    const words = pieces.filter((piece) => /^[A-Za-z]+(?:['’\-][A-Za-z]+)*$/.test(piece));
    queueDictionaryPreload(words);
    const fragment = document.createDocumentFragment();
    for (const piece of pieces) {
      if (!/^[A-Za-z]+(?:['’\-][A-Za-z]+)*$/.test(piece)) {
        fragment.append(document.createTextNode(piece));
        continue;
      }
      const token = document.createElement("span");
      token.dataset.speakloopCaptionToken = "true";
      token.dataset.speakloopExpression = piece;
      token.dataset.speakloopLemma = dictionary.lemma(piece);
      token.tabIndex = 0;
      token.setAttribute("role", "button");
      token.setAttribute("aria-label", `Open SpeakingLook context card for ${piece}`);
      token.textContent = piece;
      token.addEventListener("pointerenter", () => showCard(token));
      token.addEventListener("pointerleave", handleTokenLeave);
      token.addEventListener("focus", () => showCard(token));
      token.addEventListener("blur", handleTokenLeave);
      fragment.append(token);
    }
    element.dataset.speakloopCaptionProcessed = "true";
    element.dataset.speakloopCaptionSource = text;
    element.replaceChildren(fragment);
  }

  function scanCaptions() {
    scanFrame = null;
    const videos = Array.from(document.querySelectorAll("video"));
    const seen = new Set();
    document.querySelectorAll(knownCaptionSelector).forEach((element) => {
      if (seen.has(element) || !isVisibleCaption(element, { videos })) return;
      seen.add(element);
      makeCaptionInteractive(element);
    });
    document.querySelectorAll(genericCaptionSelector).forEach((element) => {
      if (seen.has(element) || !isVisibleCaption(element, { generic: true, videos })) return;
      seen.add(element);
      makeCaptionInteractive(element);
    });
  }

  function scheduleScan() {
    if (scanFrame != null) return;
    scanFrame = window.requestAnimationFrame(scanCaptions);
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  window.addEventListener("resize", hideCard, { passive: true });
  window.addEventListener("scroll", hideCard, { capture: true, passive: true });
  scheduleScan();
})();
