// SpeakLoop runs on OpenAI only.
// The multi-provider router (Qwen / Gemini / Ollama) was removed so that every
// task has exactly one predictable path and the demo never silently degrades
// into a local model that produces weaker English coaching.

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
  // Kept so the demo can fall back to a canned reply instead of a blank screen
  // when OpenAI is unreachable mid-presentation. Off by default.
  ENABLE_MODEL_FALLBACK: process.env.ENABLE_MODEL_FALLBACK === "true",
};

export const modelEnv = {
  OPENAI_REALTIME_MODEL: process.env.OPENAI_REALTIME_MODEL || "gpt-5.5",
  OPENAI_TRANSCRIPTION_MODEL: process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-transcribe",
  OPENAI_TEXT_MODEL_STRONG: process.env.OPENAI_TEXT_MODEL_STRONG || "gpt-5.5",
  OPENAI_TEXT_MODEL_MID: process.env.OPENAI_TEXT_MODEL_MID || "gpt-5.5",
  OPENAI_TEXT_MODEL_MINI: process.env.OPENAI_TEXT_MODEL_MINI || "gpt-5.4-mini",
  OPENAI_TTS_MODEL: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
};

const modelKeysByTask = {
  realtime_speaking_coach: "OPENAI_REALTIME_MODEL",
  live_transcription: "OPENAI_TRANSCRIPTION_MODEL",
  immediate_correction: "OPENAI_TEXT_MODEL_MID",
  follow_up_question: "OPENAI_TEXT_MODEL_MID",
  advanced_expression: "OPENAI_TEXT_MODEL_MID",
  post_session_report: "OPENAI_TEXT_MODEL_MINI",
  tomorrow_review_planner: "OPENAI_TEXT_MODEL_MINI",
  vocabulary_phrase_extractor: "OPENAI_TEXT_MODEL_MINI",
  pronunciation_shadowing: "OPENAI_TTS_MODEL",
};

export function modelEnvKeyFor(taskType) {
  return modelKeysByTask[taskType] || "OPENAI_TEXT_MODEL_MID";
}

function route(taskType) {
  return { provider: "openai", modelEnvKey: modelEnvKeyFor(taskType) };
}

const defaultRoutes = Object.fromEntries(
  Object.keys(modelKeysByTask).map((taskType) => [taskType, route(taskType)]),
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
