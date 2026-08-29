import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

function loadLocalEnv(envPath = join(process.cwd(), ".env")) {
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key] !== undefined && process.env[key] !== "") continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);
    process.env[key] = value;
  }
}

loadLocalEnv();

const { ModelRouter } = await import("./lib/ai/model-router.mjs");
const { modelRoutingConfig, envDefaults, modelEnv, providerAvailability } = await import(
  "./lib/ai/model-routing-config.mjs"
);
const { generateTTSWithCache } = await import("./lib/ai/tts-generator.mjs");
const { createCaptureEvent, createVocabularyCard } = await import(
  "./lib/capture/capture-service.mjs"
);
const {
  createVocabularyEnhancementPrompt,
  heuristicEnhancement,
  parseEnhancement,
} = await import("./lib/vocabulary/enhance-vocabulary.mjs");
const { VocabularyStore } = await import("./lib/vocabulary/vocabulary-store.mjs");
const {
  buildReviewTasks,
  dueVocabularyCards,
  recordVocabularyUsage,
} = await import("./lib/review/vocabulary-review.mjs");

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4173);
const root = process.cwd();
const modelRouter = new ModelRouter();
const contextLookupCache = new Map();
const vocabularyStore = new VocabularyStore(
  process.env.VOCABULARY_STORE_PATH || join(root, "data", "vocabulary-store.json"),
);
const openAIVoices = {
  Samantha: {
    voice: "coral",
    instructions: "Speak in a clear, warm native US English accent at a natural teaching pace.",
  },
  Daniel: {
    voice: "coral",
    instructions: "Speak in a clear, warm native British English accent at a natural teaching pace.",
  },
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    ...headers,
  });
  response.end(body);
}

function sendJson(response, status, value) {
  send(response, status, JSON.stringify(value), {
    "Content-Type": "application/json; charset=utf-8",
  });
}

async function readJson(request) {
  const buffer = await readBuffer(request);
  if (!buffer.length) return {};
  return JSON.parse(buffer.toString("utf-8"));
}

async function readBuffer(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0);
}

async function handleAIChat(request, response) {
  try {
    loadLocalEnv();
    const body = await readJson(request);
    const result = await modelRouter.run({
      taskType: body.taskType || "realtime_speaking_coach",
      userPlan: body.userPlan || "free",
      preferredProvider: body.preferredProvider || "auto",
      preferredModel: body.preferredModel,
      input: {
        text: body.text,
        messages: body.messages || [],
      },
      metadata: {
        userId: body.userId || "local_user",
        sessionId: body.sessionId || "local_session",
        language: "en",
        costSensitive: body.userPlan === "free",
      },
    });
    send(response, result.success ? 200 : 502, JSON.stringify(result), {
      "Content-Type": "application/json; charset=utf-8",
    });
  } catch (error) {
    send(
      response,
      500,
      JSON.stringify({ error: "Model router failed", detail: error.message }),
      { "Content-Type": "application/json; charset=utf-8" },
    );
  }
}

function parseReviewResult(value) {
  const text = String(value || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const parsed = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text);
  return {
    summary: String(parsed.summary || "Review generated."),
    topIssue: String(parsed.topIssue || "Keep sentences short and speakable."),
    nextActions: Array.isArray(parsed.nextActions)
      ? parsed.nextActions.map((item) => String(item).trim()).filter(Boolean).slice(0, 3)
      : [],
    practicePrompt: String(parsed.practicePrompt || "Explain the same idea again in two short sentences."),
  };
}

