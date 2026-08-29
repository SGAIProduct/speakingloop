export function textOnlyFallbackReason(error) {
  return {
    provider: "demo",
    model: "demo_text_only",
    fallbackUsed: true,
    errorMessage: error?.message || String(error || "Provider unavailable"),
  };
}
