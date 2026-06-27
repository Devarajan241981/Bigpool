import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return Response.json({ error: "Email required." }, { status: 400 });

  const db = getDb();
  if (!db) return Response.json({});

  const { data } = await db
    .from("users")
    .select("bank_account, ifsc, bank_name, account_holder, upi_id")
    .eq("email", email.toLowerCase().trim())
    .single();

  return Response.json(data ?? {});
}

export async function POST(request: NextRequest) {
  const { email, bankAccount, ifsc, bankName, accountHolder, upiId } = await request.json();
  if (!email) return Response.json({ error: "Email required." }, { status: 400 });

  const db = getDb();
  if (!db) return Response.json({ success: true }); // silent fallback

  const { error } = await db
    .from("users")
    .update({
      bank_account: bankAccount,
      ifsc: ifsc,
      bank_name: bankName,
      account_holder: accountHolder,
      upi_id: upiId,
    })
    .eq("email", email.toLowerCase().trim());

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
