// SpeakLoop calls one provider at a time, chosen by which credential is present.
//
// OpenAI is preferred for quality. Gemini exists because its free tier needs no
// payment card, so the product still works when the OpenAI account has no
// credit — the exact situation this project hit the day before the demo.
// There is no third provider and no silent local model.

export const PROVIDERS = ["openai", "gemini"];

export const envDefaults = {
  DEFAULT_REALTIME_PROVIDER: "openai",
  DEFAULT_ASR_PROVIDER: "openai",
  DEFAULT_TEXT_PROVIDER: "openai",
  DEFAULT_REPORT_PROVIDER: "openai",
  DEFAULT_REVIEW_PROVIDER: "openai",
  DEFAULT_VOCAB_PROVIDER: "openai",
  DEFAULT_TTS_PROVIDER: "openai",
  ENABLE_COST_TRACKING: process.env.ENABLE_COST_TRACKING !== "false",
  ENABLE_AUDIO_CACHE: process.env.ENABLE_AUDIO_CACHE !== "false",
};

export const modelEnv = {
  OPENAI_REALTIME_MODEL: process.env.OPENAI_REALTIME_MODEL || "gpt-5.5",
  OPENAI_TRANSCRIPTION_MODEL: process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-transcribe",
  OPENAI_TEXT_MODEL_STRONG: process.env.OPENAI_TEXT_MODEL_STRONG || "gpt-5.5",
  OPENAI_TEXT_MODEL_MID: process.env.OPENAI_TEXT_MODEL_MID || "gpt-5.5",
  OPENAI_TEXT_MODEL_MINI: process.env.OPENAI_TEXT_MODEL_MINI || "gpt-5.4-mini",
  OPENAI_TTS_MODEL: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",

  // Free tier: 1,500 requests/day on Flash, no payment card required.
  GEMINI_TEXT_MODEL_STRONG: process.env.GEMINI_TEXT_MODEL_STRONG || "gemini-2.5-flash",
  GEMINI_TEXT_MODEL_MID: process.env.GEMINI_TEXT_MODEL_MID || "gemini-2.5-flash",
  GEMINI_TEXT_MODEL_MINI: process.env.GEMINI_TEXT_MODEL_MINI || "gemini-2.5-flash-lite",
  GEMINI_BASE_URL: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
};

const modelKeysByProvider = {
  openai: {
    realtime_speaking_coach: "OPENAI_REALTIME_MODEL",
    live_transcription: "OPENAI_TRANSCRIPTION_MODEL",
    immediate_correction: "OPENAI_TEXT_MODEL_MID",
    follow_up_question: "OPENAI_TEXT_MODEL_MID",
    advanced_expression: "OPENAI_TEXT_MODEL_MID",
    post_session_report: "OPENAI_TEXT_MODEL_MINI",
    tomorrow_review_planner: "OPENAI_TEXT_MODEL_MINI",
    vocabulary_phrase_extractor: "OPENAI_TEXT_MODEL_MINI",
    pronunciation_shadowing: "OPENAI_TTS_MODEL",
  },
  gemini: {
    realtime_speaking_coach: "GEMINI_TEXT_MODEL_STRONG",
    immediate_correction: "GEMINI_TEXT_MODEL_MID",
    follow_up_question: "GEMINI_TEXT_MODEL_MID",
    advanced_expression: "GEMINI_TEXT_MODEL_MID",
    post_session_report: "GEMINI_TEXT_MODEL_MINI",
    tomorrow_review_planner: "GEMINI_TEXT_MODEL_MINI",
    vocabulary_phrase_extractor: "GEMINI_TEXT_MODEL_MINI",
  },
};

export function modelEnvKeyFor(taskType, provider = "openai") {
  const table = modelKeysByProvider[provider] || modelKeysByProvider.openai;
  return table[taskType] || (provider === "gemini" ? "GEMINI_TEXT_MODEL_MID" : "OPENAI_TEXT_MODEL_MID");
}

function route(taskType) {
  return { provider: "openai", modelEnvKey: modelEnvKeyFor(taskType) };
}

const defaultRoutes = Object.fromEntries(
  Object.keys(modelKeysByProvider.openai).map((taskType) => [taskType, route(taskType)]),
);

export const modelRoutingConfig = {
  premium: { ...defaultRoutes },
  pro: { ...defaultRoutes },
  basic: { ...defaultRoutes },
  free: { ...defaultRoutes },
};

export function resolveModel(envKey, preferredModel) {
  return preferredModel || modelEnv[envKey] || envKey;
}

// Speech in and out is OpenAI-only, so the UI can tell the learner why the
// microphone is unavailable instead of failing silently on a Gemini-only setup.
export function providerAvailability() {
  return {
    openai: Boolean(process.env.OPENAI_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
  };
}
