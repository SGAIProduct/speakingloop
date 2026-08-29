export function createVocabularyPrompt(transcript) {
  return {
    taskType: "vocabulary_phrase_extractor",
    text: `Extract high-value words, phrases, and reusable patterns as strict JSON:\n${transcript}`,
  };
}
