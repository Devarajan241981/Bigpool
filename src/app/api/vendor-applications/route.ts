import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { upgradeToSeller } from "@/lib/server-store";
import { requireAdmin, requireAuth } from "@/lib/api-auth";

const inMemoryApps: Record<string, unknown>[] = [];

function normalizeApp(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    businessName: r.business_name,
    category: r.category,
    description: r.description,
    status: r.status,
    submittedAt: r.created_at,
    fromCustomer: r.from_customer ?? false,
  };
}

export async function GET(req: NextRequest) {
  const db = getDb();

  // Admin → return all applications
  const adminAuth = requireAdmin(req);
  if (!(adminAuth instanceof Response)) {
    if (!db) return Response.json(inMemoryApps);
    const { data, error } = await db
      .from("vendor_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json((data ?? []).map(normalizeApp));
  }

  // Regular authenticated user → return only their own applications
  const userAuth = requireAuth(req);
  if (userAuth instanceof Response) return userAuth;
  const email = userAuth.email;
  if (!db) return Response.json(inMemoryApps.filter((a) => a.email === email));
  const { data, error } = await db
    .from("vendor_applications")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json((data ?? []).map(normalizeApp));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  const app = {
    id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: body.name,
    email: body.email,
    phone: body.phone,
    businessName: body.businessName,
    category: body.category,
    description: body.description,
    status: "pending",
    submittedAt: new Date().toISOString(),
    fromCustomer: body.fromCustomer ?? false,
  };

  if (!db) {
    const exists = inMemoryApps.find(
      (a) => a.email === app.email && a.businessName === app.businessName
    );
    if (!exists) inMemoryApps.push(app);
    return Response.json(app, { status: 201 });
  }

  const { data, error } = await db
    .from("vendor_applications")
    .insert({
      id: app.id,
      name: app.name,
      email: app.email,
      phone: app.phone,
      business_name: app.businessName,
      category: app.category,
      description: app.description,
      status: "pending",
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ...app, ...data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id } = await request.json();
  const db = getDb();

  if (!db) {
    const idx = inMemoryApps.findIndex((a) => a.id === id);
    if (idx !== -1) inMemoryApps.splice(idx, 1);
    return Response.json({ success: true });
  }

  const { error } = await db.from("vendor_applications").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id, status } = await request.json();
  const db = getDb();

  if (!db) {
    const app = inMemoryApps.find((a) => a.id === id);
    if (app) {
      (app as Record<string, unknown>).status = status;
      if (status === "approved") {
        upgradeToSeller(app.email as string, app.businessName as string);
      }
    }
    return Response.json({ id, status });
  }

  const { error } = await db
    .from("vendor_applications")
    .update({ status })
    .eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // If approved, upgrade the user — create account if they don't have one yet
  if (status === "approved") {
    const { data: appData } = await db
      .from("vendor_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (appData) {
      // Check if a user with this email already exists
      const { data: existingUser } = await db
        .from("users")
        .select("id")
        .eq("email", appData.email)
        .single();

      if (existingUser) {
        // Existing user → just upgrade role
        await db
          .from("users")
          .update({ role: "seller", business_name: appData.business_name })
          .eq("email", appData.email);
      } else {
        // No user account yet → create one so they can log in
        await db.from("users").insert({
          id: `seller_${Date.now()}`,
          name: appData.name,
          email: appData.email,
          phone: appData.phone ?? "",
          password: "", // No password yet — they must use "Forgot Password" to set one
          role: "seller",
          business_name: appData.business_name,
        });
      }
    }
  }

  return Response.json({ id, status });
}
