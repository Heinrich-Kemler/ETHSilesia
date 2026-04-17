/**
 * Hardcoded demo user — activated via ?demo=true URL param.
 * Used to skip Privy + Supabase for live judging / screenshots.
 */

export type DemoQuestCompletion = {
  quest_id: string;
  xp_earned: number;
  answers_correct: number;
  answers_total: number;
  completed_at: string;
};

export type DemoUser = {
  id: string;
  privy_id: string;
  wallet_address: string;
  username: string;
  google_email: string | null;
  level: 1 | 2 | 3 | 4;
  total_xp: number;
  streak_days: number;
  last_active: string | null;
  completedQuests: string[];
  questCompletions: DemoQuestCompletion[];
  language: "pl" | "en";
  created_at: string;
};

// Deterministic ISO date helper so the demo row looks the same every render.
function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const DEMO_COMPLETIONS: DemoQuestCompletion[] = [
  { quest_id: "l2-dex", xp_earned: 200, answers_correct: 3, answers_total: 3, completed_at: daysAgoISO(1) },
  { quest_id: "l2-defi", xp_earned: 200, answers_correct: 3, answers_total: 3, completed_at: daysAgoISO(2) },
  { quest_id: "l1-usdc", xp_earned: 150, answers_correct: 2, answers_total: 3, completed_at: daysAgoISO(4) },
  { quest_id: "l1-wallet", xp_earned: 150, answers_correct: 3, answers_total: 3, completed_at: daysAgoISO(5) },
  { quest_id: "l1-blockchain", xp_earned: 150, answers_correct: 3, answers_total: 3, completed_at: daysAgoISO(7) },
];

export const DEMO_USER: DemoUser = {
  id: "demo-skarbnik-id",
  privy_id: "demo-privy-id",
  wallet_address: "0xDEMO000000000000000000000000000000000DEMO",
  username: "Demo Skarbnik",
  google_email: null,
  level: 2,
  total_xp: 850,
  streak_days: 4,
  last_active: daysAgoISO(0),
  completedQuests: DEMO_COMPLETIONS.map((c) => c.quest_id),
  questCompletions: DEMO_COMPLETIONS,
  language: "pl",
  created_at: daysAgoISO(30),
};
