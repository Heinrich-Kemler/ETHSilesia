import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ethers } from "ethers";
import type { SupabaseClient } from "@supabase/supabase-js";

export type BadgeMintJobStatus =
  | "pending"
  | "sending"
  | "submitted"
  | "confirmed"
  | "failed";

export type BadgeMintJobRecord = {
  id: string;
  user_id: string;
  wallet_address: string;
  badge_id: number;
  status: BadgeMintJobStatus;
  tx_hash: string | null;
  error_message: string | null;
  attempt_count: number;
  last_attempted_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

const BADGE_CONTRACT_ABI = [
  "function mintBadge(address to, uint256 badgeId) external",
  "function hasBadge(address user, uint256 badgeId) view returns (bool)",
] as const;
const TRANSFER_SINGLE_EVENT_ABI = [
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
] as const;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

export function resolveBadgeContractAddress(): string {
  const envAddress = process.env.SKARBNIK_BADGES_ADDRESS?.trim();
  if (envAddress) {
    return envAddress;
  }

  const deploymentsPath = path.join(process.cwd(), "deployments.json");
  if (!existsSync(deploymentsPath)) {
    throw new Error(
      "Badge contract address not configured. Deploy first or set SKARBNIK_BADGES_ADDRESS."
    );
  }

  const raw = readFileSync(deploymentsPath, "utf8");
  const parsed = JSON.parse(raw) as {
    baseSepolia?: { SkarbnikBadges?: { address?: string } };
  };

  const deployedAddress = parsed.baseSepolia?.SkarbnikBadges?.address;
  if (!deployedAddress) {
    throw new Error(
      "SkarbnikBadges address missing in deployments.json. Deploy first or set SKARBNIK_BADGES_ADDRESS."
    );
  }

  return deployedAddress;
}

function getBadgeContractWithSigner() {
  const privateKey = requireEnv("PRIVATE_KEY");
  const rpcUrl =
    process.env.BASE_SEPOLIA_RPC?.trim() || "https://sepolia.base.org";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const contractAddress = resolveBadgeContractAddress();
  const contract = new ethers.Contract(
    contractAddress,
    BADGE_CONTRACT_ABI,
    signer
  );

  return { contract, contractAddress };
}

function getBadgeProvider() {
  const rpcUrl =
    process.env.BASE_SEPOLIA_RPC?.trim() || "https://sepolia.base.org";
  return new ethers.JsonRpcProvider(rpcUrl);
}

export async function verifyBadgeMintTransaction(params: {
  txHash: string;
  expectedWalletAddress: string;
  expectedBadgeId: number;
}): Promise<{
  isValid: boolean;
  blockNumber: number | null;
}> {
  const { txHash, expectedWalletAddress, expectedBadgeId } = params;
  const provider = getBadgeProvider();
  const contractAddress = resolveBadgeContractAddress().toLowerCase();
  const interfaceDecoder = new ethers.Interface(TRANSFER_SINGLE_EVENT_ABI);
  const expectedWallet = expectedWalletAddress.toLowerCase();

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) {
    return {
      isValid: false,
      blockNumber: receipt?.blockNumber ?? null,
    };
  }

  const hasMatchingMintLog = receipt.logs.some((log) => {
    if (log.address.toLowerCase() !== contractAddress) {
      return false;
    }

    try {
      const parsedLog = interfaceDecoder.parseLog(log);
      if (parsedLog?.name !== "TransferSingle") {
        return false;
      }

      const from = (parsedLog.args.from as string).toLowerCase();
      const to = (parsedLog.args.to as string).toLowerCase();
      const id = Number(parsedLog.args.id);
      const value = Number(parsedLog.args.value);

      return (
        from === ethers.ZeroAddress &&
        to === expectedWallet &&
        id === expectedBadgeId &&
        value >= 1
      );
    } catch {
      return false;
    }
  });

  return {
    isValid: hasMatchingMintLog,
    blockNumber: receipt.blockNumber ?? null,
  };
}

export async function ensureBadgeMintJob(
  supabase: SupabaseClient,
  params: {
    userId: string;
    walletAddress: string;
    badgeId: number;
  }
): Promise<BadgeMintJobRecord> {
  const { userId, walletAddress, badgeId } = params;

  const { data: existingJob, error: existingJobError } = await supabase
    .from("badge_mint_jobs")
    .select("*")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();

  if (existingJobError) {
    throw new Error(`Failed to check mint job state: ${existingJobError.message}`);
  }

  if (existingJob) {
    if (
      existingJob.status === "pending" ||
      existingJob.status === "sending" ||
      existingJob.status === "submitted" ||
      existingJob.status === "confirmed"
    ) {
      return existingJob as BadgeMintJobRecord;
    }

    const { data: resetJob, error: resetError } = await supabase
      .from("badge_mint_jobs")
      .update({
        wallet_address: walletAddress.toLowerCase(),
        status: "pending",
        error_message: null,
      })
      .eq("id", existingJob.id)
      .select("*")
      .single();

    if (resetError || !resetJob) {
      throw new Error(
        `Failed to reset failed mint job: ${resetError?.message || "Unknown error"}`
      );
    }

    return resetJob as BadgeMintJobRecord;
  }

  const { data: newJob, error: createError } = await supabase
    .from("badge_mint_jobs")
    .insert({
      user_id: userId,
      wallet_address: walletAddress.toLowerCase(),
      badge_id: badgeId,
      status: "pending",
    })
    .select("*")
    .single();

  if (createError || !newJob) {
    throw new Error(
      `Failed to create mint job: ${createError?.message || "Unknown error"}`
    );
  }

  return newJob as BadgeMintJobRecord;
}

