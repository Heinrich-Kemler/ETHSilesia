import { NextResponse } from "next/server";
import { BADGE_IDS } from "@/lib/server/gameLogic";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

type MintBadgeBody = {
  userId?: string;
  badgeId?: number;
  txHash?: string;
};

const MIN_BADGE_ID = BADGE_IDS.FIRST_QUEST_COMPLETED;
const MAX_BADGE_ID = BADGE_IDS.TREASURE_GUARDIAN;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MintBadgeBody;

    const userId = body.userId?.trim();
    const txHash = body.txHash?.trim();
    const badgeId =
      typeof body.badgeId === "number" ? Math.floor(body.badgeId) : NaN;

    if (!userId || !txHash || Number.isNaN(badgeId)) {
      return NextResponse.json(
        { error: "userId, badgeId, and txHash are required." },
        { status: 400 }
      );
    }

    if (badgeId < MIN_BADGE_ID || badgeId > MAX_BADGE_ID) {
      return NextResponse.json({ error: "Invalid badgeId." }, { status: 400 });
    }

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
      return NextResponse.json(
        { error: "Failed to save mint transaction.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ badge: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to save mint transaction.", details: message },
      { status: 500 }
    );
  }
}
