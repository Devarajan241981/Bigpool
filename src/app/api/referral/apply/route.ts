import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";

// POST /api/referral/apply
// Called right after a new user signs up with a ?ref= code.
// Records the referral so the referrer can later claim their ₹100.
export async function POST(req: NextRequest) {
  const { referrerId, refereeId, refereeEmail } = await req.json();
  if (!referrerId || !refereeId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Don't let someone refer themselves
  if (referrerId === refereeId) {
    return NextResponse.json({ ok: true, selfReferral: true });
  }

  const db = getDb();
  if (db) {
    // Gracefully handle if referrals table doesn't exist yet
    try {
      await db.from("referrals").insert({
        id: `ref_${Date.now()}`,
        referrer_id: referrerId,
        referee_id: refereeId,
        referee_email: refereeEmail ?? "",
        credited_to_referrer: false,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Table may not exist — non-blocking
    }
  }

  return NextResponse.json({ ok: true, walletCredit: 100 });
}