async function saveConfirmedBadge(
  supabase: SupabaseClient,
  params: {
    userId: string;
    badgeId: number;
    txHash: string | null;
  }
) {
  const { userId, badgeId, txHash } = params;

  const { error } = await supabase
    .from("badges")
    .upsert(
      {
        user_id: userId,
        badge_id: badgeId,
        tx_hash: txHash,
        minted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,badge_id" }
    );

  if (error) {
    throw new Error(`Failed to save confirmed badge: ${error.message}`);
  }
}

export async function processBadgeMintJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<BadgeMintJobRecord> {
  const { data: currentJob, error: fetchJobError } = await supabase
    .from("badge_mint_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchJobError || !currentJob) {
    throw new Error(
      `Failed to load mint job ${jobId}: ${fetchJobError?.message || "Not found"}`
    );
  }

  if (currentJob.status === "confirmed") {
    return currentJob as BadgeMintJobRecord;
  }

  const nextAttemptCount = (currentJob.attempt_count || 0) + 1;
  const attemptTimestamp = new Date().toISOString();

  const { error: markSendingError } = await supabase
    .from("badge_mint_jobs")
    .update({
      status: "sending",
      attempt_count: nextAttemptCount,
      last_attempted_at: attemptTimestamp,
      error_message: null,
    })
    .eq("id", jobId);

  if (markSendingError) {
    throw new Error(
      `Failed to mark mint job as sending: ${markSendingError.message}`
    );
  }

  try {
    const { contract, contractAddress } = getBadgeContractWithSigner();
    const walletAddress = (currentJob.wallet_address as string).toLowerCase();
    const badgeId = currentJob.badge_id as number;

    const alreadyHasBadge = await contract.hasBadge(walletAddress, badgeId);

    if (alreadyHasBadge) {
      await saveConfirmedBadge(supabase, {
        userId: currentJob.user_id as string,
        badgeId,
        txHash: currentJob.tx_hash || null,
      });

      const { data: confirmedJob, error: confirmedError } = await supabase
        .from("badge_mint_jobs")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", jobId)
        .select("*")
        .single();

      if (confirmedError || !confirmedJob) {
        throw new Error(
          `Failed to confirm already-owned badge job: ${confirmedError?.message || "Unknown error"}`
        );
      }

      return confirmedJob as BadgeMintJobRecord;
    }

    const tx = await contract.mintBadge(walletAddress, badgeId);

    const { error: markSubmittedError } = await supabase
      .from("badge_mint_jobs")
      .update({
        status: "submitted",
        tx_hash: tx.hash,
        error_message: null,
      })
      .eq("id", jobId);

    if (markSubmittedError) {
      throw new Error(
        `Failed to mark mint job as submitted: ${markSubmittedError.message}`
      );
    }

    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error(
        `Mint transaction failed or reverted for contract ${contractAddress}.`
      );
    }

    await saveConfirmedBadge(supabase, {
      userId: currentJob.user_id as string,
      badgeId,
      txHash: tx.hash,
    });

    const { data: confirmedJob, error: confirmJobError } = await supabase
      .from("badge_mint_jobs")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", jobId)
      .select("*")
      .single();

    if (confirmJobError || !confirmedJob) {
      throw new Error(
        `Failed to mark mint job as confirmed: ${confirmJobError?.message || "Unknown error"}`
      );
    }

    return confirmedJob as BadgeMintJobRecord;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    const { data: failedJob } = await supabase
      .from("badge_mint_jobs")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", jobId)
      .select("*")
      .single();

    if (failedJob) {
      return failedJob as BadgeMintJobRecord;
    }

    throw new Error(`Mint job failed and could not be updated: ${errorMessage}`);
  }
}

export async function processNextPendingBadgeMintJob(
  supabase: SupabaseClient,
  filters?: {
    userId?: string;
    badgeId?: number;
  }
): Promise<BadgeMintJobRecord | null> {
  let query = supabase
    .from("badge_mint_jobs")
    .select("*")
    .in("status", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(1);

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (typeof filters?.badgeId === "number") {
    query = query.eq("badge_id", filters.badgeId);
  }

  const { data: jobs, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch pending mint job: ${error.message}`);
  }

  const job = jobs?.[0] as BadgeMintJobRecord | undefined;
  if (!job) {
    return null;
  }

  return processBadgeMintJob(supabase, job.id);
}

export async function mintBadgeDirect(params: {
  walletAddress: string;
  badgeId: number;
}): Promise<{
  txHash: string | null;
  blockNumber: number | null;
  alreadyOwned: boolean;
  contractAddress: string;
}> {
  const { walletAddress, badgeId } = params;
  const normalizedAddress = walletAddress.toLowerCase();
  const { contract, contractAddress } = getBadgeContractWithSigner();

  const alreadyHasBadge = await contract.hasBadge(normalizedAddress, badgeId);
  if (alreadyHasBadge) {
    return {
      txHash: null,
      blockNumber: null,
      alreadyOwned: true,
      contractAddress,
    };
  }

  const tx = await contract.mintBadge(normalizedAddress, badgeId);
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
    alreadyOwned: false,
    contractAddress,
  };
}
