import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

const host = "127.0.0.1";
const port = String(4300 + Math.floor(Math.random() * 500));
const temporaryDirectory = await mkdtemp(join(tmpdir(), "speakloop-smoke-"));

// Stands in for both upstreams so the smoke test exercises the real request
// paths without spending tokens. OpenAI answers with an out-of-credit error so
// the run also proves the Gemini fallback works end to end.
const reviewPayload = () => JSON.stringify({
  summary: "Your product explanation became clearer after the correction.",
  topIssue: "Subject-verb agreement in longer answers.",
  nextActions: [
    "Repeat the corrected sentence three times.",
    "Answer once using two short clauses.",
    "Reuse decision latency in a new example.",
  ],
  practicePrompt: "Explain one AI deployment risk in two short sentences.",
});

const fakeOpenAI = createServer(async (request, response) => {
  if (!request.url.endsWith("/responses") || request.method !== "POST") {
    response.writeHead(404).end();
    return;
  }
  for await (const _chunk of request) {
    // Drain the request body.
  }
  response.writeHead(429, { "Content-Type": "application/json" });
  response.end(
    JSON.stringify({
      error: {
        message: "You have no credits remaining.",
        type: "insufficient_quota",
        code: "credit_balance_exhausted",
      },
    }),
  );
});

const fakeGemini = createServer(async (request, response) => {
  if (!request.url.includes(":generateContent") || request.method !== "POST") {
    response.writeHead(404).end();
    return;
  }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const parts = body?.contents?.flatMap((content) => content?.parts || []) || [];
  const isTranscription = parts.some((part) => part?.inlineData?.data);
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(
    JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: isTranscription
              ? "Yesterday I discussed the project with my manager."
              : reviewPayload(),
          }],
        },
      }],
      usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 80 },
    }),
  );
});

await new Promise((resolve, reject) => {
  fakeOpenAI.once("error", reject);
  fakeOpenAI.listen(0, host, resolve);
});
await new Promise((resolve, reject) => {
  fakeGemini.once("error", reject);
  fakeGemini.listen(0, host, resolve);
});
const openAIPort = fakeOpenAI.address().port;
const geminiPort = fakeGemini.address().port;

const child = spawn(process.execPath, ["server.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    HOST: host,
    PORT: port,
    VOCABULARY_STORE_PATH: join(temporaryDirectory, "vocabulary-store.json"),
    OPENAI_API_KEY: "smoke-test-key",
    OPENAI_BASE_URL: `http://${host}:${openAIPort}/v1`,
    GEMINI_API_KEY: "smoke-test-gemini-key",
    GEMINI_BASE_URL: `http://${host}:${geminiPort}/v1beta`,
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
  if (!health.providers?.openai || !health.providers?.gemini) {
    throw new Error(`Health endpoint did not report both providers: ${JSON.stringify(health.providers)}`);
  }

  const transcription = await fetch(`${baseUrl}/api/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "audio/webm;codecs=opus" },
    body: Buffer.from("fake-browser-audio"),
  });
  const transcriptionResult = await transcription.json();
  if (
    !transcription.ok
    || transcriptionResult.provider !== "gemini"
    || transcriptionResult.text !== "Yesterday I discussed the project with my manager."
  ) {
    throw new Error(`Gemini transcription fallback failed: ${JSON.stringify(transcriptionResult)}`);
  }

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
  // OpenAI is out of credit in this run, so a correct system answers on Gemini.
  if (!review.ok || reviewResult.provider !== "gemini" || reviewResult.review.nextActions.length !== 3) {
    throw new Error(`Quota fallback to Gemini failed: ${JSON.stringify(reviewResult)}`);
  }

  console.log(JSON.stringify({
    success: true,
    checks: [
      "health",
      "gemini-audio-transcription",
      "home",
      "protected-files",
      "webpage-capture",
      "vocabulary",
      "openai-quota-fallback-to-gemini",
    ],
    health,
  }, null, 2));
} finally {
  child.kill("SIGTERM");
  fakeOpenAI.close();
  fakeGemini.close();
}
