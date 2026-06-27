import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { findUser } from "@/lib/server-store";

// In-memory fallback when Supabase is not configured
export const otpStore = new Map<string, { otp: string; expiresAt: number }>();

async function sendOtpEmail(name: string, email: string, otp: string) {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Bigpool <noreply@bigpool.in>",
      to: email,
      subject: "Your Bigpool password reset code",
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Reset your password</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center">
            <img src="https://bigpool.in/icon-192.png" alt="Bigpool" width="56" height="56" style="border-radius:12px;display:block;margin:0 auto 12px"/>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">Bigpool</h1>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">India's Favourite Marketplace</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px">
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700">Reset Your Password</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6">
              Hi ${name},<br/>Use the OTP below — it expires in <strong>15 minutes</strong>.
            </p>
            <div style="background:#f0fdfa;border:2px solid #0d9488;border-radius:12px;padding:28px 20px;text-align:center;margin:0 0 28px">
              <p style="margin:0 0 8px;color:#0f766e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Your One-Time Password</p>
              <span style="font-size:44px;font-weight:800;letter-spacing:10px;color:#0f172a">${otp}</span>
              <p style="margin:10px 0 0;color:#64748b;font-size:12px">Valid for 15 minutes only</p>
            </div>
            <div style="text-align:center;margin-bottom:28px">
              <a href="https://bigpool.in/customer/reset-password?email=${encodeURIComponent(email)}"
                 style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600">
                Reset Password →
              </a>
            </div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px"/>
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
              If you didn't request this, ignore this email. Never share this OTP with anyone.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#94a3b8;font-size:12px">© 2024 Bigpool · India's Favourite Marketplace</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return Response.json({ error: "Email required." }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;

  const db = getDb();

  if (db) {
    // Upsert OTP into Supabase
    await db.from("otp_store").upsert({ email: normalizedEmail, otp, expires_at: expiresAt });

    // Look up user name for the email
    const { data: userRow } = await db.from("users").select("name").eq("email", normalizedEmail).single();
    const name = userRow?.name ?? "there";
    const hasEmail = await sendOtpEmail(name, normalizedEmail, otp);
    return Response.json({ success: true, ...(hasEmail ? {} : { demoOtp: otp }) });
  }

  // In-memory fallback
  otpStore.set(normalizedEmail, { otp, expiresAt });
  const user = findUser(normalizedEmail);
  if (!user) return Response.json({ success: true });

  const hasEmail = await sendOtpEmail(user.name, normalizedEmail, otp);
  return Response.json({ success: true, ...(hasEmail ? {} : { demoOtp: otp }) });
}
