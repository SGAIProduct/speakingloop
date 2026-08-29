const DEFAULT_API_BASE = "http://127.0.0.1:4173";

globalThis.SpeakLoopApi = {
  async baseUrl() {
    const stored = await chrome.storage.local.get("apiBaseUrl");
    return String(stored.apiBaseUrl || DEFAULT_API_BASE).replace(/\/$/, "");
  },

  async request(path, options = {}) {
    const base = await this.baseUrl();
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `SpeakLoop returned ${response.status}`);
    }
    return data;
  },

  capture(payload) {
    return this.request("/api/capture", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  enhance(cardId) {
    return this.request("/api/vocabulary/enhance", {
      method: "POST",
      body: JSON.stringify({ cardId }),
    });
  },

  lookup(payload, { signal } = {}) {
    return this.request("/api/context/lookup", {
      method: "POST",
      body: JSON.stringify(payload),
      signal,
    });
  },

  preloadDictionary(expressions) {
    return this.request("/api/context/dictionary-batch", {
      method: "POST",
      body: JSON.stringify({ expressions }),
    });
  },

  deleteCard(cardId) {
    return this.request(`/api/vocabulary/${encodeURIComponent(cardId)}`, {
      method: "DELETE",
    });
  },
};
