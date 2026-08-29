export class GeminiProvider {
  providerName = "gemini";

  async generateText() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    throw new Error("Gemini provider stub is configured but not implemented in this static MVP");
  }
}
