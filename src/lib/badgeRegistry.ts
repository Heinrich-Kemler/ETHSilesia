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

export type BadgeTier = "Bronze" | "Silver" | "Gold" | "Champion" | "Guardian";

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
  tier: BadgeTier;
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
  completedQuestCount: number,
  streakDays: number
): number[] {
  const earned = new Set<number>();
  if (completedQuestCount >= 1) earned.add(1);
  if (level >= 2) earned.add(2);
  if (level >= 3) earned.add(3);
  // Badge 4 (boss battle) is an explicit server-side flag — we don't
  // infer it client-side.
  if (streakDays >= 7) earned.add(5);
  return Array.from(earned).sort((a, b) => a - b);
}
