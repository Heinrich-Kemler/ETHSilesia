import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server/supabaseAdmin";

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();

  // Create or update a test user
  const { data, error } = await supabase.from('users').upsert({
    id: "00000000-0000-0000-0000-000000000001",
    privy_id: "test-privy-user",
    wallet_address: "0x1234567890abcdef",
    level: 1,
    strong_topics: ["Konta bankowe", "Przelewy"],
    weak_topics: ["Private keys", "Phishing"],
    created_at: new Date().toISOString()
  }).select();

  return NextResponse.json({ data, error });
}
