import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { findUser } from "@/lib/server-store";

// Demo accounts — used only when Supabase is not configured
const DEMO_ACCOUNTS = [
  { id: "c1", name: "John Doe",        email: "customer@demo.com", password: "demo123", role: "customer" as const },
  { id: "v1", name: "TechWorld Store", email: "vendor@demo.com",   password: "demo123", role: "seller"   as const },
  { id: "a1", name: "Super Admin",     email: "admin@demo.com",    password: "demo123", role: "admin"    as const },
];

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ── Admin credentials from env vars (always checked first, regardless of Supabase) ──
  const adminEmail    = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName     = process.env.ADMIN_NAME ?? "Super Admin";

  if (adminEmail && adminPassword && normalizedEmail === adminEmail && password === adminPassword) {
    return Response.json({
      user: {
        id: "admin-1",
        name: adminName,
        email: adminEmail,
        role: "admin",
        createdAt: "2024-01-01",
        avatar: undefined,
        phone: undefined,
        address: undefined,
      },
    });
  }

  const db = getDb();

  if (!db) {
    // Check real registered users first
    const serverUser = findUser(normalizedEmail);
    if (serverUser && serverUser.password === password) {
      const { password: _, ...safe } = serverUser;
      return Response.json({
        user: { ...safe, avatar: undefined, address: undefined },
      });
    }
    // Fallback: check demo accounts
    const demo = DEMO_ACCOUNTS.find(
      (a) => a.email === normalizedEmail && a.password === password
    );
    if (!demo) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const { password: _, ...user } = demo;
    return Response.json({
      user: { ...user, createdAt: "2024-01-01", avatar: undefined, phone: undefined, address: undefined },
    });
  }

  // Use Supabase Auth
  const { createClient } = await import("@supabase/supabase-js");
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  if (authError || !authData.user) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // Fetch full profile from users table
  const { data: profile } = await db
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (!profile) {
    return Response.json({ error: "User profile not found." }, { status: 404 });
  }

  return Response.json({
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar,
      phone: profile.phone,
      address: profile.address,
      createdAt: profile.created_at,
    },
  });
}
