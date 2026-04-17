/**
 * Daily Challenge selector + localStorage persistence.
 *
 * Picks one quest question per day deterministically from the user's unlocked
 * pool (same user sees the same question all day; rotates at local midnight).
 *
 * State is stored in localStorage for speed — a backend daily_completions
 * table can later replace this without changing the UI.
 */

import { QUESTS, type Quest, type QuizQuestion } from "./quests";

export const DAILY_BONUS_XP = 50;

export type DailySelection = {
  quest: Quest;
  question: QuizQuestion;
  questionIndex: number;
  dateISO: string; // YYYY-MM-DD, local
};

export type DailyResultStatus = "pending" | "correct" | "incorrect";

export type DailyResult = {
  dateISO: string;
  questId: string;
  questionIndex: number;
  status: DailyResultStatus;
  earnedXp: number;
};

const STORAGE_KEY = "skarbnik:dailyChallenge:v1";

/** Local-calendar-day ISO date. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Deterministic 32-bit hash for seeding; good enough for picker stability. */
function hash32(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pick the daily challenge for a given date + user + unlocked level.
 * Returns `null` if the user has no unlocked quests (shouldn't happen).
 */
export function pickDailyChallenge(
  dateISO: string,
  userId: string | null,
  unlockedLevel: 1 | 2 | 3 | 4
): DailySelection | null {
  const cap = unlockedLevel === 4 ? 3 : unlockedLevel;
  const eligible = QUESTS.filter((q) => q.level <= cap);
  if (eligible.length === 0) return null;

  const seed = hash32(`${dateISO}|${userId ?? "anon"}`);
  const qIdx = seed % eligible.length;
  const quest = eligible[qIdx];
  const questionIndex = (seed >>> 8) % quest.questions.length;
  const question = quest.questions[questionIndex];

  return { quest, question, questionIndex, dateISO };
}

/* ============================================================
   localStorage persistence (MVP — Codex can later swap to DB)
   ============================================================ */

function readStore(): Record<string, DailyResult> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, DailyResult>;
    }
    return {};
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, DailyResult>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota or private-mode — soft-fail */
  }
}

/** Key that scopes results per user (so demo + real users don't collide). */
function storeKey(userId: string | null): string {
  return userId ?? "anon";
}

export function getDailyResult(
  userId: string | null,
  dateISO: string
): DailyResult | null {
  const store = readStore();
  const bucket = store[storeKey(userId)];
  if (!bucket) return null;
  // Our bucket is a single object, one entry per user (we only track today).
  // Legacy/multi-day can be added later — for MVP, only today matters.
  if ((bucket as DailyResult).dateISO === dateISO) {
    return bucket as DailyResult;
  }
  return null;
}

export function saveDailyResult(
  userId: string | null,
  result: DailyResult
): void {
  const store = readStore();
  // Overwrite the user bucket with today's result.
  store[storeKey(userId)] = result;
  writeStore(store);
}

/* ============================================================
   Countdown helpers
   ============================================================ */

/** Milliseconds until next local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number, lang: "pl" | "en"): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return lang === "pl"
      ? `${hours}g ${minutes}m`
      : `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return lang === "pl" ? `${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
