import { NextResponse } from "next/server";
import { ApiError, logServerError, toApiError } from "@/lib/server/apiErrors";
import {
  assertPrivyOwnership,
  requirePrivyAuth,
} from "@/lib/server/auth";
import { assertRateLimit } from "@/lib/server/rateLimit";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    assertRateLimit(request, {
      key: "leaderboard-get",
      maxRequests: 120,
      windowMs: 60 * 1000,
    });

    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim();

    const { data: topUsers, error: topUsersError } = await supabase
      .from("leaderboard")
      .select("player_id, username, total_xp, level")
      .order("total_xp", { ascending: false })
      .order("player_id", { ascending: true })
      .limit(10);

    if (topUsersError) {
      throw new ApiError(500, "Failed to load leaderboard.", false);
    }

    let currentUserRank: number | null = null;
    let currentUser: {
      player_id: string;
      username: string | null;
      total_xp: number;
      level: number;
    } | null = null;

    if (userId) {
      const auth = await requirePrivyAuth(request);
      const { data: userOwnership, error: userOwnershipError } = await supabase
        .from("users")
        .select("id, privy_id")
        .eq("id", userId)
        .maybeSingle();

      if (userOwnershipError) {
        throw new ApiError(500, "Failed to verify leaderboard access.", false);
      }

      if (!userOwnership) {
        throw new ApiError(404, "User not found.");
      }

      assertPrivyOwnership(auth, userOwnership.privy_id);

      const { data: currentUserRow, error: currentUserError } = await supabase
        .from("leaderboard")
        .select("player_id, username, total_xp, level")
        .eq("user_id", userId)
        .maybeSingle();

      if (currentUserError) {
        throw new ApiError(500, "Failed to calculate current user rank.", false);
      }

      if (currentUserRow) {
        currentUser = currentUserRow;

        const { count, error: rankCountError } = await supabase
          .from("leaderboard")
          .select("user_id", { count: "exact", head: true })
          .gt("total_xp", currentUserRow.total_xp);

        if (rankCountError) {
          throw new ApiError(
            500,
            "Failed to calculate current user rank.",
            false
          );
        }

        currentUserRank = (count ?? 0) + 1;
      }
    }

    return NextResponse.json({
      topUsers: topUsers ?? [],
      currentUserRank,
      currentUser,
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
