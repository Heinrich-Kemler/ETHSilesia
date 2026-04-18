import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { ApiError, logServerError, toApiError } from "@/lib/server/apiErrors";
import {
  assertPrivyOwnership,
  requireInternalApiKey,
  requirePrivyAuth,
} from "@/lib/server/auth";
import {
  ensureBadgeMintJob,
  mintBadgeDirect,
  processBadgeMintJob,
  processNextPendingBadgeMintJob,
  resolveBadgeContractAddress,
  verifyBadgeMintTransaction,
} from "@/lib/server/badgeMinting";
import { BADGE_ID_RANGE } from "@/lib/server/gameLogic";
import { assertRateLimit } from "@/lib/server/rateLimit";
import { assertAndConsumeRequestNonce } from "@/lib/server/requestNonce";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

type MintBadgeBody = {
  userId?: string;
  badgeId?: number;
  walletAddress?: string;
  txHash?: string;
  processPending?: boolean;
};

const MIN_BADGE_ID = BADGE_ID_RANGE.MIN;
const MAX_BADGE_ID = BADGE_ID_RANGE.MAX;

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
    assertRateLimit(request, {
      key: "badges-mint",
      maxRequests: 60,
      windowMs: 60 * 1000,
    });

    const body = (await request.json()) as MintBadgeBody;

    const userId = body.userId?.trim();
    const walletAddress = body.walletAddress?.trim();
    const providedTxHash = body.txHash?.trim();
    const processPending = body.processPending === true;
    const badgeId = parseBadgeId(body.badgeId);

    const supabase = getSupabaseAdminClient();

    if (processPending) {
      // Processing queued on-chain mints is backend-only.
      requireInternalApiKey(request);
      await assertAndConsumeRequestNonce(
        request,
        supabase,
        "badges:process-pending"
      );

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

    if (providedTxHash) {
      const auth = await requirePrivyAuth(request);
      if (!userId || badgeId === null) {
        throw new ApiError(
          400,
          "userId and valid badgeId are required when txHash is provided."
        );
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, privy_id, wallet_address")
        .eq("id", userId)
        .maybeSingle();

      if (userError) {
        throw new ApiError(500, "Failed to load user for tx verification.", false);
      }

      if (!user) {
        throw new ApiError(404, "User not found.");
      }

      assertPrivyOwnership(auth, user.privy_id);

      const verification = await verifyBadgeMintTransaction({
        txHash: providedTxHash,
        expectedWalletAddress: user.wallet_address,
        expectedBadgeId: badgeId,
      });

      if (!verification.isValid) {
        throw new ApiError(
          400,
          "Provided txHash is not a valid Skarbnik badge mint for this user."
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
        throw new ApiError(500, "Failed to save mint transaction.", false);
      }

      return NextResponse.json({
        mode: "record",
        txHash: providedTxHash,
        contractAddress: resolveBadgeContractAddress(),
        blockNumber: verification.blockNumber,
        badge: data,
      });
    }

    requireInternalApiKey(request);
    await assertAndConsumeRequestNonce(request, supabase, "badges:mint");

    if (badgeId === null) {
      throw new ApiError(400, "Valid badgeId is required.");
    }

    if (userId) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, wallet_address")
        .eq("id", userId)
        .maybeSingle();

      if (userError) {
        throw new ApiError(500, "Failed to load user for badge minting.", false);
      }
      if (!user) {
        throw new ApiError(404, "User not found.");
      }

      if (walletAddress && walletAddress.toLowerCase() !== user.wallet_address) {
        throw new ApiError(
          400,
          "walletAddress does not match the user's registered wallet."
        );
      }

      const job = await ensureBadgeMintJob(supabase, {
        userId,
        walletAddress: user.wallet_address,
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

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      throw new ApiError(
        400,
        "walletAddress is required and must be a valid EVM address."
      );
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
    const apiError = toApiError(error, "Failed to mint badge.");
    if (apiError.status >= 500) {
      logServerError("api/badges/mint", error);
    }
    return NextResponse.json(
      {
        error: apiError.exposeMessage ? apiError.message : "Failed to mint badge.",
      },
      { status: apiError.status }
    );
  }
}
