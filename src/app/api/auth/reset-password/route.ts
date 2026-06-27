import { NextRequest } from "next/server";
import { findUser } from "@/lib/server-store";
import { otpStore } from "@/app/api/auth/forgot-password/route";

export async function POST(request: NextRequest) {
  const { email, otp, newPassword } = await request.json();
  if (!email || !otp || !newPassword) {
    return Response.json({ error: "Email, OTP and new password are required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const stored = otpStore.get(normalizedEmail);

  if (!stored) return Response.json({ error: "No reset request found. Please request again." }, { status: 400 });
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(normalizedEmail);
    return Response.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
  }
  if (stored.otp !== otp.trim()) {
    return Response.json({ error: "Incorrect OTP. Please check and try again." }, { status: 400 });
  }

  const user = findUser(normalizedEmail);
  if (!user) return Response.json({ error: "Account not found." }, { status: 404 });

  user.password = newPassword;
  otpStore.delete(normalizedEmail);

  return Response.json({ success: true });
}
