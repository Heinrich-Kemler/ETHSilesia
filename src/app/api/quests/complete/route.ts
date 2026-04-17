import { NextResponse } from "next/server";
import {
  BADGE_IDS,
  calculateLevelFromXp,
  calculateNextStreakDays,
  isBossBattleQuest,
} from "@/lib/server/gameLogic";
import { ensureBadgeMintJob } from "@/lib/server/badgeMinting";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

type CompleteQuestBody = {
  userId?: string;
  questId?: string;
  xpEarned?: number;
  score?: number;
  answersTotal?: number;
};

function parsePositiveInt(value: number | undefined, fallback = 0): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.floor(value));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompleteQuestBody;

    const userId = body.userId?.trim();
    const questId = body.questId?.trim();
    const xpEarned = parsePositiveInt(body.xpEarned);
    const score = parsePositiveInt(body.score);
    const answersTotal = parsePositiveInt(body.answersTotal, score);

    if (!userId || !questId) {
      return NextResponse.json(
        { error: "userId and questId are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, wallet_address, total_xp, level, streak_days, last_active")
      .eq("id", userId)
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

    const nowIso = new Date().toISOString();

    const { error: completionError } = await supabase
      .from("quest_completions")
      .insert({
        user_id: userId,
        quest_id: questId,
        xp_earned: xpEarned,
        completed_at: nowIso,
        answers_correct: score,
        answers_total: answersTotal,
      });

    if (completionError) {
      if (completionError.code === "23505") {
        return NextResponse.json(
          { error: "Quest already completed by this user." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to save quest completion.",
          details: completionError.message,
        },
        { status: 500 }
      );
    }

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
      return NextResponse.json(
        { error: "Failed to update user XP.", details: updateUserError.message },
        { status: 500 }
      );
    }

    const potentialBadges: number[] = [];

    const { count: completionCount, error: completionCountError } = await supabase
      .from("quest_completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (completionCountError) {
      return NextResponse.json(
        {
          error: "Failed while checking badge progress.",
          details: completionCountError.message,
        },
        { status: 500 }
      );
    }

    if (completionCount === 1) {
      potentialBadges.push(BADGE_IDS.FIRST_QUEST_COMPLETED);
    }

    if (user.level < 2 && newLevel >= 2) {
      potentialBadges.push(BADGE_IDS.SILVER_TREASURER);
    }

    if (user.level < 3 && newLevel >= 3) {
      potentialBadges.push(BADGE_IDS.GOLDEN_TREASURER);
    }

    if (isBossBattleQuest(questId)) {
      potentialBadges.push(BADGE_IDS.TRIAL_PASSED);
    }

    if (newStreakDays >= 7) {
      potentialBadges.push(BADGE_IDS.TREASURE_GUARDIAN);
    }

    const uniquePotentialBadges = [...new Set(potentialBadges)];

    if (uniquePotentialBadges.length === 0) {
      return NextResponse.json({
        newXP,
        levelUp,
        badgeEarned: null,
        badgesEarned: [],
        mintJobsEnqueued: 0,
      });
    }

    const { data: existingBadges, error: existingBadgesError } = await supabase
      .from("badges")
      .select("badge_id")
      .eq("user_id", userId)
      .in("badge_id", uniquePotentialBadges);

    if (existingBadgesError) {
      return NextResponse.json(
        {
          error: "Failed while checking existing badges.",
          details: existingBadgesError.message,
        },
        { status: 500 }
      );
    }

    const { data: trackedMintJobs, error: trackedMintJobsError } = await supabase
      .from("badge_mint_jobs")
      .select("badge_id")
      .eq("user_id", userId)
      .in("badge_id", uniquePotentialBadges);

    if (trackedMintJobsError) {
      return NextResponse.json(
        {
          error: "Failed while checking tracked badge mint jobs.",
          details: trackedMintJobsError.message,
        },
        { status: 500 }
      );
    }

    const trackedBadgeIds = new Set([
      ...(existingBadges ?? []).map((badge) => badge.badge_id),
      ...(trackedMintJobs ?? []).map((job) => job.badge_id),
    ]);

    const badgesEarned = uniquePotentialBadges.filter(
      (badgeId) => !trackedBadgeIds.has(badgeId)
    );

    const enqueuedJobIds: string[] = [];

    for (const badgeId of badgesEarned) {
      try {
        const job = await ensureBadgeMintJob(supabase, {
          userId,
          walletAddress: user.wallet_address,
          badgeId,
        });
        enqueuedJobIds.push(job.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
          {
            error: "Failed while enqueueing badge mint jobs.",
            details: message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      newXP,
      levelUp,
      badgeEarned: badgesEarned[0] ?? null,
      badgesEarned,
      mintJobsEnqueued: enqueuedJobIds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to complete quest.", details: message },
      { status: 500 }
    );
  }
}
