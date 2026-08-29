export const postSessionReportSchemaName = "PostSessionReportJSON";

export function createReportPrompt(transcript) {
  return {
    taskType: "post_session_report",
    text: `Return strict JSON following PostSessionReportJSON for this transcript:\n${transcript}`,
  };
}
