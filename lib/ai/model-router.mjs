import {
  modelRoutingConfig,
  resolveModel,
  modelEnvKeyFor,
  providerAvailability,
} from "./model-routing-config.mjs";
import { realtimeTaskTypes } from "./types.mjs";
import { CostTracker } from "./cost-tracker.mjs";
import { UsageLimiter } from "./usage-limits.mjs";
import { OpenAIProvider } from "./providers/openai-provider.mjs";
import { GeminiProvider } from "./providers/gemini-provider.mjs";

export const NO_PROVIDER_MESSAGE =
  "No model provider is configured. Set OPENAI_API_KEY, or GEMINI_API_KEY for the free tier, then restart SpeakLoop.";

// OpenAI returns these when the account is out of credit. They are not transient,
// so retrying the same provider is pointless — switch instead.
const QUOTA_PATTERNS = [
  /insufficient_quota/i,
  /credit_balance_exhausted/i,
  /no credits remaining/i,
  /exceeded your current quota/i,
  /billing_hard_limit_reached/i,
];

export function isQuotaError(message) {
  const text = String(message || "");
  return QUOTA_PATTERNS.some((pattern) => pattern.test(text));
}

export class ModelRouter {
  constructor() {
    this.costTracker = new CostTracker();
    this.usageLimiter = new UsageLimiter();
    this.providers = {
      openai: new OpenAIProvider(),
      gemini: new GeminiProvider(),
    };
    // Remembered for the process lifetime: once OpenAI reports an exhausted
    // balance, every later request goes straight to Gemini instead of paying a
    // failed round trip first. Cleared when a new key is configured.
    this.exhausted = new Set();
  }

  // Providers to try, in order, for this request.
  providerChain() {
    const available = providerAvailability();
    const chain = ["openai", "gemini"].filter(
      (provider) => available[provider] && !this.exhausted.has(provider),
    );
    if (chain.length) return chain;
    // Everything is exhausted: try whatever is configured so the caller gets the
    // provider's real message rather than a made-up one.
    return ["openai", "gemini"].filter((provider) => available[provider]);
  }

  selectRoute({ taskType, userPlan = "free", preferredModel, provider }) {
    const chosen = provider || this.providerChain()[0] || "openai";
    const planConfig = modelRoutingConfig[userPlan] || modelRoutingConfig.free;
    const baseRoute = planConfig[taskType] || planConfig.realtime_speaking_coach;
    const modelEnvKey = modelEnvKeyFor(taskType, chosen);
    return {
      ...baseRoute,
      provider: chosen,
      model: resolveModel(modelEnvKey, provider ? preferredModel : undefined),
      modelEnvKey,
      taskType,
      userPlan,
      realtime: realtimeTaskTypes.has(taskType),
    };
  }

  async run(input) {
    const start = Date.now();
    const limit = this.usageLimiter.check(input);

    if (!limit.allowed) {
      return this.finish({
        input,
        route: this.selectRoute(input),
        result: { content: "" },
        start,
        success: false,
        errorMessage: limit.reason,
      });
    }

    const chain = this.providerChain();
    if (!chain.length) {
      return this.finish({
        input,
        route: this.selectRoute(input),
        result: { content: "" },
        start,
        success: false,
        errorMessage: NO_PROVIDER_MESSAGE,
        errorCode: "no_provider",
      });
    }

    let lastError;
    let lastRoute;
    for (const provider of chain) {
      const route = this.selectRoute({ ...input, provider });
      lastRoute = route;
      try {
        const result = await this.providers[provider].generateText({
          model: route.model,
          input: input.input,
        });
        return this.finish({
          input,
          route,
          result,
          start,
          success: true,
          // True when an earlier provider in the chain was skipped or failed.
          fallbackUsed: provider !== chain[0] || this.exhausted.size > 0,
        });
      } catch (error) {
        lastError = error;
        if (isQuotaError(error.message)) {
          this.exhausted.add(provider);
          continue;
        }
        break;
      }
    }

    return this.finish({
      input,
      route: lastRoute,
      result: { content: "" },
      start,
      success: false,
      errorMessage: lastError?.message,
      errorCode: isQuotaError(lastError?.message) ? "quota_exhausted" : "provider_error",
    });
  }

  finish({ input, route, result, start, success, fallbackUsed = false, errorMessage, errorCode }) {
    const latencyMs = Date.now() - start;
    const text = input.input?.text || input.input?.messages?.at(-1)?.content || "";
    const { usage, cost } = this.costTracker.estimate({
      provider: route.provider,
      inputText: text,
      outputText: result.content,
      usage: result.usage,
    });
    const log = this.costTracker.log({
      userId: input.metadata?.userId || "anonymous",
      sessionId: input.metadata?.sessionId,
      taskType: input.taskType,
      provider: route.provider,
      model: route.model,
      userPlan: input.userPlan,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalCostUsd: cost.totalCostUsd,
      latencyMs,
      success,
      fallbackUsed,
      errorMessage,
    });

    return {
      success,
      provider: route.provider,
      model: route.model,
      taskType: input.taskType,
      result: result.content,
      usage,
      cost,
      latencyMs,
      fallbackUsed,
      cached: false,
      route,
      log,
      errorMessage,
      errorCode,
    };
  }

  logExternalCall({
    taskType,
    provider,
    model,
    latencyMs,
    success,
    cached = false,
    errorMessage = "",
    userId = "local_user",
    sessionId = "local_session",
  }) {
    return this.costTracker.log({
      userId,
      sessionId,
      taskType,
      provider,
      model,
      userPlan: "free",
      inputTokens: 0,
      outputTokens: 0,
      totalCostUsd: 0,
      latencyMs,
      success,
      fallbackUsed: false,
      cached,
      errorMessage,
    });
  }

  logs() {
    return this.costTracker.list();
  }
}
