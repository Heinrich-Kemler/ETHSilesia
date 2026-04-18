import { NextResponse } from "next/server";
import { ApiError, logServerError, toApiError } from "@/lib/server/apiErrors";
import {
  assertPrivyOwnership,
  requirePrivyAuth,
} from "@/lib/server/auth";
import { assertRateLimit } from "@/lib/server/rateLimit";
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
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    assertRateLimit(request, {
      key: "users-get",
      maxRequests: 120,
      windowMs: 60 * 1000,
    });

    const auth = await requirePrivyAuth(request);
    const { userId } = await context.params;
    const id = userId?.trim();
    if (!id) {
      throw new ApiError(400, "userId is required.");
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
      throw new ApiError(500, "Failed to load user.", false);
    }
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    assertPrivyOwnership(auth, user.privy_id);

    const { data: completions, error: completionsError } = await supabase
      .from("quest_completions")
      .select("quest_id, xp_earned, answers_correct, answers_total, completed_at")
      .eq("user_id", id)
      .order("completed_at", { ascending: false });

    if (completionsError) {
      throw new ApiError(500, "Failed to load completed quests.", false);
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
    const apiError = toApiError(error, "Failed to load user.");
    if (apiError.status >= 500) {
      logServerError("api/users/[userId]#GET", error);
    }
    return NextResponse.json(
      {
        error: apiError.exposeMessage ? apiError.message : "Failed to load user.",
      },
      { status: apiError.status }
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
    assertRateLimit(request, {
      key: "users-patch",
      maxRequests: 60,
      windowMs: 60 * 1000,
    });

    const auth = await requirePrivyAuth(request);
    const { userId } = await context.params;
    const id = userId?.trim();
    if (!id) {
      throw new ApiError(400, "userId is required.");
    }

    const body = (await request.json().catch(() => null)) as
      | { username?: unknown }
      | null;
    if (!body || typeof body !== "object") {
      throw new ApiError(400, "Invalid JSON body.");
    }

    const updates: { username?: string } = {};

    if (body.username !== undefined) {
      if (typeof body.username !== "string") {
        throw new ApiError(400, "username must be a string.");
      }
      const trimmed = body.username.trim();
      if (trimmed.length === 0) {
        throw new ApiError(400, "username cannot be empty.");
      }
      if (trimmed.length > 40) {
        throw new ApiError(400, "username too long (max 40 characters).");
      }
      updates.username = trimmed;
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "No mutable fields supplied.");
    }

    const supabase = getSupabaseAdminClient();
    const { data: ownershipUser, error: ownershipError } = await supabase
      .from("users")
      .select("privy_id")
      .eq("id", id)
      .maybeSingle();

    if (ownershipError) {
      throw new ApiError(500, "Failed to verify user ownership.", false);
    }
    if (!ownershipUser) {
      throw new ApiError(404, "User not found.");
    }

    assertPrivyOwnership(auth, ownershipUser.privy_id);

    const { data: user, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select(
        "id, privy_id, wallet_address, username, google_email, level, total_xp, streak_days, last_active, language, created_at"
      )
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "Failed to update user.", false);
    }
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    return NextResponse.json({ user });
  } catch (error) {
    const apiError = toApiError(error, "Failed to update user.");
    if (apiError.status >= 500) {
      logServerError("api/users/[userId]#PATCH", error);
    }
    return NextResponse.json(
      {
        error: apiError.exposeMessage
          ? apiError.message
          : "Failed to update user.",
      },
      { status: apiError.status }
    );
  }
}
