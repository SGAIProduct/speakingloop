export class DemoProvider {
  providerName = "demo";

  async generateText({ input }) {
    const text = input?.text || input?.messages?.at(-1)?.content || "";
    const lower = text.toLowerCase();
    const hasNegationIssue = /\b(can't|cannot|don't|doesn't|isn't|aren't)\b/.test(lower);
    return {
      content: [
        "Demo coach reply. The selected provider is unavailable, so SpeakingLook downgraded to text-only demo mode.",
        "",
        "Stop. Say it this way:",
        hasNegationIssue
          ? "I hope you can answer my question."
          : "The main risk is that users may trust fluent output as verified facts.",
        "",
        "Now repeat it.",
      ].join("\n"),
      raw: { demo: true },
    };
  }
}
