/**
 * Hardcoded demo user — activated via ?demo=true URL param.
 * Used to skip Privy + Supabase for live judging / screenshots.
 */
export type DemoUser = {
  id: string;
  privy_id: string;
  wallet_address: string;
  username: string;
  level: 1 | 2 | 3 | 4;
  total_xp: number;
  streak_days: number;
  completedQuests: string[];
  language: "pl" | "en";
};

export const DEMO_USER: DemoUser = {
  id: "demo-skarbnik-id",
  privy_id: "demo-privy-id",
  wallet_address: "0xDEMO000000000000000000000000000000000DEMO",
  username: "Demo Skarbnik",
  level: 2,
  total_xp: 850,
  streak_days: 4,
  completedQuests: [
    "l1-blockchain",
    "l1-wallet",
    "l1-usdc",
    "l2-defi",
    "l2-dex",
  ],
  language: "pl",
};
