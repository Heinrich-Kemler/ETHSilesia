/**
 * Shared badge mapping used by both server routes and client UI.
 *
 * Why this file exists:
 * - keeps quest -> badge ID mapping in one place
 * - prevents frontend/backend drift
 * - makes it easy to swap artwork later without changing on-chain IDs
 */

export const BADGE_MIN_ID = 1 as const;
export const BADGE_MAX_ID = 29 as const;

/**
 * One NFT badge for each quest in the chapter path.
 * IDs 12..26 are reserved for these per-quest completion badges.
 */
export const QUEST_COMPLETION_BADGES = [
  { questId: "l1-blockchain", badgeId: 12 },
  { questId: "l1-wallet", badgeId: 13 },
  { questId: "l1-usdc", badgeId: 14 },
  { questId: "l1-transaction", badgeId: 15 },
  { questId: "l1-gas", badgeId: 16 },
  { questId: "l2-defi", badgeId: 17 },
  { questId: "l2-dex", badgeId: 18 },
  { questId: "l2-yield", badgeId: 19 },
  { questId: "l2-liquidity", badgeId: 20 },
  { questId: "l2-smart", badgeId: 21 },
  { questId: "l3-il", badgeId: 22 },
  { questId: "l3-rwa", badgeId: 23 },
  { questId: "l3-risk", badgeId: 24 },
  { questId: "l3-rug", badgeId: 25 },
  { questId: "l3-boss", badgeId: 26 },
] as const;

/**
 * Level completion badges:
 * - 27: complete all level 1 quests
 * - 28: complete all level 2 quests
 * - 29: complete all level 3 quests
 */
export const LEVEL_COMPLETION_BADGE_RULES = [
  {
    badgeId: 27,
    level: 1 as const,
    requiredQuestIds: [
      "l1-blockchain",
      "l1-wallet",
      "l1-usdc",
      "l1-transaction",
      "l1-gas",
    ],
  },
  {
    badgeId: 28,
    level: 2 as const,
    requiredQuestIds: [
      "l2-defi",
      "l2-dex",
      "l2-yield",
      "l2-liquidity",
      "l2-smart",
    ],
  },
  {
    badgeId: 29,
    level: 3 as const,
    requiredQuestIds: ["l3-il", "l3-rwa", "l3-risk", "l3-rug", "l3-boss"],
  },
] as const;

/**
 * Topic mastery badges (IDs 6..11) earned after completing a themed set.
 */
export const QUEST_TOPIC_BADGE_RULES = [
  {
    badgeId: 6,
    requiredQuestIds: ["l1-blockchain", "l1-wallet", "l1-transaction"],
  },
  {
    badgeId: 7,
    requiredQuestIds: ["l1-usdc", "l1-gas"],
  },
  {
    badgeId: 8,
    requiredQuestIds: ["l2-defi", "l2-dex", "l2-liquidity"],
  },
  {
    badgeId: 9,
    requiredQuestIds: ["l2-yield", "l3-il"],
  },
  {
    badgeId: 10,
    requiredQuestIds: ["l2-smart"],
  },
  {
    badgeId: 11,
    requiredQuestIds: ["l3-risk", "l3-rug", "l3-boss"],
  },
] as const;

export function getQuestCompletionBadgeId(questId: string): number | null {
  const normalizedQuestId = questId.trim();
  if (!normalizedQuestId) {
    return null;
  }

  const found = QUEST_COMPLETION_BADGES.find(
    (entry) => entry.questId === normalizedQuestId
  );

  return found?.badgeId ?? null;
}
