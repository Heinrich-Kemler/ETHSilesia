import { NextResponse } from "next/server";
import { ApiError, logServerError, toApiError } from "@/lib/server/apiErrors";
import {
  assertPrivyOwnership,
  requirePrivyAuth,
} from "@/lib/server/auth";
import {
  BADGE_IDS,
  QUEST_TOPIC_BADGE_RULES,
  calculateLevelFromXp,
  calculateNextStreakDays,
  isBossBattleQuest,
} from "@/lib/server/gameLogic";
import {
  LEVEL_COMPLETION_BADGE_RULES,
  getQuestCompletionBadgeId,
} from "@/lib/badgeMappings";
import { ensureBadgeMintJob } from "@/lib/server/badgeMinting";
import {
  calculateQuestXp,
  getQuestDefinition,
  isQuestUnlocked,
  normalizeScore,
} from "@/lib/server/questCatalog";
import { assertRateLimit } from "@/lib/server/rateLimit";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

type CompleteQuestBody = {
  userId?: string;
  questId?: string;
  score?: number;
};

export async function POST(request: Request) {
  try {
    assertRateLimit(request, {
      key: "quests-complete",
      maxRequests: 90,
      windowMs: 60 * 1000,
    });

    const auth = await requirePrivyAuth(request);
    const body = (await request.json()) as CompleteQuestBody;

    const userId = body.userId?.trim();
    const questId = body.questId?.trim();

    if (!userId || !questId) {
      throw new ApiError(400, "userId and questId are required.");
    }

    const quest = getQuestDefinition(questId);
    if (!quest) {
      throw new ApiError(400, "Unknown questId.");
    }

    // XP is computed on the server from trusted quest metadata.
    // Client-provided XP is intentionally ignored to prevent score tampering.
    const score = normalizeScore(body.score, quest.questionCount);
    const answersTotal = quest.questionCount;
    const xpEarned = calculateQuestXp(quest, score);

    const supabase = getSupabaseAdminClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, privy_id, wallet_address, total_xp, level, streak_days, last_active"
      )
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      throw new ApiError(500, "Failed to load user.", false);
    }

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    assertPrivyOwnership(auth, user.privy_id);

    // ── Server-side unlock gate ──────────────────────────────────────────
    // Previously this route trusted whatever `questId` the client sent,
    // so a direct POST could farm `l3-boss` as a first action. Pull the
    // user's existing completions first and run the same prerequisite
    // check the UI uses before we accept the new one.
    const { data: priorCompletions, error: priorCompletionsError } =
      await supabase
        .from("quest_completions")
        .select("quest_id")
        .eq("user_id", userId);

    if (priorCompletionsError) {
      throw new ApiError(500, "Failed to load quest progress.", false);
    }

    const priorQuestIds = (priorCompletions ?? []).map((row) => row.quest_id);

    if (!isQuestUnlocked(questId, priorQuestIds)) {
      throw new ApiError(
        403,
        "Quest is locked — complete prerequisites first."
      );
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
        throw new ApiError(409, "Quest already completed by this user.");
      }

      throw new ApiError(500, "Failed to save quest completion.", false);
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
      throw new ApiError(500, "Failed to update user XP.", false);
    }

    const potentialBadges: number[] = [];

    // Reuse the pre-insert list fetched above for the unlock gate; append
    // the just-inserted questId to get the post-insert view without a
    // second round-trip. The unique-constraint handling above guarantees
    // `questId` wasn't already in the set.
    const completedQuestIds = new Set([...priorQuestIds, questId]);

    if (completedQuestIds.size === 1) {
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

    const questCompletionBadgeId = getQuestCompletionBadgeId(questId);
    if (questCompletionBadgeId) {
      potentialBadges.push(questCompletionBadgeId);
    }

    for (const rule of QUEST_TOPIC_BADGE_RULES) {
      const allQuestsCompleted = rule.requiredQuestIds.every((requiredQuestId) =>
        completedQuestIds.has(requiredQuestId)
      );

      if (allQuestsCompleted) {
        potentialBadges.push(rule.badgeId);
      }
    }

    for (const rule of LEVEL_COMPLETION_BADGE_RULES) {
      const allLevelQuestsCompleted = rule.requiredQuestIds.every((requiredQuestId) =>
        completedQuestIds.has(requiredQuestId)
      );

      if (allLevelQuestsCompleted) {
        potentialBadges.push(rule.badgeId);
      }
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
      throw new ApiError(500, "Failed while checking existing badges.", false);
    }

    const { data: trackedMintJobs, error: trackedMintJobsError } = await supabase
      .from("badge_mint_jobs")
      .select("badge_id")
      .eq("user_id", userId)
      .in("badge_id", uniquePotentialBadges);

    if (trackedMintJobsError) {
      throw new ApiError(
        500,
        "Failed while checking tracked badge mint jobs.",
        false
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
      } catch {
        throw new ApiError(
          500,
          "Failed while enqueueing badge mint jobs.",
          false
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
    const apiError = toApiError(error, "Failed to complete quest.");
    if (apiError.status >= 500) {
      logServerError("api/quests/complete", error);
    }
    return NextResponse.json(
      {
        error: apiError.exposeMessage
          ? apiError.message
          : "Failed to complete quest.",
      },
      { status: apiError.status }
    );
  }
}
