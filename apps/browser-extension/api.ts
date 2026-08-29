export type CaptureRequest = {
  expression: string;
  contextSentence?: string;
  sourceType: "webpage";
  sourceTitle?: string;
  sourceUrl?: string;
  captureMethod: "browser_context_menu";
  userId: string;
};

export const apiBaseUrl = "http://127.0.0.1:4173";
