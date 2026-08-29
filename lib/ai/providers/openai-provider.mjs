import { modelEnv } from "../model-routing-config.mjs";

function responseText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text" || typeof item.text === "string")
    .map((item) => item.text || "")
    .join("")
    .trim();
}

function responseInput(messages = [], fallbackText = "") {
  const input = messages
    .filter((message) => message?.content)
    .map((message) => ({
      role: message.role === "system" ? "developer" : message.role,
      content: String(message.content),
    }));
  return input.length ? input : [{ role: "user", content: String(fallbackText || "") }];
}

export class OpenAIProvider {
  providerName = "openai";

  constructor({
    apiKey = process.env.OPENAI_API_KEY,
    baseUrl = modelEnv.OPENAI_BASE_URL,
  } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async generateText({ model, input }) {
    const apiKey = process.env.OPENAI_API_KEY || this.apiKey;
    const baseUrl = (process.env.OPENAI_BASE_URL || this.baseUrl).replace(/\/$/, "");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const response = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: responseInput(input?.messages, input?.text),
        max_output_tokens: 700,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `OpenAI Responses API returned ${response.status}`);
    }

    const data = await response.json();
    const content = responseText(data);
    if (!content) {
      throw new Error("OpenAI returned an empty response");
    }

    return {
      content,
      usage: {
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
      raw: data,
    };
  }
}
