import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  return NextResponse.json({ success: true, paymentId: razorpay_payment_id });
}
