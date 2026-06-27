import { NextRequest } from "next/server";
import { findUser } from "@/lib/server-store";

async function sendPasswordChangedEmail(name: string, email: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const time = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
    await resend.emails.send({
      from: "Bigpool <noreply@bigpool.in>",
      to: email,
      subject: "Your Bigpool password was changed",
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Password Changed</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center">
            <img src="https://bigpool.in/icon-192.png" alt="Bigpool" width="56" height="56" style="border-radius:12px;display:block;margin:0 auto 12px"/>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">Bigpool</h1>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">India's Favourite Marketplace</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px">
            <div style="text-align:center;margin-bottom:24px">
              <div style="display:inline-block;background:#dcfce7;border-radius:50%;padding:16px;margin-bottom:12px">
                <span style="font-size:32px">🔒</span>
              </div>
              <h2 style="margin:0;color:#0f172a;font-size:20px;font-weight:700">Password Successfully Changed</h2>
            </div>

            <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7">
              Hi ${name.split(" ")[0]}, your Bigpool account password was updated on <strong>${time} IST</strong>.
            </p>

            <!-- Info box -->
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;color:#166534;font-size:13px;line-height:1.6">
                ✅ Your account is secure. You can now sign in with your new password.
              </p>
            </div>

            <!-- Warning box -->
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin-bottom:28px">
              <p style="margin:0 0 6px;color:#9a3412;font-size:13px;font-weight:600">⚠️ Didn't make this change?</p>
              <p style="margin:0;color:#9a3412;font-size:13px;line-height:1.6">
                If you didn't change your password, your account may be compromised. Reset it immediately.
              </p>
            </div>

            <div style="text-align:center;margin-bottom:28px">
              <a href="https://bigpool.in/customer/forgot-password"
                 style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600">
                Reset Password Now
              </a>
            </div>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px"/>
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
              This is an automated security notification. Please do not reply to this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#94a3b8;font-size:12px">© 2024 Bigpool · India's Favourite Marketplace</p>
            <p style="margin:6px 0 0">
              <a href="https://bigpool.in" style="color:#0d9488;text-decoration:none;font-size:11px">bigpool.in</a>
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
    // Non-blocking
  }
}

export async function POST(request: NextRequest) {
  const { email, currentPassword, newPassword } = await request.json();
  if (!email || !currentPassword || !newPassword) {
    return Response.json({ error: "All fields are required." }, { status: 400 });
  }

  const user = findUser(email);
  if (!user) return Response.json({ error: "Account not found." }, { status: 404 });
  if (user.password !== currentPassword) {
    return Response.json({ error: "Current password is incorrect." }, { status: 401 });
  }
  if (newPassword.length < 8) {
    return Response.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  user.password = newPassword;
  sendPasswordChangedEmail(user.name, user.email);

  return Response.json({ success: true });
}
