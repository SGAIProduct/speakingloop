import test from "node:test";
import assert from "node:assert/strict";

test("batch review tasks route to Qwen when enabled", async () => {
  process.env.ENABLE_QWEN = "true";
  process.env.DEFAULT_REVIEW_PROVIDER = "qwen";
  process.env.DEFAULT_REPORT_PROVIDER = "qwen";
  process.env.DEFAULT_VOCAB_PROVIDER = "qwen";
  const { ModelRouter } = await import(`../lib/ai/model-router.mjs?test=${Date.now()}`);
  const router = new ModelRouter();

  const review = router.selectRoute({ taskType: "tomorrow_review_planner" });
  assert.equal(review.provider, "qwen");
  assert.equal(review.model, "qwen3:8b");

  const realtime = router.selectRoute({ taskType: "realtime_speaking_coach" });
  assert.equal(realtime.provider, "openai");
});

test("an unavailable Qwen preference falls back to a valid OpenAI model key", async () => {
  const script = `
    process.env.ENABLE_QWEN = "false";
    const { ModelRouter } = await import("./lib/ai/model-router.mjs");
    const route = new ModelRouter().selectRoute({
      taskType: "tomorrow_review_planner",
      preferredProvider: "qwen"
    });
    if (route.provider !== "openai") process.exit(2);
    if (!route.model.startsWith("gpt-")) process.exit(3);
  `;
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: process.cwd(),
    env: { ...process.env, ENABLE_QWEN: "false", DEFAULT_REVIEW_PROVIDER: "qwen" },
  });
  assert.equal(result.status, 0, result.stderr?.toString());
});
