import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

const host = "127.0.0.1";
const port = String(4300 + Math.floor(Math.random() * 500));
const temporaryDirectory = await mkdtemp(join(tmpdir(), "speakloop-smoke-"));

// Stands in for the OpenAI Responses API so the smoke test exercises the real
// request path without spending tokens.
const fakeOpenAI = createServer(async (request, response) => {
  if (!request.url.endsWith("/responses") || request.method !== "POST") {
    response.writeHead(404).end();
    return;
  }
  for await (const _chunk of request) {
    // Drain the request body.
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(
    JSON.stringify({
      output_text: JSON.stringify({
        summary: "Your product explanation became clearer after the correction.",
        topIssue: "Subject-verb agreement in longer answers.",
        nextActions: [
          "Repeat the corrected sentence three times.",
          "Answer once using two short clauses.",
          "Reuse decision latency in a new example.",
        ],
        practicePrompt: "Explain one AI deployment risk in two short sentences.",
      }),
      usage: { input_tokens: 120, output_tokens: 80 },
    }),
  );
});

await new Promise((resolve, reject) => {
  fakeOpenAI.once("error", reject);
  fakeOpenAI.listen(0, host, resolve);
});
const openAIPort = fakeOpenAI.address().port;

const child = spawn(process.execPath, ["server.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    HOST: host,
    PORT: port,
    VOCABULARY_STORE_PATH: join(temporaryDirectory, "vocabulary-store.json"),
    OPENAI_API_KEY: "smoke-test-key",
    OPENAI_BASE_URL: `http://${host}:${openAIPort}/v1`,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (chunk) => { output += chunk; });
child.stderr.on("data", (chunk) => { output += chunk; });

const baseUrl = `http://${host}:${port}`;

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return response.json();
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not become healthy.\n${output}`);
}

try {
  const health = await waitForServer();
  if (health.status !== "ok") throw new Error("Health endpoint returned a non-ok status");
  if (health.provider !== "openai") throw new Error("Health endpoint no longer reports OpenAI");

  const home = await fetch(baseUrl);
  if (!home.ok || !(await home.text()).includes("SpeakLoop")) {
    throw new Error("Product home page did not load");
  }

  const secret = await fetch(`${baseUrl}/.env`);
  if (secret.status !== 404) throw new Error("Static server exposed a protected file");

  const capture = await fetch(`${baseUrl}/api/capture`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      expression: "decision latency",
      contextSentence: "We should reduce decision latency across the product team.",
      sourceType: "webpage",
      sourceTitle: "Smoke test article",
      sourceUrl: "https://example.com/article",
      captureMethod: "page_selection_card",
      userId: "smoke_test",
    }),
  });
  const captureResult = await capture.json();
  if (!capture.ok || !captureResult.success) throw new Error("Vocabulary capture flow failed");
  if (captureResult.card.sourceType !== "webpage") {
    throw new Error("Webpage capture did not preserve its source type");
  }
  if (!captureResult.card.contextSentence) {
    throw new Error("Webpage capture did not preserve its context sentence");
  }

  const vocabulary = await fetch(`${baseUrl}/api/vocabulary?userId=smoke_test`);
  const vocabularyResult = await vocabulary.json();
  if (!vocabulary.ok || vocabularyResult.cards.length !== 1) {
    throw new Error("Vocabulary persistence flow failed");
  }

  const review = await fetch(`${baseUrl}/api/review/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: "I think our team underestimate how much time it need to deploy AI reliably.",
      userId: "smoke_test",
    }),
  });
  const reviewResult = await review.json();
  if (!review.ok || reviewResult.provider !== "openai" || reviewResult.review.nextActions.length !== 3) {
    throw new Error(`OpenAI review contract failed: ${JSON.stringify(reviewResult)}`);
  }

  console.log(JSON.stringify({
    success: true,
    checks: ["health", "home", "protected-files", "webpage-capture", "vocabulary", "openai-review"],
    health,
  }, null, 2));
} finally {
  child.kill("SIGTERM");
  fakeOpenAI.close();
}
