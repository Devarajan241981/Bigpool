import { NextRequest } from "next/server";
import { findUser } from "@/lib/server-store";

// In-memory OTP store: email -> { otp, expiresAt }
export const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return Response.json({ error: "Email required." }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();
  const user = findUser(normalizedEmail);

  // Always respond with success to avoid email enumeration
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(normalizedEmail, { otp, expiresAt: Date.now() + 15 * 60 * 1000 }); // 15 min

  if (!user) {
    // User not found but don't reveal that — just return success
    return Response.json({ success: true });
  }

  // If Resend/email service configured, send email here.
  // For now, return OTP in response (demo mode only).
  const hasEmailService = !!process.env.RESEND_API_KEY;

  if (hasEmailService) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Bigpool <noreply@bigpool.in>",
        to: normalizedEmail,
        subject: "Reset your Bigpool password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#0d9488">Reset Your Password</h2>
            <p>Use the OTP below to reset your Bigpool account password. It expires in 15 minutes.</p>
            <div style="background:#f0fdfa;border:2px solid #0d9488;border-radius:8px;padding:20px;text-align:center;margin:24px 0">
              <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0f172a">${otp}</span>
            </div>
            <p style="color:#64748b;font-size:12px">If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
    } catch {
      // Email failed — fall through to demo mode
    }
  }

  return Response.json({
    success: true,
    // Only expose OTP in demo mode (no email service)
    ...(hasEmailService ? {} : { demoOtp: otp }),
  });
}
