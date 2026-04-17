import { NextResponse } from "next/server";
import { ethers } from "ethers";
import {
  ensureBadgeMintJob,
  mintBadgeDirect,
  processBadgeMintJob,
  processNextPendingBadgeMintJob,
  resolveBadgeContractAddress,
} from "@/lib/server/badgeMinting";
import { BADGE_IDS } from "@/lib/server/gameLogic";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

type MintBadgeBody = {
  userId?: string;
  badgeId?: number;
  walletAddress?: string;
  txHash?: string;
  processPending?: boolean;
};

const MIN_BADGE_ID = BADGE_IDS.FIRST_QUEST_COMPLETED;
const MAX_BADGE_ID = BADGE_IDS.TREASURE_GUARDIAN;

function parseBadgeId(value: number | undefined): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  const badgeId = Math.floor(value);
  if (badgeId < MIN_BADGE_ID || badgeId > MAX_BADGE_ID) {
    return null;
  }

  return badgeId;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MintBadgeBody;

    const userId = body.userId?.trim();
    const walletAddress = body.walletAddress?.trim();
    const providedTxHash = body.txHash?.trim();
    const processPending = body.processPending === true;
    const badgeId = parseBadgeId(body.badgeId);

    const supabase = getSupabaseAdminClient();

    if (providedTxHash) {
      if (!userId || badgeId === null) {
        return NextResponse.json(
          {
            error:
              "userId and valid badgeId are required when txHash is provided.",
          },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("badges")
        .upsert(
          {
            user_id: userId,
            badge_id: badgeId,
            tx_hash: providedTxHash,
            minted_at: new Date().toISOString(),
          },
          { onConflict: "user_id,badge_id" }
        )
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to save mint transaction.", details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        mode: "record",
        txHash: providedTxHash,
        badge: data,
      });
    }

    if (processPending) {
      const processedJob = await processNextPendingBadgeMintJob(supabase, {
        userId,
        badgeId: badgeId ?? undefined,
      });

      return NextResponse.json({
        mode: "process_pending",
        processed: Boolean(processedJob),
        job: processedJob,
      });
    }

    if (badgeId === null) {
      return NextResponse.json(
        { error: "Valid badgeId is required." },
        { status: 400 }
      );
    }

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return NextResponse.json(
        {
          error: "walletAddress is required and must be a valid EVM address.",
        },
        { status: 400 }
      );
    }

    if (userId) {
      const job = await ensureBadgeMintJob(supabase, {
        userId,
        walletAddress,
        badgeId,
      });

      const processedJob = await processBadgeMintJob(supabase, job.id);

      return NextResponse.json({
        mode: "queue",
        badgeId,
        walletAddress,
        contractAddress: resolveBadgeContractAddress(),
        txHash: processedJob.tx_hash,
        status: processedJob.status,
        attemptCount: processedJob.attempt_count,
        errorMessage: processedJob.error_message,
        job: processedJob,
      });
    }

    const result = await mintBadgeDirect({ walletAddress, badgeId });

    return NextResponse.json({
      mode: "direct",
      badgeId,
      walletAddress,
      contractAddress: result.contractAddress,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      alreadyOwned: result.alreadyOwned,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to mint badge.", details: message },
      { status: 500 }
    );
  }
}
