import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { findUser } from "@/lib/server-store";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Admin env-var credentials always take priority
  const adminEmail    = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName     = process.env.ADMIN_NAME ?? "Super Admin";

  if (adminEmail && adminPassword && normalizedEmail === adminEmail && password === adminPassword) {
    return Response.json({
      user: { id: "admin-1", name: adminName, email: adminEmail, role: "admin",
              createdAt: "2024-01-01", avatar: undefined, phone: undefined, address: undefined },
    });
  }

  const db = getDb();

  if (db) {
    const { data: profile } = await db
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (!profile || profile.password !== password) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    return Response.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        avatar: profile.avatar ?? undefined,
        phone: profile.phone ?? undefined,
        address: profile.address ?? undefined,
        createdAt: profile.created_at,
      },
    });
  }

  // In-memory fallback (no Supabase configured)
  const serverUser = findUser(normalizedEmail);
  if (serverUser && serverUser.password === password) {
    const { password: _, ...safe } = serverUser;
    return Response.json({ user: { ...safe, avatar: undefined, address: undefined } });
  }

  return Response.json({ error: "Invalid email or password." }, { status: 401 });
}
