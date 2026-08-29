import { countApproxTokens } from "./types.mjs";

const PRICE_PER_1K = {
  demo: { input: 0, output: 0 },
  openai: { input: 0.002, output: 0.006 },
};

export class CostTracker {
  constructor() {
    this.logs = [];
  }

  estimate({ provider, inputText, outputText, usage = {} }) {
    const inputTokens = usage.inputTokens || countApproxTokens(inputText);
    const outputTokens = usage.outputTokens || countApproxTokens(outputText);
    const price = PRICE_PER_1K[provider] || PRICE_PER_1K.demo;
    const inputCostUsd = (inputTokens / 1000) * price.input;
    const outputCostUsd = (outputTokens / 1000) * price.output;
    return {
      usage: { inputTokens, outputTokens },
      cost: {
        inputCostUsd,
        outputCostUsd,
        totalCostUsd: inputCostUsd + outputCostUsd,
      },
    };
  }

  log(entry) {
    const record = {
      id: `model_call_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      ...entry,
    };
    this.logs.unshift(record);
    this.logs = this.logs.slice(0, 50);
    return record;
  }

  list() {
    return this.logs;
  }
}
