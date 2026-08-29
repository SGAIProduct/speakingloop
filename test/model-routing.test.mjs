import test from "node:test";
import assert from "node:assert/strict";

import { ModelRouter, NO_PROVIDER_MESSAGE, isQuotaError } from "../lib/ai/model-router.mjs";
import { modelEnv } from "../lib/ai/model-routing-config.mjs";

// Awaits `run` before restoring, so an async body still sees the env it asked
// for. Returning the promise from a sync try/finally would restore immediately
// and leave the assertions running against the wrong environment.
async function withEnv(vars, run) {
  const previous = {};
  for (const [key, value] of Object.entries(vars)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("OpenAI is preferred when its key is present", async () => {
  await withEnv({ OPENAI_API_KEY: "sk-test", GEMINI_API_KEY: "AIza-test" }, () => {
    const route = new ModelRouter().selectRoute({ taskType: "immediate_correction" });
    assert.equal(route.provider, "openai");
    assert.equal(route.model, modelEnv.OPENAI_TEXT_MODEL_MID);
  });
});

test("Gemini serves when OpenAI has no key", async () => {
  await withEnv({ OPENAI_API_KEY: undefined, GEMINI_API_KEY: "AIza-test" }, () => {
    const route = new ModelRouter().selectRoute({ taskType: "immediate_correction" });
    assert.equal(route.provider, "gemini");
    assert.equal(route.model, modelEnv.GEMINI_TEXT_MODEL_MID);
  });
});

test("a model id from the wrong provider is ignored", async () => {
  await withEnv({ OPENAI_API_KEY: undefined, GEMINI_API_KEY: "AIza-test" }, () => {
    const route = new ModelRouter().selectRoute({
      taskType: "immediate_correction",
      provider: "gemini",
      preferredModel: "gpt-5.4-mini",
    });
    assert.equal(route.provider, "gemini");
    assert.equal(route.model, modelEnv.GEMINI_TEXT_MODEL_MID);
  });
});

test("batch tasks use the cheaper model on either provider", async () => {
  await withEnv({ OPENAI_API_KEY: "sk-test", GEMINI_API_KEY: undefined }, () => {
    assert.equal(
      new ModelRouter().selectRoute({ taskType: "vocabulary_phrase_extractor" }).model,
      modelEnv.OPENAI_TEXT_MODEL_MINI,
    );
  });
  await withEnv({ OPENAI_API_KEY: undefined, GEMINI_API_KEY: "AIza-test" }, () => {
    assert.equal(
      new ModelRouter().selectRoute({ taskType: "vocabulary_phrase_extractor" }).model,
      modelEnv.GEMINI_TEXT_MODEL_MINI,
    );
  });
});

test("the real OpenAI out-of-credit payload is recognised as a quota error", () => {
  assert.equal(
    isQuotaError(
      '{"error":{"message":"You have no credits remaining. Add credits to continue using the API.","type":"insufficient_quota","code":"credit_balance_exhausted"}}',
    ),
    true,
  );
  assert.equal(isQuotaError("connect ETIMEDOUT"), false);
});

test("an exhausted OpenAI balance falls through to Gemini", async () => {
  await withEnv({ OPENAI_API_KEY: "sk-test", GEMINI_API_KEY: "AIza-test" }, async () => {
    const router = new ModelRouter();
    let openaiCalls = 0;
    router.providers.openai = {
      async generateText() {
        openaiCalls += 1;
        throw new Error('{"error":{"type":"insufficient_quota","code":"credit_balance_exhausted"}}');
      },
    };
    router.providers.gemini = {
      async generateText() {
        return { content: "Say it this way: our team underestimated the work." };
      },
    };

    const first = await router.run({
      taskType: "immediate_correction",
      input: { text: "hi" },
      metadata: { userId: "test" },
    });
    assert.equal(first.success, true);
    assert.equal(first.provider, "gemini");
    assert.equal(first.fallbackUsed, true);

    // The second request must not pay for another failed OpenAI round trip.
    const second = await router.run({
      taskType: "immediate_correction",
      input: { text: "hi again" },
      metadata: { userId: "test" },
    });
    assert.equal(second.provider, "gemini");
    assert.equal(openaiCalls, 1, "OpenAI should be tried once, then skipped");
  });
});

test("a non-quota failure does not silently switch providers", async () => {
  await withEnv({ OPENAI_API_KEY: "sk-test", GEMINI_API_KEY: "AIza-test" }, async () => {
    const router = new ModelRouter();
    router.providers.openai = {
      async generateText() {
        throw new Error("connect ETIMEDOUT 1.2.3.4:443");
      },
    };
    router.providers.gemini = {
      async generateText() {
        throw new Error("gemini should not have been called");
      },
    };

    const result = await router.run({
      taskType: "immediate_correction",
      input: { text: "hi" },
      metadata: { userId: "test" },
    });
    assert.equal(result.success, false);
    assert.equal(result.errorCode, "provider_error");
    assert.match(result.errorMessage, /ETIMEDOUT/);
  });
});

test("with no provider configured the failure names both options", async () => {
  await withEnv({ OPENAI_API_KEY: undefined, GEMINI_API_KEY: undefined }, async () => {
    const result = await new ModelRouter().run({
      taskType: "immediate_correction",
      input: { text: "hi" },
      metadata: { userId: "test" },
    });
    assert.equal(result.success, false);
    assert.equal(result.errorCode, "no_provider");
    assert.equal(result.errorMessage, NO_PROVIDER_MESSAGE);
  });
});
