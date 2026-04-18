import { NextResponse } from "next/server";
import { ApiError, logServerError, toApiError } from "@/lib/server/apiErrors";
import {
  assertPrivyOwnership,
  requirePrivyAuth,
} from "@/lib/server/auth";
import {
  calculateLevelFromXp,
  calculateNextStreakDays,
} from "@/lib/server/gameLogic";
import { assertRateLimit } from "@/lib/server/rateLimit";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

type DailyQuestBody = {
  userId?: string;
  xpEarned?: number;
};

export async function POST(request: Request) {
  try {
    assertRateLimit(request, {
      key: "quests-daily",
      maxRequests: 30, // Po jednej na dzień, więc 30 starczy mocno na limit
      windowMs: 60 * 1000,
    });

    const auth = await requirePrivyAuth(request);
    const body = (await request.json()) as DailyQuestBody;

    const userId = body.userId?.trim();
    if (!userId) {
      throw new ApiError(400, "userId is required.");
    }
    
    // Ufamy klientowi co do XP wyzwania dziennego (obecnie max 10 XP zabezpieczone na frontendzie 
    // ale sprawdzimy na backendzie dla bezpieczeństwa by nie przesłał 10000000)
    const xpEarned = Math.min(Math.max((body.xpEarned || 0), 0), 50);

    const supabase = getSupabaseAdminClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, privy_id, wallet_address, total_xp, level, streak_days, last_active")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      throw new ApiError(500, "Failed to load user.", false);
    }

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    assertPrivyOwnership(auth, user.privy_id);

    const nowIso = new Date().toISOString();
    const newXP = user.total_xp + xpEarned;
    const newLevel = calculateLevelFromXp(newXP);
    const levelUp = newLevel > user.level;
    const newStreakDays = calculateNextStreakDays(
      user.last_active,
      user.streak_days
    );

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        total_xp: newXP,
        level: newLevel,
        streak_days: newStreakDays,
        last_active: nowIso,
      })
      .eq("id", userId);

    if (updateUserError) {
      throw new ApiError(500, "Failed to update user XP.", false);
    }

    // Ze względu na uproszczenie do wyzwania dziennego nie zliczamy aktualnie questCompletion
    // Skupiamy się na nagrodzeniu user.total_xp

    return NextResponse.json({
      newXP,
      levelUp,
      badgeEarned: null,
      badgesEarned: [],
    });
  } catch (error) {
    const apiError = toApiError(error, "Failed to complete daily quest.");
    if (apiError.status >= 500) {
      logServerError("api/quests/daily", error);
    }
    return NextResponse.json(
      {
        error: apiError.exposeMessage
          ? apiError.message
          : "Failed to complete daily quest.",
      },
      { status: apiError.status }
    );
  }
}
