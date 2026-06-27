import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/supabase";
import { serverUsers, findUser } from "@/lib/server-store";

async function sendWelcomeEmail(name: string, email: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Bigpool <noreply@bigpool.in>",
      to: email,
      subject: `Welcome to Bigpool, ${name.split(" ")[0]}! 🎉`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome to Bigpool</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:36px 40px;text-align:center">
            <img src="https://bigpool.in/icon-192.png" alt="Bigpool" width="64" height="64" style="border-radius:14px;display:block;margin:0 auto 14px"/>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px">Welcome to Bigpool!</h1>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px">India's Favourite Marketplace</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px">
            <h2 style="margin:0 0 10px;color:#0f172a;font-size:20px;font-weight:700">Hi ${name.split(" ")[0]}, you're in! 🙌</h2>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7">
              Your Bigpool account is ready. Shop from millions of products across Electronics, Fashion, Home, Books, and more — all in one place.
            </p>
            <div style="text-align:center;margin-bottom:28px">
              <a href="https://bigpool.in"
                 style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700">
                Start Shopping →
              </a>
            </div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px"/>
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
              Want to sell your products? <a href="https://bigpool.in/vendor/application/signup" style="color:#0d9488;text-decoration:none;font-weight:600">Apply as a vendor →</a>
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
  } catch {
    // Email failure is non-blocking
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { name, email, phone, password } = body;

  if (!name || !email || !password) {
    return Response.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (typeof name !== "string" || name.trim().length < 2 || name.length > 80) {
    return Response.json({ error: "Name must be 2–80 characters." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return Response.json({ error: "Password must be 8–128 characters." }, { status: 400 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Response.json({ error: "Invalid email address." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = getDb();

  if (db) {
    // Check for existing user
    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existing) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const newUser = {
      id: `u_${Date.now()}`,
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      phone: phone ?? "",
      role: "customer",
    };

    const { error } = await db.from("users").insert(newUser);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    sendWelcomeEmail(name, normalizedEmail);
    return Response.json({
      user: { id: newUser.id, name, email: normalizedEmail, phone: phone ?? "", role: "customer", createdAt: new Date().toISOString() },
    }, { status: 201 });
  }

  // In-memory fallback
  if (findUser(normalizedEmail)) {
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }
  const user = {
    id: `u_${Date.now()}`,
    name,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    phone: phone ?? "",
    role: "customer" as const,
    createdAt: new Date().toISOString(),
  };
  serverUsers.push(user);
  sendWelcomeEmail(name, normalizedEmail);
  const { password: _, ...safe } = user;
  return Response.json({ user: safe }, { status: 201 });
}
