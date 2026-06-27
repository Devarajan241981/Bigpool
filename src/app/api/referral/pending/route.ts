import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";

// GET /api/referral/pending?userId=X
// Returns unclaimed referrer credits (people who used this user's referral link)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ credits: 0, count: 0 });

  const db = getDb();
  if (!db) return NextResponse.json({ credits: 0, count: 0 });

  try {
    const { data } = await db
      .from("referrals")
      .select("id")
      .eq("referrer_id", userId)
      .eq("credited_to_referrer", false);

    const count = data?.length ?? 0;
    if (count > 0) {
      // Mark all as credited
      await db
        .from("referrals")
        .update({ credited_to_referrer: true })
        .eq("referrer_id", userId)
        .eq("credited_to_referrer", false);
    }

    return NextResponse.json({ credits: count * 100, count });
  } catch {
    return NextResponse.json({ credits: 0, count: 0 });
  }
}
