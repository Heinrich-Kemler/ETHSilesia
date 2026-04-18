import { NextResponse } from "next/server";
import { ApiError, logServerError, toApiError } from "@/lib/server/apiErrors";
import {
  assertPrivyOwnership,
  requirePrivyAuth,
} from "@/lib/server/auth";
import { calculateLevelFromXp } from "@/lib/server/gameLogic";
import { DAILY_BONUS_XP } from "@/lib/dailyChallenge";
import { assertRateLimit } from "@/lib/server/rateLimit";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

/**
 * POST /api/daily/complete
 *
 * Persists the +50 XP reward for a correct answer on the Daily
 * Challenge. Before this endpoint existed, `DailyChallenge.tsx`
 * saved the result to localStorage, fired a success toast, and
 * left `users.total_xp` untouched — so the promised XP never
 * appeared in the TopBar, leaderboard, or level calculation.
 *
 * Idempotency: we key an in-memory cache on `userId | SERVER-today`.
 * The server computes "today" itself (UTC-floor) and ignores any
 * `dateISO` the client tries to send — otherwise a malicious caller
 * could POST `{"dateISO":"2099-01-01"}` per unique key and farm
 * +50 XP per request. The body type still carries `dateISO` for
 * back-compat with the existing frontend, but the value is
 * discarded before it reaches the cache key. Process restart
 * resets the cache, which is a known gap (see below).
 *
 * Auth: same pattern as /api/quests/complete — Privy token + user
 * ownership check + IP rate limit.
 */

type DailyCompleteBody = {
  userId?: string;
  /**
   * Accepted for backwards-compatibility with the current client but
   * NOT trusted. The server computes today's date itself.
   */
  dateISO?: string;
};

/** Server-authoritative "today" (UTC). Used as the idempotency key. */
function serverTodayUtcISO(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Process-local idempotency cache. Map<`${userId}|${dateISO}`, true>.
// This survives only as long as the Node process — on restart a
// malicious client could re-claim. Acceptable for MVP; long-term
// this should be replaced by a `daily_completions` table (compound
// unique key on user_id + date) that also lets the UI persist
// completions across devices.
const dailyClaimCache = (globalThis as typeof globalThis & {
  __skarbnikDailyCache?: Map<string, true>;
}).__skarbnikDailyCache ??
  ((globalThis as typeof globalThis & {
    __skarbnikDailyCache?: Map<string, true>;
  }).__skarbnikDailyCache = new Map<string, true>());

export async function POST(request: Request) {
  try {
    // Rate limit — 10 claims/min per IP should be plenty for legit
    // use (1 per day) while throttling scripted farming.
    assertRateLimit(request, {
      key: "daily-complete",
      maxRequests: 10,
      windowMs: 60 * 1000,
    });

    const auth = await requirePrivyAuth(request);
    const body = (await request.json()) as DailyCompleteBody;

    const userId = body.userId?.trim();

    if (!userId) {
      throw new ApiError(400, "userId is required.");
    }

    // Server computes today — never trusts `body.dateISO`. Previously
    // the client value was the cache key, so posting a different ISO
    // string every call granted +50 XP ad infinitum.
    const dateISO = serverTodayUtcISO();
    const cacheKey = `${userId}|${dateISO}`;
    if (dailyClaimCache.has(cacheKey)) {
      throw new ApiError(409, "Daily challenge already claimed today.");
    }

    const supabase = getSupabaseAdminClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, privy_id, total_xp, level")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      throw new ApiError(500, "Failed to load user.", false);
    }
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    assertPrivyOwnership(auth, user.privy_id);

    const newXP = user.total_xp + DAILY_BONUS_XP;
    const newLevel = calculateLevelFromXp(newXP);
    const levelUp = newLevel > user.level;

    const { error: updateError } = await supabase
      .from("users")
      .update({ total_xp: newXP, level: newLevel })
      .eq("id", userId);

    if (updateError) {
      throw new ApiError(500, "Failed to update user XP.", false);
    }

    // Only mark the claim after the DB write succeeds — if the
    // update fails, the client can retry.
    dailyClaimCache.set(cacheKey, true);

    return NextResponse.json({
      xpEarned: DAILY_BONUS_XP,
      newXP,
      newLevel,
      levelUp,
    });
  } catch (error) {
    const apiError = toApiError(error, "Failed to complete daily challenge.");
    if (apiError.status >= 500) {
      logServerError("api/daily/complete", error);
    }
    return NextResponse.json(
      {
        error: apiError.exposeMessage
          ? apiError.message
          : "Failed to complete daily challenge.",
      },
      { status: apiError.status }
    );
  }
}
