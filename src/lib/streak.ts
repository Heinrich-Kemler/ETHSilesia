/**
 * Lightweight streak tracker backed by localStorage. No server round-trip.
 *
 * We keep a set of activity dates (YYYY-MM-DD) and derive current + best
 * streaks on read. "Active" means the user completed a quest or answered
 * the daily challenge that day — callers decide when to mark.
 */

const STORAGE_KEY = "skarbnik:streak:v1";

export type StreakData = {
  activeDays: Record<string, true>; // ISO date → true
  bestStreak: number;
};

function bucketKey(userId: string | null): string {
  return `${STORAGE_KEY}:${userId ?? "anon"}`;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ISO date that is `daysBack` days earlier than today (local time). */
function isoDaysAgo(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function read(userId: string | null): StreakData {
  if (typeof window === "undefined") return { activeDays: {}, bestStreak: 0 };
  try {
    const raw = localStorage.getItem(bucketKey(userId));
    if (!raw) return { activeDays: {}, bestStreak: 0 };
    const parsed = JSON.parse(raw) as Partial<StreakData>;
    return {
      activeDays: parsed.activeDays ?? {},
      bestStreak: typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0,
    };
  } catch {
    return { activeDays: {}, bestStreak: 0 };
  }
}

function write(userId: string | null, data: StreakData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(bucketKey(userId), JSON.stringify(data));
    notifyStreakChange();
  } catch {
    // localStorage quota / access errors are non-fatal — drop silently.
  }
}

/* ------------------------------------------------------------------ */
/* In-tab pub/sub so `useSyncExternalStore`-backed hooks re-render     */
/* after `markActiveDay()` writes. `storage` events don't fire in the  */
/* same tab, so we maintain our own listener set + a version counter  */
/* that consumers can read as a cheap snapshot.                        */
/* ------------------------------------------------------------------ */
const streakListeners = new Set<() => void>();
let streakVersion = 0;

function notifyStreakChange(): void {
  streakVersion++;
  streakListeners.forEach((cb) => cb());
}

export function subscribeStreak(cb: () => void): () => void {
  streakListeners.add(cb);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", cb);
  }
  return () => {
    streakListeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", cb);
    }
  };
}

/** Monotonic token — increments every time the store is written. */
export function getStreakVersion(): number {
  return streakVersion;
}

/**
 * Compute the length of the streak that ends on `endDate` (inclusive).
 * Walks backwards day-by-day until it finds a gap.
 */
function streakEndingAt(
  activeDays: Record<string, true>,
  endDate: string
): number {
  let count = 0;
  const cursor = new Date(endDate);
  // Guard against invalid date strings
  if (isNaN(cursor.getTime())) return 0;
  for (let i = 0; i < 365 * 3; i++) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    if (activeDays[key]) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
}

/**
 * Current streak counted backwards from today. If today wasn't active yet,
 * we still count yesterday's streak so the user doesn't see a "0" mid-day.
 */
export function getCurrentStreak(userId: string | null): number {
  const { activeDays } = read(userId);
  const today = todayISO();
  if (activeDays[today]) return streakEndingAt(activeDays, today);
  const yesterday = isoDaysAgo(1);
  return streakEndingAt(activeDays, yesterday);
}

export function getBestStreak(userId: string | null): number {
  return read(userId).bestStreak;
}

export function getStreakStats(userId: string | null): {
  current: number;
  best: number;
} {
  return { current: getCurrentStreak(userId), best: getBestStreak(userId) };
}

/**
 * Mark today as active. Idempotent — safe to call multiple times.
 * Also updates bestStreak if the new current exceeds it.
 */
export function markActiveDay(userId: string | null): void {
  if (typeof window === "undefined") return;
  const data = read(userId);
  const today = todayISO();
  if (!data.activeDays[today]) {
    data.activeDays[today] = true;
  }
  const current = streakEndingAt(data.activeDays, today);
  if (current > data.bestStreak) {
    data.bestStreak = current;
  }
  write(userId, data);
}

export type DayCell = {
  dateISO: string;
  label: string; // short weekday label (Mon, Tue, …)
  active: boolean;
  isToday: boolean;
};

const WEEKDAY_PL = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Returns the last N days ending with today (oldest first, today last).
 * UI reads this to render a horizontal strip of day bubbles.
 */
export function getRecentDays(
  userId: string | null,
  count: number,
  lang: "pl" | "en"
): DayCell[] {
  const { activeDays } = read(userId);
  const labels = lang === "pl" ? WEEKDAY_PL : WEEKDAY_EN;
  const today = todayISO();
  const cells: DayCell[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const dateISO = isoDaysAgo(i);
    const d = new Date(dateISO);
    cells.push({
      dateISO,
      label: labels[d.getDay()],
      active: !!activeDays[dateISO],
      isToday: dateISO === today,
    });
  }
  return cells;
}
