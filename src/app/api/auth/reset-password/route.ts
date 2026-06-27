import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { findUser, serverUsers } from "@/lib/server-store";
import { otpStore } from "@/app/api/auth/forgot-password/route";

export async function POST(request: NextRequest) {
  const { email, otp, newPassword } = await request.json();
  if (!email || !otp || !newPassword) {
    return Response.json({ error: "Email, OTP and new password are required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = getDb();

  if (db) {
    const { data: stored, error } = await db
      .from("otp_store")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (error || !stored) {
      return Response.json({ error: "No reset request found. Please request again." }, { status: 400 });
    }
    if (Date.now() > stored.expires_at) {
      await db.from("otp_store").delete().eq("email", normalizedEmail);
      return Response.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
    }
    if (stored.otp !== otp.trim()) {
      return Response.json({ error: "Incorrect OTP. Please check and try again." }, { status: 400 });
    }

    // Update password in users table
    const { error: updateError } = await db
      .from("users")
      .update({ password: newPassword })
      .eq("email", normalizedEmail);

    if (updateError) {
      return Response.json({ error: "Failed to update password." }, { status: 500 });
    }

    await db.from("otp_store").delete().eq("email", normalizedEmail);
    return Response.json({ success: true });
  }

  // In-memory fallback
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
  if (user) {
    user.password = newPassword;
  } else {
    serverUsers.push({
      id: `u_${Date.now()}`,
      name: normalizedEmail,
      email: normalizedEmail,
      password: newPassword,
      role: "customer" as const,
      createdAt: new Date().toISOString(),
    });
  }
  otpStore.delete(normalizedEmail);
  return Response.json({ success: true });
}
