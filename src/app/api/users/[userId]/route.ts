import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

/**
 * GET /api/users/[userId]
 * Returns the user row plus an array of completed quest IDs.
 * userId is the Supabase UUID (not the Privy DID).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const id = userId?.trim();
    if (!id) {
      return NextResponse.json(
        { error: "userId is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, privy_id, wallet_address, username, google_email, level, total_xp, streak_days, last_active, language, created_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (userError) {
      return NextResponse.json(
        { error: "Failed to load user.", details: userError.message },
        { status: 500 }
      );
    }
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const { data: completions, error: completionsError } = await supabase
      .from("quest_completions")
      .select("quest_id")
      .eq("user_id", id);

    if (completionsError) {
      return NextResponse.json(
        {
          error: "Failed to load completed quests.",
          details: completionsError.message,
        },
        { status: 500 }
      );
    }

    const completedQuests = (completions ?? []).map((c) => c.quest_id);

    return NextResponse.json({ user, completedQuests });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to load user.", details: message },
      { status: 500 }
    );
  }
}
