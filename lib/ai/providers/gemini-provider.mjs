import { modelEnv } from "../model-routing-config.mjs";

// Gemini's free tier needs no card, which is why SpeakLoop can fall back to it
// when the OpenAI account has no credit. The wire format differs from OpenAI:
// roles are "user"/"model", the system prompt is a separate field, and the
// reply arrives as candidate content parts.
function toGeminiContents(messages = [], fallbackText = "") {
  const conversation = messages.filter(
    (message) => message?.content && message.role !== "system",
  );
  if (!conversation.length) {
    return [{ role: "user", parts: [{ text: String(fallbackText || "") }] }];
  }
  return conversation.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: String(message.content) }],
  }));
}

function toSystemInstruction(messages = []) {
  const system = messages
    .filter((message) => message?.role === "system" && message.content)
    .map((message) => String(message.content))
    .join("\n\n");
  return system ? { parts: [{ text: system }] } : undefined;
}

function responseText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part?.text || "")
    .join("")
    .trim();
}

export class GeminiProvider {
  providerName = "gemini";

  constructor({ apiKey = process.env.GEMINI_API_KEY, baseUrl = modelEnv.GEMINI_BASE_URL } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async generateText({ model, input }) {
    const apiKey = process.env.GEMINI_API_KEY || this.apiKey;
    const baseUrl = (process.env.GEMINI_BASE_URL || this.baseUrl).replace(/\/$/, "");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const messages = input?.messages || [];
    const response = await fetch(
      `${baseUrl}/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: toGeminiContents(messages, input?.text),
          systemInstruction: toSystemInstruction(messages),
          generationConfig: { maxOutputTokens: 900, temperature: 0.6 },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    const content = responseText(data);
    if (!content) {
      const blocked = data?.promptFeedback?.blockReason;
      throw new Error(blocked ? `Gemini blocked the prompt (${blocked})` : "Gemini returned an empty response");
    }

    return {
      content,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount,
        outputTokens: data.usageMetadata?.candidatesTokenCount,
      },
      raw: data,
    };
  }
}
