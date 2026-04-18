import { QUESTS, isQuestUnlocked as isQuestUnlockedRaw } from "@/lib/quests";

/**
 * Server-side re-export so route handlers can gate quest-completion on the
 * same prerequisite graph the client UI uses. The client version is
 * advisory — it hides locked cards from the UI — but a malicious caller
 * can bypass it by POSTing directly to `/api/quests/complete`, so the
 * server MUST run the same check before accepting a completion.
 */
export function isQuestUnlocked(
  questId: string,
  completedQuestIds: readonly string[]
): boolean {
  return isQuestUnlockedRaw(questId, completedQuestIds);
}

export type QuestDefinition = {
  id: string;
  level: 1 | 2 | 3;
  xpReward: number;
  questionCount: number;
};

const QUESTS_BY_ID = new Map<string, QuestDefinition>(
  QUESTS.map((quest) => [
    quest.id,
    {
      id: quest.id,
      level: quest.level,
      xpReward: quest.xp,
      questionCount: quest.questions.length,
    },
  ])
);

export function getQuestDefinition(questId: string): QuestDefinition | null {
  const normalizedId = questId.trim();
  if (!normalizedId) {
    return null;
  }

  return QUESTS_BY_ID.get(normalizedId) ?? null;
}

export function normalizeScore(score: number | undefined, maxScore: number): number {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(maxScore, Math.floor(score)));
}

export function calculateQuestXp(quest: QuestDefinition, score: number): number {
  if (quest.questionCount <= 0) {
    return 0;
  }

  return Math.round((score * quest.xpReward) / quest.questionCount);
}
