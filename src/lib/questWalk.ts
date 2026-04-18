/**
 * Tiny localStorage handshake between the quest completion screen
 * and the chapter-path mascot (SkarbnikMiner).
 *
 * When a quest finishes successfully, we stash its id here so the
 * next mount of `/quest` knows where the miner should "step off"
 * from. SkarbnikMiner reads + clears the value exactly once — no
 * replays on subsequent hub visits.
 *
 * Keeping this in its own module so the writer (quest/[id]/page.tsx)
 * and the reader (SkarbnikMiner.tsx) can't drift on key names.
 *
 * localStorage vs. URL state: we picked localStorage because the
 * celebration modal lives on the quest/[id] page and the user may
 * click the "Back to quests" link any time after dismissing it.
 * URL state would need to survive across that full interaction
 * without leaking into share-links.
 */
const KEY = "skarbnik:last-completed-quest";

/** Called by the quest completion screen right after a successful submit. */
export function rememberLastCompletedQuest(questId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, questId);
  } catch {
    // Storage quota / private mode — the walk animation is purely cosmetic,
    // so silently dropping it is fine.
  }
}

/**
 * Called by SkarbnikMiner on the hub. Returns the stored quest id
 * (if any), OR null. Does NOT clear — the caller decides when to
 * consume, so they can validate against completedQuests first and
 * avoid losing the marker if we read it too early (e.g. before the
 * /api/users fetch populates completedQuests).
 */
export function peekLastCompletedQuest(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Idempotent clear — safe to call multiple times. */
export function clearLastCompletedQuest(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignored — see note in rememberLastCompletedQuest.
  }
}
