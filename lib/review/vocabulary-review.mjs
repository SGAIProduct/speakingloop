const masteryOrder = ["new", "learning", "familiar", "active", "mastered"];

export function buildReviewTasks(card) {
  return [
    { type: "recognition", prompt: `Choose the Chinese meaning of "${card.expression}".` },
    { type: "recall", prompt: `Say the English expression for: ${card.meaningZh || "this meaning"}.` },
    { type: "sentence", prompt: `Make a sentence with "${card.expression}" in your own work or life.` },
    { type: "shadowing", prompt: `Listen and repeat three times: ${card.spokenExample || card.expression}` },
    { type: "speaking_reuse", prompt: `Use "${card.expression}" in your next speaking practice.` },
  ];
}

export function dueVocabularyCards(cards, date = new Date()) {
  const today = date.toISOString().slice(0, 10);
  return cards.filter(
    (card) =>
      card.masteryLevel !== "mastered" &&
      (card.masteryLevel === "new" || card.nextReviewDate <= today),
  );
}

export function recordVocabularyUsage(card) {
  const usageCount = Number(card.usageCount || 0) + 1;
  const currentIndex = Math.max(0, masteryOrder.indexOf(card.masteryLevel));
  const milestones = [0, 1, 3, 6, 12];
  const nextIndex = milestones.reduce(
    (index, minimum, candidate) => (usageCount >= minimum ? candidate : index),
    currentIndex,
  );
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + (nextIndex >= 3 ? 7 : nextIndex >= 2 ? 3 : 1));
  return {
    usageCount,
    masteryLevel: masteryOrder[Math.min(nextIndex, masteryOrder.length - 1)],
    nextReviewDate: nextReview.toISOString().slice(0, 10),
  };
}
