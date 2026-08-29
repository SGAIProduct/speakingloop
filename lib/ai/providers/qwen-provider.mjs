import { modelEnv } from "../model-routing-config.mjs";

export class QwenProvider {
  providerName = "qwen";

  constructor({ baseUrl = modelEnv.OLLAMA_BASE_URL } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async generateText({ model, input }) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        think: false,
        messages: input.messages,
        options: {
          temperature: 0.35,
          num_ctx: 4096,
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Qwen/Ollama returned ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || "",
      usage: {
        inputTokens: data.prompt_eval_count,
        outputTokens: data.eval_count,
      },
      raw: data,
    };
  }
}
