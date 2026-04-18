/**
 * Sample content for the design-lab artboards. Matches the quest
 * catalog shape used elsewhere, but intentionally not wired to the
 * real `@/lib/quests` module — the lab is a static preview, not a
 * live data surface. Keeping the data here means promoting the
 * design doesn't silently ship stale copy.
 */

export type QuestStatus = "completed" | "active" | "available" | "locked";

export type LabQuest = {
  id: string;
  title: string;
  topic: BadgeTopic;
  xp: number;
  stars: 1 | 2 | 3;
  level: 1 | 2 | 3;
  status: QuestStatus;
};

export type BadgeTopic =
  | "blockchain"
  | "wallet"
  | "usdc"
  | "transaction"
  | "gas"
  | "defi"
  | "dex"
  | "yield"
  | "liquidity"
  | "smart"
  | "il"
  | "rwa"
  | "risk"
  | "rug"
  | "boss";

export const QUESTS: LabQuest[] = [
  // L1 — Apprentice
  { id: "l1-blockchain", title: "Czym jest blockchain?", topic: "blockchain", xp: 50, stars: 1, level: 1, status: "completed" },
  { id: "l1-wallet", title: "Twój pierwszy portfel", topic: "wallet", xp: 50, stars: 1, level: 1, status: "completed" },
  { id: "l1-usdc", title: "USDC — stabilna kryptowaluta", topic: "usdc", xp: 75, stars: 1, level: 1, status: "completed" },
  { id: "l1-transaction", title: "Jak działa transakcja?", topic: "transaction", xp: 75, stars: 2, level: 1, status: "active" },
  { id: "l1-gas", title: "Czym jest opłata za gaz?", topic: "gas", xp: 100, stars: 2, level: 1, status: "available" },
  // L2 — Adept
  { id: "l2-defi", title: "Czym jest DeFi?", topic: "defi", xp: 100, stars: 2, level: 2, status: "locked" },
  { id: "l2-dex", title: "Giełda zdecentralizowana a scentralizowana", topic: "dex", xp: 100, stars: 2, level: 2, status: "locked" },
  { id: "l2-yield", title: "Zysk — jak zarabiać?", topic: "yield", xp: 150, stars: 3, level: 2, status: "locked" },
  { id: "l2-liquidity", title: "Pule płynności", topic: "liquidity", xp: 150, stars: 3, level: 2, status: "locked" },
  { id: "l2-smart", title: "Inteligentne kontrakty", topic: "smart", xp: 200, stars: 3, level: 2, status: "locked" },
  // L3 — Master
  { id: "l3-il", title: "Strata nietrwała", topic: "il", xp: 200, stars: 3, level: 3, status: "locked" },
  { id: "l3-rwa", title: "Aktywa ze świata realnego", topic: "rwa", xp: 250, stars: 3, level: 3, status: "locked" },
  { id: "l3-risk", title: "Jak oceniać ryzyko?", topic: "risk", xp: 300, stars: 3, level: 3, status: "locked" },
  { id: "l3-rug", title: "Oszustwo „rug pull” — jak rozpoznać?", topic: "rug", xp: 300, stars: 3, level: 3, status: "locked" },
  { id: "l3-boss", title: "Wyzwanie Skarbnika", topic: "boss", xp: 500, stars: 3, level: 3, status: "locked" },
];

export type LevelTone = "apprentice" | "adept" | "master";

export const LEVEL_META: Record<
  1 | 2 | 3,
  { tone: LevelTone; title: string; subtitle: string }
> = {
  1: { tone: "apprentice", title: "Uczeń", subtitle: "Płytka sztolnia" },
  2: { tone: "adept", title: "Biegły", subtitle: "Kryształowa grota" },
  3: { tone: "master", title: "Mistrz", subtitle: "Skarbiec" },
};

export type SampleQuestion = {
  q: string;
  options: string[];
  correct: number;
  explainer: string;
};

export const SAMPLE_QUIZ = {
  questId: "l1-transaction",
  questTitle: "Jak działa transakcja?",
  total: 6,
  questions: [
    {
      q: "Kiedy wysyłasz komuś kryptowalutę, co się właściwie dzieje w sieci?",
      options: [
        "Moneta fizycznie „przelatuje” z Twojego telefonu do ich telefonu",
        "Bank weryfikuje i zatwierdza przelew",
        "Sieć komputerów potwierdza zapis w księdze i aktualizuje salda",
        "Serwer kopiuje Twoją monetę odbiorcy",
      ],
      correct: 2,
      explainer:
        "Blockchain to wspólna księga. Twoja transakcja to nowy wpis, który tysiące komputerów sprawdza i zapisuje — nic nigdzie fizycznie nie „leci”.",
    },
  ] satisfies SampleQuestion[],
};
