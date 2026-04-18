/**
 * Client-side badge registry. Mirrors the ERC-1155 SkarbnikBadges IDs and
 * the JSON metadata under `/badge-metadata/*.json`. Keeping a typed copy
 * here lets the UI render badges (locked/earned states, cards, unlock
 * celebrations) without fetching remote metadata on every render.
 *
 * When IPFS artwork is finalised by the backend, only the `image` field
 * below needs updating — the UI stays stable.
 */

import {
  Sparkles,
  Shield,
  Crown,
  Swords,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { QUESTS } from "@/lib/quests";
import {
  LEVEL_COMPLETION_BADGE_RULES,
  QUEST_COMPLETION_BADGES,
  QUEST_TOPIC_BADGE_RULES,
} from "@/lib/badgeMappings";

export type BadgeTier = "Bronze" | "Silver" | "Gold" | "Champion" | "Guardian";
export type ExtendedBadgeTier = BadgeTier | "Path";

export type BadgeDef = {
  id: number;
  /** Canonical name (same as metadata JSON → PL). */
  namePl: string;
  /** English-localised name for UI. */
  nameEn: string;
  /** One-liner in the user's language. */
  descriptionPl: string;
  descriptionEn: string;
  /** How the user earns it (short, user-facing). */
  triggerPl: string;
  triggerEn: string;
  tier: ExtendedBadgeTier;
  /** Lucide icon used as a placeholder until IPFS art lands. */
  icon: LucideIcon;
  /**
   * CSS gradient (tailwind-friendly vars) for the card glow + unlock
   * celebration background.
   */
  gradient: string;
  /** Primary accent colour — drives borders, glows, confetti tint. */
  accent: string;
};

export const BADGES: readonly BadgeDef[] = [
  {
    id: 1,
    namePl: "Początkujący Skarbnik",
    nameEn: "Novice Skarbnik",
    descriptionPl: "Za ukończenie pierwszego questa.",
    descriptionEn: "Awarded for completing your first quest.",
    triggerPl: "Ukończ 1 questa",
    triggerEn: "Complete 1 quest",
    tier: "Bronze",
    icon: Sparkles,
    gradient:
      "linear-gradient(135deg, #cd7f32 0%, color-mix(in srgb, #cd7f32 60%, transparent) 100%)",
    accent: "#cd7f32",
  },
  {
    id: 2,
    namePl: "Srebrny Skarbnik",
    nameEn: "Silver Skarbnik",
    descriptionPl: "Za osiągnięcie 2. poziomu.",
    descriptionEn: "Awarded for reaching level 2.",
    triggerPl: "Osiągnij poziom 2",
    triggerEn: "Reach level 2",
    tier: "Silver",
    icon: Shield,
    gradient:
      "linear-gradient(135deg, var(--cyan) 0%, color-mix(in srgb, var(--cyan) 60%, transparent) 100%)",
    accent: "var(--cyan)",
  },
  {
    id: 3,
    namePl: "Złoty Skarbnik",
    nameEn: "Gold Skarbnik",
    descriptionPl: "Za osiągnięcie 3. poziomu.",
    descriptionEn: "Awarded for reaching level 3.",
    triggerPl: "Osiągnij poziom 3",
    triggerEn: "Reach level 3",
    tier: "Gold",
    icon: Crown,
    gradient:
      "linear-gradient(135deg, var(--gold) 0%, color-mix(in srgb, var(--gold) 55%, transparent) 100%)",
    accent: "var(--gold)",
  },
  {
    id: 4,
    namePl: "Próba Zdana",
    nameEn: "Trial Passed",
    descriptionPl: "Za ukończenie walki z bossem.",
    descriptionEn: "Awarded for beating the boss battle.",
    triggerPl: "Pokonaj bossa",
    triggerEn: "Beat the boss battle",
    tier: "Champion",
    icon: Swords,
    gradient:
      "linear-gradient(135deg, #a855f7 0%, color-mix(in srgb, #a855f7 60%, transparent) 100%)",
    accent: "#a855f7",
  },
  {
    id: 5,
    namePl: "Strażnik Skarbu",
    nameEn: "Treasure Guardian",
    descriptionPl: "Za 7-dniową passę aktywności.",
    descriptionEn: "Awarded for a 7-day activity streak.",
    triggerPl: "Utrzymaj passę 7 dni",
    triggerEn: "Hold a 7-day streak",
    tier: "Guardian",
    icon: Flame,
    gradient:
      "linear-gradient(135deg, #ef4444 0%, color-mix(in srgb, #ef4444 55%, #f59e0b) 100%)",
    accent: "#ef4444",
  },
  {
    id: 6,
    namePl: "Blockchain i Portfel",
    nameEn: "Blockchain & Wallet",
    descriptionPl: "Za ukończenie ścieżki blockchain i portfela.",
    descriptionEn: "Awarded for completing the blockchain and wallet path.",
    triggerPl: "Ukończ: blockchain, portfel i transakcje",
    triggerEn: "Complete: blockchain, wallet, and transactions",
    tier: "Path",
    icon: Sparkles,
    gradient:
      "linear-gradient(135deg, #0ea5e9 0%, color-mix(in srgb, #0ea5e9 60%, transparent) 100%)",
    accent: "#0ea5e9",
  },
  {
    id: 7,
    namePl: "Stablecoiny i Tokeny",
    nameEn: "Stablecoins & Tokens",
    descriptionPl: "Za ukończenie ścieżki stablecoinów i tokenów.",
    descriptionEn: "Awarded for completing the stablecoins and tokens path.",
    triggerPl: "Ukończ: USDC i gas fee",
    triggerEn: "Complete: USDC and gas fee",
    tier: "Path",
    icon: Shield,
    gradient:
      "linear-gradient(135deg, #14b8a6 0%, color-mix(in srgb, #14b8a6 60%, transparent) 100%)",
    accent: "#14b8a6",
  },
  {
    id: 8,
    namePl: "Nawigator DEX",
    nameEn: "DEX Pathfinder",
    descriptionPl: "Za ukończenie ścieżki DeFi, DEX i płynności.",
    descriptionEn: "Awarded for completing the DeFi, DEX, and liquidity path.",
    triggerPl: "Ukończ: DeFi, DEX i płynność",
    triggerEn: "Complete: DeFi, DEX, and liquidity",
    tier: "Path",
    icon: Swords,
    gradient:
      "linear-gradient(135deg, #06b6d4 0%, color-mix(in srgb, #06b6d4 60%, transparent) 100%)",
    accent: "#06b6d4",
  },
  {
    id: 9,
    namePl: "Yield i Staking",
    nameEn: "Yield & Staking",
    descriptionPl: "Za ukończenie ścieżki yield i zarządzania ekspozycją.",
    descriptionEn: "Awarded for completing the yield and exposure path.",
    triggerPl: "Ukończ: yield i impermanent loss",
    triggerEn: "Complete: yield and impermanent loss",
    tier: "Path",
    icon: Crown,
    gradient:
      "linear-gradient(135deg, #22c55e 0%, color-mix(in srgb, #22c55e 60%, transparent) 100%)",
    accent: "#22c55e",
  },
  {
    id: 10,
    namePl: "Smart Kontrakty",
    nameEn: "Smart Contracts",
    descriptionPl: "Za ukończenie questa o smart kontraktach.",
    descriptionEn: "Awarded for completing the smart contracts quest.",
    triggerPl: "Ukończ: smart kontrakty",
    triggerEn: "Complete: smart contracts",
    tier: "Path",
    icon: Sparkles,
    gradient:
      "linear-gradient(135deg, #6366f1 0%, color-mix(in srgb, #6366f1 60%, transparent) 100%)",
    accent: "#6366f1",
  },
  {
    id: 11,
    namePl: "Strażnik Bezpieczeństwa",
    nameEn: "Safety Sentinel",
    descriptionPl: "Za ukończenie ścieżki bezpieczeństwa i zarządzania ryzykiem.",
    descriptionEn: "Awarded for completing the safety and risk path.",
    triggerPl: "Ukończ: ryzyko, rug pull i próbę bossa",
    triggerEn: "Complete: risk, rug pull, and boss trial",
    tier: "Path",
    icon: Flame,
    gradient:
      "linear-gradient(135deg, #f97316 0%, color-mix(in srgb, #f97316 60%, transparent) 100%)",
    accent: "#f97316",
  },
  ...buildLevelCompletionBadges(),
  ...buildQuestCompletionBadges(),
] as const;

export function getBadgeById(id: number): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

export function badgeName(badge: BadgeDef, lang: "pl" | "en"): string {
  return lang === "pl" ? badge.namePl : badge.nameEn;
}

export function badgeDescription(
  badge: BadgeDef,
  lang: "pl" | "en"
): string {
  return lang === "pl" ? badge.descriptionPl : badge.descriptionEn;
}

export function badgeTrigger(badge: BadgeDef, lang: "pl" | "en"): string {
  return lang === "pl" ? badge.triggerPl : badge.triggerEn;
}

/**
 * Best-effort "earned" inference for cases where the server hasn't yet
 * told us which badge IDs the user holds. Keeps the showcase useful even
 * without a live query to the contract / DB.
 */
export function inferEarnedBadgeIds(
  level: 1 | 2 | 3 | 4,
  completedQuestIds: string[],
  streakDays: number
): number[] {
  const earned = new Set<number>();
  const completedSet = new Set(completedQuestIds);
  const completedQuestCount = completedQuestIds.length;

  if (completedQuestCount >= 1) earned.add(1);
  if (level >= 2) earned.add(2);
  if (level >= 3) earned.add(3);
  // Badge 4 (boss battle) is an explicit server-side flag — we don't
  // infer it client-side.
  if (streakDays >= 7) earned.add(5);

  for (const entry of QUEST_COMPLETION_BADGES) {
    if (completedSet.has(entry.questId)) {
      earned.add(entry.badgeId);
    }
  }

  for (const rule of QUEST_TOPIC_BADGE_RULES) {
    const allQuestsCompleted = rule.requiredQuestIds.every((questId) =>
      completedSet.has(questId)
    );
    if (allQuestsCompleted) {
      earned.add(rule.badgeId);
    }
  }

  for (const rule of LEVEL_COMPLETION_BADGE_RULES) {
    const allLevelQuestsCompleted = rule.requiredQuestIds.every((questId) =>
      completedSet.has(questId)
    );
    if (allLevelQuestsCompleted) {
      earned.add(rule.badgeId);
    }
  }

  return Array.from(earned).sort((a, b) => a - b);
}

function buildQuestCompletionBadges(): BadgeDef[] {
  const questById = new Map(QUESTS.map((quest) => [quest.id, quest]));

  return QUEST_COMPLETION_BADGES.map((entry) => {
    const quest = questById.get(entry.questId);
    const level = quest?.level ?? 1;
    const icon = level === 1 ? Sparkles : level === 2 ? Shield : Crown;
    const color = level === 1 ? "#10b981" : level === 2 ? "#06b6d4" : "#f59e0b";

    return {
      id: entry.badgeId,
      namePl: quest ? `Quest: ${quest.titlePl}` : `Quest #${entry.badgeId}`,
      nameEn: quest ? `Quest: ${quest.titleEn}` : `Quest #${entry.badgeId}`,
      descriptionPl: "Za ukończenie tego questa.",
      descriptionEn: "Awarded for completing this quest.",
      triggerPl: "Ukończ ten quest",
      triggerEn: "Complete this quest",
      tier: "Path",
      icon,
      gradient: `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color} 60%, transparent) 100%)`,
      accent: color,
    };
  });
}

function buildLevelCompletionBadges(): BadgeDef[] {
  const defs: Record<1 | 2 | 3, Omit<BadgeDef, "id">> = {
    1: {
      namePl: "Mistrz Poziomu 1",
      nameEn: "Level 1 Master",
      descriptionPl: "Za ukończenie wszystkich questów poziomu 1.",
      descriptionEn: "Awarded for completing all level 1 quests.",
      triggerPl: "Ukończ wszystkie questy poziomu 1",
      triggerEn: "Complete all level 1 quests",
      tier: "Path",
      icon: Shield,
      gradient:
        "linear-gradient(135deg, #22c55e 0%, color-mix(in srgb, #22c55e 60%, transparent) 100%)",
      accent: "#22c55e",
    },
    2: {
      namePl: "Mistrz Poziomu 2",
      nameEn: "Level 2 Master",
      descriptionPl: "Za ukończenie wszystkich questów poziomu 2.",
      descriptionEn: "Awarded for completing all level 2 quests.",
      triggerPl: "Ukończ wszystkie questy poziomu 2",
      triggerEn: "Complete all level 2 quests",
      tier: "Path",
      icon: Shield,
      gradient:
        "linear-gradient(135deg, #94a3b8 0%, color-mix(in srgb, #94a3b8 60%, transparent) 100%)",
      accent: "#94a3b8",
    },
    3: {
      namePl: "Mistrz Poziomu 3",
      nameEn: "Level 3 Master",
      descriptionPl: "Za ukończenie wszystkich questów poziomu 3.",
      descriptionEn: "Awarded for completing all level 3 quests.",
      triggerPl: "Ukończ wszystkie questy poziomu 3",
      triggerEn: "Complete all level 3 quests",
      tier: "Path",
      icon: Crown,
      gradient:
        "linear-gradient(135deg, #f59e0b 0%, color-mix(in srgb, #f59e0b 60%, transparent) 100%)",
      accent: "#f59e0b",
    },
  };

  return LEVEL_COMPLETION_BADGE_RULES.map((rule) => ({
    id: rule.badgeId,
    ...defs[rule.level],
  }));
}
