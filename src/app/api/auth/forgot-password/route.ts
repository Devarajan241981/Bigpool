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
        subject: "Your Bigpool password reset code",
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Reset your password</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center">
            <img src="https://bigpool.in/icon-192.png" alt="Bigpool" width="56" height="56" style="border-radius:12px;display:block;margin:0 auto 12px"/>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px">Bigpool</h1>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">India's Favourite Marketplace</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px">
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700">Reset Your Password</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6">
              Hi ${user?.name ?? "there"},<br/>
              We received a request to reset the password for your Bigpool account. Use the OTP below — it expires in <strong>15 minutes</strong>.
            </p>

            <!-- OTP Box -->
            <div style="background:#f0fdfa;border:2px solid #0d9488;border-radius:12px;padding:28px 20px;text-align:center;margin:0 0 28px">
              <p style="margin:0 0 8px;color:#0f766e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Your One-Time Password</p>
              <span style="font-size:44px;font-weight:800;letter-spacing:10px;color:#0f172a;font-variant-numeric:tabular-nums">${otp}</span>
              <p style="margin:10px 0 0;color:#64748b;font-size:12px">Valid for 15 minutes only</p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:28px">
              <a href="https://bigpool.in/customer/reset-password?email=${encodeURIComponent(normalizedEmail)}"
                 style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600">
                Reset Password →
              </a>
            </div>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px"/>
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.<br/><br/>
              For security, never share this OTP with anyone. Bigpool will never ask for your OTP.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#94a3b8;font-size:12px">© 2024 Bigpool · India's Favourite Marketplace</p>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:11px">
              <a href="https://bigpool.in" style="color:#0d9488;text-decoration:none">bigpool.in</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
