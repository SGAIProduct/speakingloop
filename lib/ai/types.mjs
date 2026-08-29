export const modelTaskTypes = [
  "realtime_speaking_coach",
  "live_transcription",
  "immediate_correction",
  "follow_up_question",
  "advanced_expression",
  "post_session_report",
  "tomorrow_review_planner",
  "vocabulary_phrase_extractor",
  "pronunciation_shadowing",
];

export const realtimeTaskTypes = new Set([
  "realtime_speaking_coach",
  "immediate_correction",
  "follow_up_question",
  "advanced_expression",
  "pronunciation_shadowing",
]);

export const batchTaskTypes = new Set([
  "post_session_report",
  "tomorrow_review_planner",
  "vocabulary_phrase_extractor",
]);

export const planLimits = {
  free: {
    dailyVoiceMinutes: Number(process.env.FREE_DAILY_VOICE_MINUTES || 10),
    dailyErrorCards: Number(process.env.FREE_DAILY_ERROR_CARDS || 3),
    dailyReviewTasks: Number(process.env.FREE_DAILY_REVIEW_TASKS || 3),
    dailyTTSSentences: Number(process.env.FREE_DAILY_TTS_SENTENCES || 3),
  },
  basic: {
    dailyVoiceMinutes: Number(process.env.BASIC_DAILY_VOICE_MINUTES || 30),
    dailyErrorCards: 20,
    dailyReviewTasks: 20,
    dailyTTSSentences: 10,
  },
  pro: {
    dailyVoiceMinutes: Number(process.env.PRO_DAILY_VOICE_MINUTES || 60),
    dailyErrorCards: 60,
    dailyReviewTasks: 60,
    dailyTTSSentences: 30,
  },
  premium: {
    dailyVoiceMinutes: Number(process.env.PREMIUM_DAILY_VOICE_MINUTES || 90),
    dailyErrorCards: 120,
    dailyReviewTasks: 120,
    dailyTTSSentences: 60,
  },
};

export function countApproxTokens(text) {
  return Math.max(1, Math.ceil(String(text || "").trim().split(/\s+/).filter(Boolean).length * 1.25));
}
