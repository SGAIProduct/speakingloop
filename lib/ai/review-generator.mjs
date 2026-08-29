export const tomorrowReviewSchemaName = "TomorrowReviewJSON";

export function createReviewPrompt(reportJson) {
  return {
    taskType: "tomorrow_review_planner",
    text: `Return strict JSON following TomorrowReviewJSON from this report:\n${JSON.stringify(reportJson)}`,
  };
}
