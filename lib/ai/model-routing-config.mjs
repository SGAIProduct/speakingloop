export const envDefaults = {
  DEFAULT_REALTIME_PROVIDER: process.env.DEFAULT_REALTIME_PROVIDER || "openai",
  DEFAULT_ASR_PROVIDER: process.env.DEFAULT_ASR_PROVIDER || "openai",
  DEFAULT_TEXT_PROVIDER: process.env.DEFAULT_TEXT_PROVIDER || "openai",
  DEFAULT_REPORT_PROVIDER: process.env.DEFAULT_REPORT_PROVIDER || "openai",
  DEFAULT_REVIEW_PROVIDER: process.env.DEFAULT_REVIEW_PROVIDER || "openai",
  DEFAULT_VOCAB_PROVIDER: process.env.DEFAULT_VOCAB_PROVIDER || "openai",
  DEFAULT_TTS_PROVIDER: process.env.DEFAULT_TTS_PROVIDER || "openai",
  ENABLE_QWEN: process.env.ENABLE_QWEN === "true",
  ENABLE_GEMINI: process.env.ENABLE_GEMINI === "true",
  QWEN_AS_FALLBACK: process.env.QWEN_AS_FALLBACK === "true",
  GEMINI_AS_FALLBACK: process.env.GEMINI_AS_FALLBACK === "true",
  ENABLE_MODEL_FALLBACK: process.env.ENABLE_MODEL_FALLBACK === "true",
  ENABLE_COST_TRACKING: process.env.ENABLE_COST_TRACKING !== "false",
  ENABLE_AUDIO_CACHE: process.env.ENABLE_AUDIO_CACHE !== "false",
  ENABLE_AB_TESTING:
    process.env.ENABLE_AB_TESTING === "true" &&
    (process.env.ENABLE_QWEN === "true" || process.env.ENABLE_GEMINI === "true"),
};

export const modelEnv = {
  OPENAI_REALTIME_MODEL: process.env.OPENAI_REALTIME_MODEL || "gpt-5.4-mini",
  OPENAI_TRANSCRIPTION_MODEL: process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-transcribe",
  OPENAI_TEXT_MODEL_STRONG: process.env.OPENAI_TEXT_MODEL_STRONG || "gpt-5.5",
  OPENAI_TEXT_MODEL_MID: process.env.OPENAI_TEXT_MODEL_MID || "gpt-5.4-mini",
  OPENAI_TEXT_MODEL_MINI: process.env.OPENAI_TEXT_MODEL_MINI || "gpt-5.4-mini",
  OPENAI_TTS_MODEL: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  GEMINI_REALTIME_MODEL: process.env.GEMINI_REALTIME_MODEL || "gemini_live_model",
  GEMINI_TEXT_MODEL_STANDARD: process.env.GEMINI_TEXT_MODEL_STANDARD || "gemini_standard_text_model",
  GEMINI_TEXT_MODEL_CHEAP: process.env.GEMINI_TEXT_MODEL_CHEAP || "gemini_cheap_text_model",
  GEMINI_TTS_MODEL: process.env.GEMINI_TTS_MODEL || "gemini_tts_model",
  QWEN_TEXT_MODEL_STANDARD:
    process.env.QWEN_TEXT_MODEL_STANDARD ||
    process.env.OLLAMA_QWEN_MODEL ||
    "qwen3:8b",
  QWEN_TEXT_MODEL_CHEAP: process.env.QWEN_TEXT_MODEL_CHEAP || "qwen3:8b",
  QWEN_ASR_MODEL: process.env.QWEN_ASR_MODEL || "qwen_asr_model",
  QWEN_TTS_MODEL: process.env.QWEN_TTS_MODEL || "qwen_tts_model",
  QWEN_OMNI_MODEL: process.env.QWEN_OMNI_MODEL || "qwen_omni_model",
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
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
  qwen: {
    post_session_report: "QWEN_TEXT_MODEL_STANDARD",
    tomorrow_review_planner: "QWEN_TEXT_MODEL_STANDARD",
    vocabulary_phrase_extractor: "QWEN_TEXT_MODEL_CHEAP",
  },
};

export function modelEnvKeyFor(taskType, provider = "openai") {
  return modelKeysByProvider[provider]?.[taskType] || modelKeysByProvider.openai[taskType] || "OPENAI_TEXT_MODEL_MID";
}

function route(taskType, provider = "openai") {
  return { provider, modelEnvKey: modelEnvKeyFor(taskType, provider) };
}

const defaultRoutes = {
  realtime_speaking_coach: route("realtime_speaking_coach"),
  live_transcription: route("live_transcription"),
  immediate_correction: route("immediate_correction"),
  follow_up_question: route("follow_up_question"),
  advanced_expression: route("advanced_expression"),
  post_session_report: route("post_session_report", envDefaults.DEFAULT_REPORT_PROVIDER),
  tomorrow_review_planner: route("tomorrow_review_planner", envDefaults.DEFAULT_REVIEW_PROVIDER),
  vocabulary_phrase_extractor: route("vocabulary_phrase_extractor", envDefaults.DEFAULT_VOCAB_PROVIDER),
  pronunciation_shadowing: route("pronunciation_shadowing"),
};

export const modelRoutingConfig = {
  premium: {
    ...defaultRoutes,
    post_session_report: route("post_session_report", envDefaults.DEFAULT_REPORT_PROVIDER),
  },
  pro: { ...defaultRoutes },
  basic: { ...defaultRoutes },
  free: { ...defaultRoutes },
};

export function resolveModel(envKey, preferredModel) {
  return preferredModel || modelEnv[envKey] || envKey;
}
