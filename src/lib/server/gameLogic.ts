export const BADGE_IDS = {
  FIRST_QUEST_COMPLETED: 1,
  SILVER_TREASURER: 2,
  GOLDEN_TREASURER: 3,
  TRIAL_PASSED: 4,
  TREASURE_GUARDIAN: 5,
} as const;

export function calculateLevelFromXp(totalXp: number): number {
  if (totalXp >= 3000) {
    return 4;
  }
  if (totalXp >= 1500) {
    return 3;
  }
  if (totalXp >= 500) {
    return 2;
  }
  return 1;
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function calculateNextStreakDays(
  lastActive: string | null,
  currentStreak: number,
  now: Date = new Date()
): number {
  if (!lastActive) {
    return 1;
  }

  const lastActiveDate = new Date(lastActive);
  if (Number.isNaN(lastActiveDate.getTime())) {
    return 1;
  }

  const diffDays =
    (startOfUtcDay(now) - startOfUtcDay(lastActiveDate)) / 86_400_000;

  if (diffDays <= 0) {
    return Math.max(currentStreak, 1);
  }

  if (diffDays === 1) {
    return currentStreak + 1;
  }

  return 1;
}

export function isBossBattleQuest(questId: string): boolean {
  const normalized = questId.toLowerCase();
  return ["boss", "trial", "proba", "skarbnik"].some((keyword) =>
    normalized.includes(keyword)
  );
}
