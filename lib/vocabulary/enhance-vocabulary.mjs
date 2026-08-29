const tagRules = [
  ["AI Terms", /\b(ai|llm|model|rag|prompt|ground|hallucinat|embedding|agent)\b/i],
  ["PM Expressions", /\b(product|roadmap|trade-?off|prioriti|user need|metric|stakeholder)\b/i],
  ["Business Phrases", /\b(revenue|cost|market|strategy|business|growth|risk)\b/i],
  ["Meeting Language", /\b(push back|align|agree|disagree|follow up|circle back)\b/i],
  ["Presentation Phrases", /\b(in the long run|first of all|the key point|not only)\b/i],
];

const offlineGlossary = {
  "email": { meaningZh: "电子邮件", pronunciation: "/ˈiːmeɪl/", partOfSpeech: "noun" },
  "service": { meaningZh: "服务", pronunciation: "/ˈsɜːrvɪs/", partOfSpeech: "noun" },
  "email service": { meaningZh: "电子邮件服务", pronunciation: "/ˈiːmeɪl ˈsɜːrvɪs/", partOfSpeech: "noun phrase" },
  "spam": { meaningZh: "垃圾邮件", pronunciation: "/spæm/", partOfSpeech: "noun" },
  "likely": { meaningZh: "很可能；可能的", pronunciation: "/ˈlaɪkli/", partOfSpeech: "adverb / adjective" },
  "probably": { meaningZh: "很可能；大概", pronunciation: "/ˈprɒbəbli/", partOfSpeech: "adverb" },
  "special": { meaningZh: "特殊的；特别的", pronunciation: "/ˈspeʃəl/", partOfSpeech: "adjective" },
  "relativity": { meaningZh: "相对论；相对性", pronunciation: "/ˌreləˈtɪvəti/", partOfSpeech: "noun" },
  "sleep": { meaningZh: "睡觉；睡眠", pronunciation: "/sliːp/", partOfSpeech: "verb / noun" },
  "issue": { meaningZh: "问题；议题", pronunciation: "/ˈɪʃuː/", partOfSpeech: "noun" },
  "work": { meaningZh: "工作；起作用", pronunciation: "/wɜːrk/", partOfSpeech: "noun / verb" },
  "underestimate": { meaningZh: "低估", pronunciation: "/ˌʌndərˈestɪmeɪt/", partOfSpeech: "verb" },
  "deploy ai systems reliably": { meaningZh: "可靠地部署 AI 系统", pronunciation: "", partOfSpeech: "phrase" },
  "decision latency": { meaningZh: "决策延迟", pronunciation: "/dɪˈsɪʒən ˈleɪtənsi/", partOfSpeech: "noun phrase" },
};

export function inferTags(card) {
  const source = `${card.expression} ${card.contextSentence || ""}`;
  const tags = tagRules.filter(([, pattern]) => pattern.test(source)).map(([tag]) => tag);
  if (!tags.length) tags.push(card.expressionType === "word" ? "Advanced Vocabulary" : "Daily Speaking");
  return tags;
}

export function createVocabularyEnhancementPrompt(card) {
  return `Return strict JSON only. Enrich this English learning card for a Chinese native speaker.
Expression: ${card.expression}
Type: ${card.expressionType}
Context: ${card.contextSentence || "No context supplied"}

Required JSON keys:
meaningZh, meaningEn, pronunciation, partOfSpeech, exampleSentence, spokenExample, reusablePattern, tags

Rules:
- meaningZh must be concise Simplified Chinese.
- meaningEn must be a plain-English definition.
- spokenExample must sound natural in conversation.
- reusablePattern may be empty when not useful.
- tags must be an array using only: AI Terms, PM Expressions, Business Phrases, Meeting Language, Presentation Phrases, Advanced Vocabulary, Daily Speaking.
- Do not use markdown.`;
}

export function parseEnhancement(raw, card) {
  const fallback = heuristicEnhancement(card);
  const text = String(raw || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const parsed = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text);
    return {
      meaningZh: String(parsed.meaningZh || fallback.meaningZh),
      meaningEn: String(parsed.meaningEn || fallback.meaningEn),
      pronunciation: String(parsed.pronunciation || ""),
      partOfSpeech: String(parsed.partOfSpeech || ""),
      exampleSentence: String(parsed.exampleSentence || fallback.exampleSentence),
      spokenExample: String(parsed.spokenExample || fallback.spokenExample),
      reusablePattern: String(parsed.reusablePattern || ""),
      tags: Array.isArray(parsed.tags) && parsed.tags.length ? parsed.tags.slice(0, 6) : fallback.tags,
    };
  } catch {
    return fallback;
  }
}

export function heuristicEnhancement(card) {
  const expression = card.expression;
  const glossary = offlineGlossary[String(expression || "").toLowerCase()];
  const example = card.contextSentence || `I want to use "${expression}" naturally in a real conversation.`;
  return {
    meaningZh: glossary?.meaningZh || "联系原句理解；保存后由 GPT 补充释义",
    meaningEn: `A saved ${card.expressionType} that the learner wants to understand and reuse.`,
    pronunciation: glossary?.pronunciation || "",
    partOfSpeech: glossary?.partOfSpeech || (card.expressionType === "word" ? "word" : card.expressionType),
    exampleSentence: example,
    spokenExample: `A useful way to say it is: ${expression}.`,
    reusablePattern: "",
    tags: inferTags(card),
  };
}
