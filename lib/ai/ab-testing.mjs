export const firstPhaseABTest = {
  testId: "realtime-provider-v1",
  taskType: "realtime_speaking_coach",
  variants: [
    { name: "openai_realtime", provider: "openai", model: "gpt-realtime-2", trafficPercentage: 34 },
    { name: "gemini_live", provider: "gemini", model: "gemini_live_model", trafficPercentage: 33 },
    { name: "qwen_omni", provider: "qwen", model: "qwen_omni_model", trafficPercentage: 33 },
  ],
  successMetrics: [
    "time_to_first_response",
    "time_to_interruption",
    "correction_accuracy",
    "voice_naturalness_score",
    "cost_per_minute",
  ],
  enabled: process.env.ENABLE_AB_TESTING === "true",
};
