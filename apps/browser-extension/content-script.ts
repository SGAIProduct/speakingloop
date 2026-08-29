// TypeScript source contract for the no-build content-script.js runtime.
export type SelectionCapture = {
  expression: string;
  contextSentence: string;
};

export type CaptionMoment = SelectionCapture & {
  pronunciation?: string;
  partOfSpeech?: string;
  meaningZh?: string;
  sourceTitle?: string;
  sourceUrl?: string;
};

export type DictionaryEntry = {
  lemma: string;
  pronunciation: string;
  partOfSpeech: string;
  meaningZh: string;
  source: "local_dictionary" | "server_dictionary" | "local_fallback";
};

export type ContextEnrichmentKey = `${string}::${string}`;

export const hoverContextDebounceMs = 200;