async function handleAIReview(request, response) {
  try {
    loadLocalEnv();
    const body = await readJson(request);
    const transcript = String(body.transcript || "").trim();
    if (!transcript) {
      sendJson(response, 400, { success: false, error: "A session transcript is required" });
      return;
    }
    if (transcript.length > 12000) {
      sendJson(response, 400, { success: false, error: "Transcript must be 12,000 characters or fewer" });
      return;
    }

    const prompt = `Analyze this English speaking session for a Chinese-speaking intermediate learner.
Return strict JSON only with this shape:
{
  "summary": "one concise sentence about progress",
  "topIssue": "the single highest-priority speaking issue",
  "nextActions": ["action 1", "action 2", "action 3"],
  "practicePrompt": "one short speaking prompt for tomorrow"
}

Keep every item practical, specific, and speakable. Do not use markdown.

Session transcript:
${transcript}`;
    const result = await modelRouter.run({
      taskType: "tomorrow_review_planner",
      userPlan: body.userPlan || "free",
      preferredProvider: "auto",
      input: {
        text: prompt,
        messages: [
          { role: "system", content: "You are SpeakLoop's concise post-session speaking reviewer. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
      },
      metadata: {
        userId: body.userId || "local_user",
        sessionId: body.sessionId || `review_${Date.now()}`,
        language: "en",
        costSensitive: true,
      },
    });
    if (!result.success) {
      sendJson(response, 502, result);
      return;
    }
    sendJson(response, 200, {
      success: true,
      review: parseReviewResult(result.result),
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
      route: result.route,
    });
  } catch (error) {
    sendJson(response, 500, { success: false, error: "Review generation failed", detail: error.message });
  }
}

async function handleOpenAITTS(request, response) {
  loadLocalEnv();
  const start = Date.now();
  const model = modelEnv.OPENAI_TTS_MODEL;
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const currentOpenAIOrigin = (process.env.OPENAI_BASE_URL || modelEnv.OPENAI_BASE_URL).replace(/\/$/, "");
    const body = await readJson(request);
    const text = String(body.text || "").replace(/\s+/g, " ").trim();
    const voiceProfile = openAIVoices[body.voice] || openAIVoices.Samantha;
    if (!text) {
      sendJson(response, 400, { success: false, error: "TTS text is required" });
      return;
    }
    if (text.length > 500) {
      sendJson(response, 400, { success: false, error: "TTS text must be 500 characters or fewer" });
      return;
    }
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const result = await generateTTSWithCache(
      {
        text,
        voice: voiceProfile.voice,
        accent: body.voice === "Daniel" ? "en-GB" : "en-US",
        provider: "openai",
        model,
      },
      async () => {
        const upstream = await fetch(`${currentOpenAIOrigin}/audio/speech`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            input: text,
            voice: voiceProfile.voice,
            instructions: voiceProfile.instructions,
            response_format: "wav",
          }),
        });
        if (!upstream.ok) {
          const detail = await upstream.text();
          throw new Error(detail || `OpenAI TTS returned ${upstream.status}`);
        }
        return {
          audio: Buffer.from(await upstream.arrayBuffer()),
          contentType: upstream.headers.get("content-type") || "audio/wav",
        };
      },
    );

    modelRouter.logExternalCall({
      taskType: "pronunciation_shadowing",
      provider: "openai",
      model,
      latencyMs: Date.now() - start,
      success: true,
      cached: result.cached,
    });
    send(response, 200, result.audio, {
      "Content-Type": result.contentType,
      "Cache-Control": "private, max-age=86400",
      "X-SpeakLoop-Provider": "openai",
      "X-SpeakLoop-Model": model,
      "X-SpeakLoop-Cached": String(result.cached),
    });
  } catch (error) {
    modelRouter.logExternalCall({
      taskType: "pronunciation_shadowing",
      provider: "openai",
      model,
      latencyMs: Date.now() - start,
      success: false,
      errorMessage: error.message,
    });
    sendJson(response, 503, {
      success: false,
      error: "OpenAI TTS is unavailable",
      detail: error.message,
    });
  }
}

