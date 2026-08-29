import { modelRoutingConfig, resolveModel, envDefaults, modelEnvKeyFor } from "./model-routing-config.mjs";
import { realtimeTaskTypes } from "./types.mjs";
import { CostTracker } from "./cost-tracker.mjs";
import { UsageLimiter } from "./usage-limits.mjs";
import { OpenAIProvider } from "./providers/openai-provider.mjs";
import { DemoProvider } from "./providers/demo-provider.mjs";

export const MISSING_KEY_MESSAGE =
  "OPENAI_API_KEY is not configured. Add it to the local .env file and restart SpeakLoop.";

export class ModelRouter {
  constructor() {
    this.costTracker = new CostTracker();
    this.usageLimiter = new UsageLimiter();
    this.providers = {
      openai: new OpenAIProvider(),
      demo: new DemoProvider(),
    };
  }

  selectRoute({ taskType, userPlan = "free", preferredModel }) {
    const planConfig = modelRoutingConfig[userPlan] || modelRoutingConfig.free;
    const baseRoute = planConfig[taskType] || planConfig.realtime_speaking_coach;
    const modelEnvKey = baseRoute.modelEnvKey || modelEnvKeyFor(taskType);
    return {
      ...baseRoute,
      provider: "openai",
      model: resolveModel(modelEnvKey, preferredModel),
      modelEnvKey,
      taskType,
      userPlan,
      realtime: realtimeTaskTypes.has(taskType),
    };
  }

  async run(input) {
    const start = Date.now();
    const route = this.selectRoute(input);
    const limit = this.usageLimiter.check(input);

    if (!limit.allowed) {
      return this.finish({
        input,
        route,
        result: { content: "" },
        start,
        success: false,
        fallbackUsed: false,
        errorMessage: limit.reason,
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return this.finish({
        input,
        route,
        result: { content: "" },
        start,
        success: false,
        fallbackUsed: false,
        errorMessage: MISSING_KEY_MESSAGE,
        errorCode: "missing_api_key",
      });
    }

    try {
      const result = await this.providers.openai.generateText({
        model: route.model,
        input: input.input,
      });
      return this.finish({ input, route, result, start, success: true, fallbackUsed: false });
    } catch (error) {
      if (!envDefaults.ENABLE_MODEL_FALLBACK) {
        return this.finish({
          input,
          route,
          result: { content: "" },
          start,
          success: false,
          fallbackUsed: false,
          errorMessage: error.message,
          errorCode: "openai_error",
        });
      }

      const result = await this.providers.demo.generateText({
        model: "demo_text_only",
        input: input.input,
      });
      return this.finish({
        input,
        route: {
          ...route,
          provider: "demo",
          model: "demo_text_only",
          primaryProvider: route.provider,
          primaryModel: route.model,
        },
        result,
        start,
        success: true,
        fallbackUsed: true,
        errorMessage: error.message,
      });
    }
  }

  finish({ input, route, result, start, success, fallbackUsed, errorMessage, errorCode }) {
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
