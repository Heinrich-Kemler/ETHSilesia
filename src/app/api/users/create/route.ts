import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";

type CreateUserBody = {
  privyId?: string;
  walletAddress?: string;
  email?: string;
};

function generateUsername(walletAddress: string, email?: string): string {
  if (email && email.includes("@")) {
    const [localPart] = email.split("@");
    if (localPart.trim().length > 0) {
      return localPart.trim().slice(0, 24);
    }
  }

  const cleanedAddress = walletAddress.toLowerCase();
  return `user_${cleanedAddress.slice(2, 8)}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateUserBody;

    const privyId = body.privyId?.trim();
    const walletAddress = body.walletAddress?.trim();
    const email = body.email?.trim();

    if (!privyId || !walletAddress) {
      return NextResponse.json(
        { error: "privyId and walletAddress are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const payload = {
      privy_id: privyId,
      wallet_address: walletAddress.toLowerCase(),
      google_email: email || null,
      username: generateUsername(walletAddress, email),
      last_active: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("users")
      .upsert(payload, { onConflict: "privy_id" })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create user.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create user.", details: message },
      { status: 500 }
    );
  }
}