async function handleOpenAITranscription(request, response) {
  loadLocalEnv();
  const start = Date.now();
  const model = modelEnv.OPENAI_TRANSCRIPTION_MODEL;
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const currentOpenAIOrigin = (process.env.OPENAI_BASE_URL || modelEnv.OPENAI_BASE_URL).replace(/\/$/, "");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    const audio = await readBuffer(request);
    if (!audio.length) {
      sendJson(response, 400, { success: false, error: "Audio is required" });
      return;
    }
    const contentType = request.headers["content-type"] || "audio/webm";
    const extension = contentType.includes("mp4") ? "m4a" : contentType.includes("wav") ? "wav" : "webm";
    const form = new FormData();
    form.append("file", new Blob([audio], { type: contentType }), `speech.${extension}`);
    form.append("model", model);
    form.append("language", "en");
    form.append(
      "prompt",
      "English speaking practice about product management, AI, interviews, meetings, and daily conversation.",
    );

    const upstream = await fetch(`${currentOpenAIOrigin}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!upstream.ok) {
      const detail = await upstream.text();
      throw new Error(detail || `OpenAI transcription returned ${upstream.status}`);
    }
    const data = await upstream.json();
    const text = String(data.text || "").trim();
    modelRouter.logExternalCall({
      taskType: "live_transcription",
      provider: "openai",
      model,
      latencyMs: Date.now() - start,
      success: true,
    });
    sendJson(response, 200, {
      success: true,
      provider: "openai",
      model,
      text,
      latencyMs: Date.now() - start,
    });
  } catch (error) {
    modelRouter.logExternalCall({
      taskType: "live_transcription",
      provider: "openai",
      model,
      latencyMs: Date.now() - start,
      success: false,
      errorMessage: error.message,
    });
    sendJson(response, 503, {
      success: false,
      error: "OpenAI transcription is unavailable",
      detail: error.message,
    });
  }
}

async function handleVocabularyCapture(request, response) {
  try {
    const body = await readJson(request);
    const card = createVocabularyCard(body);
    const event = createCaptureEvent(card, body);
    const captured = await vocabularyStore.capture(card, event);
    sendJson(response, captured.duplicate ? 200 : 201, {
      success: true,
      duplicate: captured.duplicate,
      cardId: captured.card.id,
      expression: captured.card.expression,
      expressionType: captured.card.expressionType,
      message: captured.duplicate ? "Already in SpeakLoop" : "Added to SpeakLoop",
      card: captured.card,
    });
  } catch (error) {
    sendJson(response, 400, { success: false, error: error.message });
  }
}

async function handleVocabularyEnhance(request, response) {
  try {
    const body = await readJson(request);
    const card = await vocabularyStore.getCard(body.cardId);
    if (!card) {
      sendJson(response, 404, { success: false, error: "Vocabulary card not found" });
      return;
    }

    let enhancement = heuristicEnhancement(card);
    let enhanced = false;
    let enhancementError = "";
    try {
      const prompt = createVocabularyEnhancementPrompt(card);
      const result = await modelRouter.run({
        taskType: "vocabulary_phrase_extractor",
        userPlan: "free",
        preferredProvider: "auto",
        preferredModel: modelEnv.OPENAI_TEXT_MODEL_MINI,
        input: {
          text: prompt,
          messages: [
            {
              role: "system",
              content: "You create concise English-learning vocabulary cards and return strict JSON only.",
            },
            { role: "user", content: prompt },
          ],
        },
        metadata: {
          userId: card.userId,
          sessionId: `vocabulary_${card.id}`,
          language: "en",
          costSensitive: true,
        },
      });
      if (!result.success) {
        throw new Error(result.errorMessage || "OpenAI did not return a card");
      }
      enhancement = parseEnhancement(result.result, card);
      enhanced = true;
    } catch (error) {
      // The heuristic card stays usable, but the UI is told the translation did
      // not actually run so it can show a retry instead of a fake definition.
      enhancementError = error.message;
    }

    const updated = await vocabularyStore.updateCard(card.id, { ...enhancement, enhanced });
    sendJson(response, enhanced ? 200 : 502, {
      success: enhanced,
      enhanced,
      error: enhancementError || undefined,
      cardId: card.id,
      card: updated,
      ...enhancement,
    });
  } catch (error) {
    sendJson(response, 500, { success: false, error: error.message });
  }
}

async function handleContextLookup(request, response) {
  try {
    const body = await readJson(request);
    const card = createVocabularyCard({
      expression: body.expression,
      contextSentence: body.contextSentence,
      sourceType: "browser_video",
      captureMethod: "context_hover_lookup",
      userId: body.userId || "local_user",
    });
    const lemma = String(body.lemma || card.expression).toLowerCase().replace(/[^a-z]+/g, "");
    const contextHash = String(body.contextHash || "no_context");
    const cacheKey = `${lemma}::${contextHash}`;
    const cached = contextLookupCache.get(cacheKey);
    if (cached) {
      sendJson(response, 200, { ...cached, cached: true });
      return;
    }
    let enhancement = heuristicEnhancement(card);
    let contextMeaningZh = enhancement.meaningZh;
    let phraseCandidates = [];
    try {
      const prompt = `Return strict JSON only for an English learner.
Word: ${card.expression}
Sentence: ${card.contextSentence || "No context supplied"}

Required JSON keys:
meaningZh, contextMeaningZh, pronunciation, partOfSpeech, phraseCandidates

Rules:
- meaningZh is the short basic Simplified Chinese definition.
- contextMeaningZh is the meaning specifically in this sentence.
- phraseCandidates is an array of up to 3 useful multi-word phrases from the sentence that include or relate to the word.
- Do not use markdown.`;
      const result = await modelRouter.run({
        taskType: "vocabulary_phrase_extractor",
        userPlan: "free",
        preferredProvider: "auto",
        preferredModel: modelEnv.OPENAI_TEXT_MODEL_MINI,
        input: {
          text: prompt,
          messages: [
            {
              role: "system",
              content: "You create concise English-learning vocabulary cards and return strict JSON only.",
            },
            { role: "user", content: prompt },
          ],
        },
        metadata: {
          userId: card.userId,
          sessionId: `context_lookup_${Date.now()}`,
          language: "en",
          costSensitive: true,
        },
      });
      if (result.success) {
        const text = String(result.result || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        const parsed = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text);
        enhancement = {
          ...enhancement,
          meaningZh: String(parsed.meaningZh || enhancement.meaningZh),
          pronunciation: String(parsed.pronunciation || enhancement.pronunciation),
          partOfSpeech: String(parsed.partOfSpeech || enhancement.partOfSpeech),
        };
        contextMeaningZh = String(parsed.contextMeaningZh || enhancement.meaningZh);
        phraseCandidates = Array.isArray(parsed.phraseCandidates)
          ? parsed.phraseCandidates.map((item) => String(item).trim()).filter(Boolean).slice(0, 3)
          : [];
      }
    } catch {
      // The local dictionary remains visible when context enrichment is unavailable.
    }
    const payload = {
      success: true,
      expression: card.expression,
      lemma,
      contextHash,
      cacheKey,
      contextSentence: card.contextSentence,
      contextMeaningZh,
      phraseCandidates,
      ...enhancement,
      cached: false,
    };
    contextLookupCache.set(cacheKey, payload);
    if (contextLookupCache.size > 1000) {
      contextLookupCache.delete(contextLookupCache.keys().next().value);
    }
    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, 400, { success: false, error: error.message });
  }
}

async function handleDictionaryBatch(request, response) {
  try {
    const body = await readJson(request);
    const expressions = Array.from(
      new Set((Array.isArray(body.expressions) ? body.expressions : []).map((item) => String(item || "").trim()).filter(Boolean)),
    ).slice(0, 100);
    const entries = {};
    for (const expression of expressions) {
      const card = createVocabularyCard({ expression, userId: "local_user" });
      const lemma = expression.toLowerCase().replace(/[^a-z]+/g, "");
      entries[lemma] = { lemma, ...heuristicEnhancement(card), source: "server_dictionary" };
    }
    sendJson(response, 200, { success: true, entries });
  } catch (error) {
    sendJson(response, 400, { success: false, error: error.message });
  }
}

async function handleVocabularyList(response, url) {
  const userId = url.searchParams.get("userId") || "local_user";
  const cards = await vocabularyStore.listCards({ userId });
  sendJson(response, 200, { success: true, cards });
}

async function handleVocabularyDelete(response, cardId) {
  const deleted = await vocabularyStore.deleteCard(cardId);
  sendJson(response, deleted ? 200 : 404, {
    success: deleted,
    message: deleted ? "Vocabulary card deleted" : "Vocabulary card not found",
  });
}

async function handleVocabularyUsage(response, cardId) {
  const card = await vocabularyStore.getCard(cardId);
  if (!card) {
    sendJson(response, 404, { success: false, error: "Vocabulary card not found" });
    return;
  }
  const updated = await vocabularyStore.updateCard(cardId, recordVocabularyUsage(card));
  sendJson(response, 200, { success: true, card: updated });
}

async function handleVocabularyReview(response) {
  const cards = await vocabularyStore.listCards();
  const dueCards = dueVocabularyCards(cards);
  sendJson(response, 200, {
    success: true,
    cards: dueCards.map((card) => ({ ...card, tasks: buildReviewTasks(card) })),
  });
}

function handleRouterConfig(response) {
  loadLocalEnv();
  send(
    response,
    200,
    JSON.stringify({
      envDefaults,
      modelEnv,
      modelRoutingConfig,
      openAIConfigured: Boolean(process.env.OPENAI_API_KEY),
      providers: providerAvailability(),
      logs: modelRouter.logs(),
    }),
    { "Content-Type": "application/json; charset=utf-8" },
  );
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${host}:${port}`);
  const rawPath = url.pathname === "/" ? "index.html" : url.pathname;
  const safePath = normalize(decodeURIComponent(rawPath))
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]+/, "");
  if (safePath !== "index.html" && !safePath.startsWith("src/")) {
    send(response, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  const filePath = join(root, safePath);

  try {
    const body = await readFile(filePath);
    send(response, 200, body, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    });
  } catch {
    send(response, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);

  if (request.method === "OPTIONS") {
    send(response, 204, "");
    return;
  }

  if (url.pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, {
      status: "ok",
      product: "SpeakLoop",
      version: "0.1.0",
      providers: providerAvailability(),
      openAIConfigured: Boolean(process.env.OPENAI_API_KEY),
      uptimeSeconds: Math.round(process.uptime()),
    });
    return;
  }

  if (url.pathname === "/api/ai/chat" && request.method === "POST") {
    await handleAIChat(request, response);
    return;
  }

  if (url.pathname === "/api/review/generate" && request.method === "POST") {
    await handleAIReview(request, response);
    return;
  }

  if (url.pathname === "/api/tts" && request.method === "POST") {
    await handleOpenAITTS(request, response);
    return;
  }

  if (url.pathname === "/api/transcribe" && request.method === "POST") {
    await handleOpenAITranscription(request, response);
    return;
  }

  if (url.pathname === "/api/capture" && request.method === "POST") {
    await handleVocabularyCapture(request, response);
    return;
  }

  if (url.pathname === "/api/vocabulary/enhance" && request.method === "POST") {
    await handleVocabularyEnhance(request, response);
    return;
  }

  if (url.pathname === "/api/context/lookup" && request.method === "POST") {
    await handleContextLookup(request, response);
    return;
  }

  if (url.pathname === "/api/context/dictionary-batch" && request.method === "POST") {
    await handleDictionaryBatch(request, response);
    return;
  }

  if (url.pathname === "/api/vocabulary" && request.method === "GET") {
    await handleVocabularyList(response, url);
    return;
  }

  const vocabularyMatch = url.pathname.match(/^\/api\/vocabulary\/([^/]+)$/);
  if (vocabularyMatch && request.method === "DELETE") {
    await handleVocabularyDelete(response, vocabularyMatch[1]);
    return;
  }

  const usageMatch = url.pathname.match(/^\/api\/vocabulary\/([^/]+)\/usage$/);
  if (usageMatch && request.method === "POST") {
    await handleVocabularyUsage(response, usageMatch[1]);
    return;
  }

  if (url.pathname === "/api/review/vocabulary" && request.method === "GET") {
    await handleVocabularyReview(response);
    return;
  }

  if (url.pathname === "/api/ai/routing-config") {
    handleRouterConfig(response);
    return;
  }

  if (url.pathname === "/api/ai/logs") {
    send(response, 200, JSON.stringify(modelRouter.logs()), {
      "Content-Type": "application/json; charset=utf-8",
    });
    return;
  }

  await serveStatic(request, response);
}).listen(port, host, () => {
  console.log(`SpeakLoop running at http://${host}:${port}`);
  const available = providerAvailability();
  console.log(`OpenAI configured: ${available.openai}`);
  console.log(`Gemini configured: ${available.gemini}${available.gemini ? " (free tier fallback)" : ""}`);
  if (!available.openai && !available.gemini) {
    console.log("WARNING: no model provider configured — coaching and vocabulary cards will fail.");
  }
  console.log("Model path enabled at /api/ai/chat (OpenAI preferred, Gemini fallback)");
  console.log("OpenAI transcription enabled at /api/transcribe");
  console.log("Cached OpenAI TTS enabled at /api/tts");
  console.log("Global vocabulary capture enabled at /api/capture");
});
