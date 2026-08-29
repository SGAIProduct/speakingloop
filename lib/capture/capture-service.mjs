import { randomUUID } from "node:crypto";

const sentenceEnd = /[.!?。！？]$/;
const patternMarkers = /\b(?:x|y|z)\b|not only .+ but also|the more .+ the more/i;

export function normalizeExpression(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function classifyExpression(expression) {
  const normalized = normalizeExpression(expression);
  const words = normalized.split(/\s+/).filter(Boolean);
  if (patternMarkers.test(normalized)) return "pattern";
  if (words.length === 1) return "word";
  if (sentenceEnd.test(normalized) || words.length >= 8) return "sentence";
  return "phrase";
}

export function createVocabularyCard(payload = {}) {
  const expression = normalizeExpression(payload.expression);
  if (!expression) {
    throw new Error("Expression is required");
  }
  if (expression.length > 500) {
    throw new Error("Expression must be 500 characters or fewer");
  }

  const privateMode = Boolean(payload.privateMode);
  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + 1);

  return {
    id: `vocab_${randomUUID()}`,
    userId: normalizeExpression(payload.userId) || "local_user",
    expression,
    expressionType: classifyExpression(expression),
    meaningZh: "",
    meaningEn: "",
    pronunciation: "",
    partOfSpeech: "",
    exampleSentence: "",
    spokenExample: "",
    reusablePattern: "",
    sourceType: privateMode ? "manual" : normalizeExpression(payload.sourceType) || "manual",
    sourceTitle: privateMode ? "" : normalizeExpression(payload.sourceTitle),
    sourceUrl: privateMode ? "" : normalizeExpression(payload.sourceUrl),
    sourceFileName: privateMode ? "" : normalizeExpression(payload.sourceFileName),
    contextSentence: privateMode ? "" : normalizeExpression(payload.contextSentence),
    captureMethod: normalizeExpression(payload.captureMethod) || "manual",
    tags: [],
    masteryLevel: "new",
    reviewCount: 0,
    usageCount: 0,
    nextReviewDate: nextReview.toISOString().slice(0, 10),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function createCaptureEvent(card, payload = {}) {
  return {
    id: `capture_${randomUUID()}`,
    userId: card.userId,
    vocabularyCardId: card.id,
    expression: card.expression,
    sourceType: card.sourceType,
    sourceTitle: card.sourceTitle,
    sourceUrl: card.sourceUrl,
    sourceFileName: card.sourceFileName,
    captureMethod: card.captureMethod,
    appName: normalizeExpression(payload.appName),
    createdAt: new Date().toISOString(),
  };
}
