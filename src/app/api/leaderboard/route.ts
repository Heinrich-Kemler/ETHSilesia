import { NextResponse } from "next/server";
import { ApiError, logServerError, toApiError } from "@/lib/server/apiErrors";
import { assertRateLimit } from "@/lib/server/rateLimit";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

/**
 * GET /api/leaderboard[?userId=<uuid>]
 *
 * Returns the top-10 players (by total XP) and, when `userId` is
 * supplied, that caller's own row + absolute rank.
 *
 * Data source: the `public.users` table directly, NOT the `public
 * .leaderboard` view.
 *
 * Earlier revisions queried the `leaderboard` view, which meant the
 * route broke the moment the view's shape drifted from the route's
 * SELECT list (e.g. the `player_id` column was only added by
 * `supabase/migrations/20260418134500_phase2_nonce_and_public_ids
 * .sql` — if a deploy hadn't run that migration yet, every request
 * failed with "column leaderboard.player_id does not exist" and the
 * page showed a permanent empty state even though users.total_xp
 * had real rows). Querying the source table makes the route
 * resilient to view-migration order.
 *
 * Shape is preserved — the UI still gets `{ player_id, username,
 * total_xp, level }` rows. `player_id` is the internal `users.id`
 * UUID, which we're comfortable exposing as a row key because (a)
 * it's 128 bits of entropy, (b) none of our read endpoints let you
 * access meaningful data via a bare id, and (c) writes still require
 * Privy-proven ownership.
 *
 * Auth: rate-limited but otherwise unauthenticated. The returned
 * fields (username, level, total_xp) are already public for anyone
 * who lands in the top 10, so gating the caller's OWN row behind
 * Privy ownership (the previous design) was asymmetric for zero
 * real privacy gain and broke the page whenever the session cookie
 * was missing or expired.
 */

type UserRow = {
  id: string;
  username: string | null;
  wallet_address: string | null;
  total_xp: number | null;
  level: number | null;
};

type LeaderRow = {
  player_id: string;
  username: string;
  total_xp: number;
  level: number;
};

const USER_SELECT = "id, username, wallet_address, total_xp, level";

/**
 * Mirror of the fallback the view used:
 *   coalesce(nullif(username,''), concat('user_', substr(wallet,3,6)))
 * Keeps display names stable for accounts that haven't set one yet.
 */
function displayName(row: UserRow): string {
  const trimmed = row.username?.trim();
  if (trimmed) return trimmed;
  const addr = row.wallet_address?.trim();
  if (addr && addr.startsWith("0x") && addr.length >= 8) {
    return `user_${addr.slice(2, 8)}`;
  }
  return "user";
}

function toLeaderRow(row: UserRow): LeaderRow {
  return {
    player_id: row.id,
    username: displayName(row),
    total_xp: row.total_xp ?? 0,
    level: row.level ?? 1,
  };
}

export async function GET(request: Request) {
  try {
    assertRateLimit(request, {
      key: "leaderboard-get",
      maxRequests: 120,
      windowMs: 60 * 1000,
    });

    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim() || null;

    // ── Top 10 ────────────────────────────────────────────────────
    // Ordered by total_xp DESC with id as a stable tiebreak so repeat
    // requests return rows in the same order.
    const { data: topRows, error: topError } = await supabase
      .from("users")
      .select(USER_SELECT)
      .order("total_xp", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .limit(10);

    if (topError) {
      logServerError("api/leaderboard:top", topError);
      throw new ApiError(500, "Failed to load leaderboard.", false);
    }

    const topUsers: LeaderRow[] = (topRows ?? []).map(toLeaderRow);

    // ── Caller row + rank (best-effort) ───────────────────────────
    let currentUser: LeaderRow | null = null;
    let currentUserRank: number | null = null;

    if (userId) {
      try {
        const { data: meRow, error: meError } = await supabase
          .from("users")
          .select(USER_SELECT)
          .eq("id", userId)
          .maybeSingle();

        if (meError) {
          throw meError;
        }

        if (meRow) {
          currentUser = toLeaderRow(meRow);

          // Rank = 1 + (number of users with strictly higher XP).
          // `head: true` skips the payload; we only need the count.
          const { count, error: rankError } = await supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .gt("total_xp", currentUser.total_xp);

          if (rankError) {
            throw rankError;
          }

          currentUserRank = (count ?? 0) + 1;
        }
      } catch (userBranchError) {
        // Don't let a miss on the caller row block the top-10
        // payload. Log so we can trace it in dev/prod instead of
        // swallowing silently.
        logServerError("api/leaderboard:user", userBranchError);
      }
    }

    return NextResponse.json({
      topUsers,
      currentUser,
      currentUserRank,
    });
  } catch (error) {
    const apiError = toApiError(error, "Failed to load leaderboard.");
    if (apiError.status >= 500) {
      logServerError("api/leaderboard", error);
    }
    return NextResponse.json(
      {
        error: apiError.exposeMessage
          ? apiError.message
          : "Failed to load leaderboard.",
      },
      { status: apiError.status }
    );
  }
}
