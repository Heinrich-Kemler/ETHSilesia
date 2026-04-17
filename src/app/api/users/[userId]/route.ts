import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

/**
 * GET /api/users/[userId]
 * Returns the user row plus quest completion data.
 *   - `completedQuests`: string[] of quest IDs (back-compat for existing consumers)
 *   - `questCompletions`: richer rows with XP + score + completion date, newest first
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
      .select("quest_id, xp_earned, answers_correct, answers_total, completed_at")
      .eq("user_id", id)
      .order("completed_at", { ascending: false });

    if (completionsError) {
      return NextResponse.json(
        {
          error: "Failed to load completed quests.",
          details: completionsError.message,
        },
        { status: 500 }
      );
    }

    const rows = completions ?? [];
    const completedQuests = rows.map((c) => c.quest_id);
    const questCompletions = rows.map((c) => ({
      quest_id: c.quest_id,
      xp_earned: c.xp_earned,
      answers_correct: c.answers_correct,
      answers_total: c.answers_total,
      completed_at: c.completed_at,
    }));

    return NextResponse.json({ user, completedQuests, questCompletions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to load user.", details: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[userId]
 * Updates mutable profile fields on the user row. Currently only `username`
 * is exposed — we validate length and non-empty, then write it through.
 *
 * Body: { username?: string }
 */
export async function PATCH(
  request: Request,
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

    const body = (await request.json().catch(() => null)) as
      | { username?: unknown }
      | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const updates: { username?: string } = {};

    if (body.username !== undefined) {
      if (typeof body.username !== "string") {
        return NextResponse.json(
          { error: "username must be a string." },
          { status: 400 }
        );
      }
      const trimmed = body.username.trim();
      if (trimmed.length === 0) {
        return NextResponse.json(
          { error: "username cannot be empty." },
          { status: 400 }
        );
      }
      if (trimmed.length > 40) {
        return NextResponse.json(
          { error: "username too long (max 40 characters)." },
          { status: 400 }
        );
      }
      updates.username = trimmed;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No mutable fields supplied." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select(
        "id, privy_id, wallet_address, username, google_email, level, total_xp, streak_days, last_active, language, created_at"
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update user.", details: error.message },
        { status: 500 }
      );
    }
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update user.", details: message },
      { status: 500 }
    );
  }
}
