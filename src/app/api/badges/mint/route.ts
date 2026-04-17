import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ethers } from "ethers";
import { BADGE_IDS } from "@/lib/server/gameLogic";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

type MintBadgeBody = {
  userId?: string;
  badgeId?: number;
  walletAddress?: string;
  txHash?: string;
};

const MIN_BADGE_ID = BADGE_IDS.FIRST_QUEST_COMPLETED;
const MAX_BADGE_ID = BADGE_IDS.TREASURE_GUARDIAN;
const BADGES_ABI = [
  "function mintBadge(address to, uint256 badgeId) external",
] as const;

function resolveBadgeContractAddress(): string | null {
  const envAddress = process.env.SKARBNIK_BADGES_ADDRESS?.trim();
  if (envAddress) {
    return envAddress;
  }

  const deploymentsPath = path.join(process.cwd(), "deployments.json");
  if (!existsSync(deploymentsPath)) {
    return null;
  }

  const raw = readFileSync(deploymentsPath, "utf8");
  const parsed = JSON.parse(raw) as {
    baseSepolia?: { SkarbnikBadges?: { address?: string } };
  };

  return parsed.baseSepolia?.SkarbnikBadges?.address ?? null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MintBadgeBody;

    const userId = body.userId?.trim();
    const walletAddress = body.walletAddress?.trim();
    const providedTxHash = body.txHash?.trim();
    const badgeId =
      typeof body.badgeId === "number" ? Math.floor(body.badgeId) : NaN;

    if (Number.isNaN(badgeId)) {
      return NextResponse.json(
        { error: "badgeId is required." },
        { status: 400 }
      );
    }

    if (badgeId < MIN_BADGE_ID || badgeId > MAX_BADGE_ID) {
      return NextResponse.json({ error: "Invalid badgeId." }, { status: 400 });
    }

    let txHash: string;
    let blockNumber: number | null = null;
    const contractAddress = resolveBadgeContractAddress();

    if (!providedTxHash) {
      if (!walletAddress || !ethers.isAddress(walletAddress)) {
        return NextResponse.json(
          {
            error:
              "walletAddress is required and must be a valid EVM address when txHash is not provided.",
          },
          { status: 400 }
        );
      }

      if (!contractAddress) {
        return NextResponse.json(
          {
            error:
              "Badge contract address not configured. Deploy first or set SKARBNIK_BADGES_ADDRESS.",
          },
          { status: 500 }
        );
      }

      const privateKey = process.env.PRIVATE_KEY?.trim();
      if (!privateKey) {
        return NextResponse.json(
          {
            error:
              "Missing PRIVATE_KEY for on-chain minting in /api/badges/mint.",
          },
          { status: 500 }
        );
      }

      const provider = new ethers.JsonRpcProvider(
        process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org"
      );
      const signer = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(contractAddress, BADGES_ABI, signer);

      const tx = await contract.mintBadge(walletAddress, badgeId);
      const receipt = await tx.wait();

      txHash = tx.hash;
      blockNumber = receipt?.blockNumber ?? null;
    } else {
      txHash = providedTxHash;
    }

    let badgeRecord: Record<string, unknown> | null = null;
    let databaseSaved = false;
    let databaseError: string | null = null;

    if (userId) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from("badges")
          .upsert(
            {
              user_id: userId,
              badge_id: badgeId,
              tx_hash: txHash,
              minted_at: new Date().toISOString(),
            },
            { onConflict: "user_id,badge_id" }
          )
          .select("*")
          .single();

        if (error) {
          databaseError = error.message;
        } else {
          badgeRecord = data;
          databaseSaved = true;
        }
      } catch (error) {
        databaseError =
          error instanceof Error ? error.message : "Unknown database error";
      }
    }

    return NextResponse.json({
      txHash,
      badgeId,
      walletAddress: walletAddress ?? null,
      contractAddress: contractAddress ?? null,
      blockNumber,
      databaseSaved,
      databaseError,
      badge: badgeRecord,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to mint badge.", details: message },
      { status: 500 }
    );
  }
}
