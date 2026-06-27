import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { serverUsers, findUser } from "@/lib/server-store";

export async function POST(request: NextRequest) {
  const { name, email, phone, password } = await request.json();
  if (!name || !email || !password) {
    return Response.json({ error: "Name, email and password are required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = getDb();

  if (!db) {
    if (findUser(normalizedEmail)) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    const user = {
      id: `u_${Date.now()}`,
      name,
      email: normalizedEmail,
      password,
      phone: phone ?? "",
      role: "customer" as const,
      createdAt: new Date().toISOString(),
    };
    serverUsers.push(user);
    const { password: _, ...safe } = user;
    return Response.json({ user: safe }, { status: 201 });
  }

  // Supabase path
  const { createClient } = await import("@supabase/supabase-js");
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await authClient.auth.signUp({ email: normalizedEmail, password });
  if (error) return Response.json({ error: error.message }, { status: 400 });

  const db2 = getDb();
  await db2!.from("users").insert({ id: data.user!.id, name, email: normalizedEmail, phone, role: "customer" });

  return Response.json({
    user: { id: data.user!.id, name, email: normalizedEmail, phone, role: "customer", createdAt: new Date().toISOString() },
  }, { status: 201 });
}
