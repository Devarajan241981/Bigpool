import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password, role = "customer" } = body;

  if (!name || !email || !password) {
    return Response.json({ error: "Name, email, and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const db = getDb();

  if (!db) {
    // In demo mode, return a mock user
    const user = {
      id: `u_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role,
      createdAt: new Date().toISOString(),
    };
    return Response.json({ user }, { status: 201 });
  }

  // Create Supabase Auth user
  const { createClient } = await import("@supabase/supabase-js");
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: authData, error: authError } = await authClient.auth.signUp({
    email: email.toLowerCase(),
    password,
  });

  if (authError) {
    return Response.json({ error: authError.message }, { status: 400 });
  }

  // Insert profile into users table
  const { data: profile, error: profileError } = await db
    .from("users")
    .insert({
      id: authData.user?.id ?? `u_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role,
    })
    .select()
    .single();

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  return Response.json(
    {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        createdAt: profile.created_at,
      },
    },
    { status: 201 }
  );
}
