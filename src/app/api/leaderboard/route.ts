import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim();

    const { data: topUsers, error: topUsersError } = await supabase
      .from("leaderboard")
      .select("user_id, username, total_xp, level")
      .order("total_xp", { ascending: false })
      .order("user_id", { ascending: true })
      .limit(10);

    if (topUsersError) {
      return NextResponse.json(
        { error: "Failed to load leaderboard.", details: topUsersError.message },
        { status: 500 }
      );
    }

    let currentUserRank: number | null = null;
    let currentUser: {
      user_id: string;
      username: string | null;
      total_xp: number;
      level: number;
    } | null = null;

    if (userId) {
      const { data: currentUserRow, error: currentUserError } = await supabase
        .from("leaderboard")
        .select("user_id, username, total_xp, level")
        .eq("user_id", userId)
        .maybeSingle();

      if (currentUserError) {
        return NextResponse.json(
          {
            error: "Failed to calculate current user rank.",
            details: currentUserError.message,
          },
          { status: 500 }
        );
      }

      if (currentUserRow) {
        currentUser = currentUserRow;

        const { count, error: rankCountError } = await supabase
          .from("leaderboard")
          .select("user_id", { count: "exact", head: true })
          .gt("total_xp", currentUserRow.total_xp);

        if (rankCountError) {
          return NextResponse.json(
            {
              error: "Failed to calculate current user rank.",
              details: rankCountError.message,
            },
            { status: 500 }
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to load leaderboard.", details: message },
      { status: 500 }
    );
  }
}
