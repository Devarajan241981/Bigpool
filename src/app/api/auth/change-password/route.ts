import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { findUser, serverUsers } from "@/lib/server-store";

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
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center">
            <img src="https://bigpool.in/icon-192.png" alt="Bigpool" width="56" height="56" style="border-radius:12px;display:block;margin:0 auto 12px"/>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">Bigpool</h1>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">India's Favourite Marketplace</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px">
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:700">Password Successfully Changed</h2>
            <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7">
              Hi ${name.split(" ")[0]}, your Bigpool account password was updated on <strong>${time} IST</strong>.
            </p>
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;color:#166534;font-size:13px">✅ Your account is secure. Sign in with your new password.</p>
            </div>
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin-bottom:28px">
              <p style="margin:0 0 6px;color:#9a3412;font-size:13px;font-weight:600">⚠️ Didn't make this change?</p>
              <p style="margin:0;color:#9a3412;font-size:13px">If you didn't change your password, reset it immediately.</p>
            </div>
            <div style="text-align:center">
              <a href="https://bigpool.in/customer/forgot-password"
                 style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600">
                Reset Password Now
              </a>
            </div>
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
  } catch {
    // Non-blocking
  }
}

export async function POST(request: NextRequest) {
  const { email, name: clientName, currentPassword, newPassword } = await request.json();
  if (!email || !currentPassword || !newPassword) {
    return Response.json({ error: "All fields are required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return Response.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = getDb();

  if (db) {
    const { data: profile } = await db
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (!profile) {
      return Response.json({ error: "Account not found." }, { status: 404 });
    }
    if (profile.password !== currentPassword) {
      return Response.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    await db.from("users").update({ password: newPassword }).eq("email", normalizedEmail);
    // Revoke all refresh tokens for this user → force logout on all devices
    await db.from("refresh_tokens").delete().eq("email", normalizedEmail);

    sendPasswordChangedEmail(profile.name, normalizedEmail);
    return Response.json({ success: true });
  }

  // In-memory fallback
  let userName = clientName ?? email;
  const user = findUser(normalizedEmail);

  if (user) {
    if (user.password !== currentPassword) {
      return Response.json({ error: "Current password is incorrect." }, { status: 401 });
    }
    user.password = newPassword;
    userName = user.name;
  } else {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const isAdmin = adminEmail === normalizedEmail && adminPassword === currentPassword;

    if (isAdmin) userName = process.env.ADMIN_NAME ?? "Super Admin";

    serverUsers.push({
      id: `u_${Date.now()}`,
      name: userName,
      email: normalizedEmail,
      password: newPassword,
      role: "customer" as const,
      createdAt: new Date().toISOString(),
    });
  }

  sendPasswordChangedEmail(userName, normalizedEmail);
  return Response.json({ success: true });
}
