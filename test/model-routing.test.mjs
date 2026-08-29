import test from "node:test";
import assert from "node:assert/strict";

import { ModelRouter, MISSING_KEY_MESSAGE } from "../lib/ai/model-router.mjs";
import { modelEnv } from "../lib/ai/model-routing-config.mjs";

test("every task type routes to OpenAI", () => {
  const router = new ModelRouter();
  const taskTypes = [
    "realtime_speaking_coach",
    "immediate_correction",
    "follow_up_question",
    "advanced_expression",
    "post_session_report",
    "tomorrow_review_planner",
    "vocabulary_phrase_extractor",
  ];

  for (const taskType of taskTypes) {
    const route = router.selectRoute({ taskType });
    assert.equal(route.provider, "openai", `${taskType} must stay on OpenAI`);
    assert.ok(route.model.startsWith("gpt-"), `${taskType} resolved to ${route.model}`);
  }
});

test("batch tasks use the mini model, live coaching uses the strong model", () => {
  const router = new ModelRouter();
  assert.equal(
    router.selectRoute({ taskType: "vocabulary_phrase_extractor" }).model,
    modelEnv.OPENAI_TEXT_MODEL_MINI,
  );
  assert.equal(
    router.selectRoute({ taskType: "realtime_speaking_coach" }).model,
    modelEnv.OPENAI_REALTIME_MODEL,
  );
});

test("an explicit preferred model wins over the task default", () => {
  const route = new ModelRouter().selectRoute({
    taskType: "post_session_report",
    preferredModel: "gpt-5.5",
  });
  assert.equal(route.model, "gpt-5.5");
});

test("a missing API key fails loudly instead of silently degrading", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const result = await new ModelRouter().run({
      taskType: "immediate_correction",
      input: { text: "hello" },
      metadata: { userId: "test_user" },
    });
    assert.equal(result.success, false);
    assert.equal(result.errorCode, "missing_api_key");
    assert.equal(result.errorMessage, MISSING_KEY_MESSAGE);
  } finally {
    if (previousKey !== undefined) process.env.OPENAI_API_KEY = previousKey;
  }
});
