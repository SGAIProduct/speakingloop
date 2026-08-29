import { planLimits } from "./types.mjs";

export class UsageLimiter {
  constructor() {
    this.daily = new Map();
  }

  key(userId) {
    return `${userId || "anonymous"}:${new Date().toISOString().slice(0, 10)}`;
  }

  get(userId, userPlan = "free") {
    const key = this.key(userId);
    if (!this.daily.has(key)) {
      this.daily.set(key, {
        userId: userId || "anonymous",
        userPlan,
        voiceMinutesUsed: 0,
        errorCardsCreated: 0,
        reviewTasksCreated: 0,
        ttsSentencesGenerated: 0,
        totalCostUsd: 0,
      });
    }
    return this.daily.get(key);
  }

  check({ userId, userPlan, taskType }) {
    const usage = this.get(userId, userPlan);
    const limits = planLimits[userPlan] || planLimits.free;
    if (userPlan === "free" && taskType === "realtime_speaking_coach" && usage.voiceMinutesUsed >= limits.dailyVoiceMinutes) {
      return { allowed: false, reason: "Free daily voice minutes exceeded" };
    }
    return { allowed: true, usage, limits };
  }

  addCost(userId, amount) {
    const usage = this.get(userId);
    usage.totalCostUsd += amount || 0;
  }
}
