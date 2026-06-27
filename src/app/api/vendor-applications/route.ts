import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { upgradeToSeller } from "@/lib/server-store";
import { requireAdmin } from "@/lib/api-auth";

const inMemoryApps: Record<string, unknown>[] = [];

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof Response) return auth;
  const db = getDb();
  if (!db) return Response.json(inMemoryApps);

  const { data, error } = await db
    .from("vendor_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Normalize snake_case → camelCase for the frontend
  const normalized = (data ?? []).map((r: Record<string, unknown>) => ({
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
  }));
  return Response.json(normalized);
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

  // If approved, upgrade the user's role in the users table
  if (status === "approved") {
    const { data: appData } = await db
      .from("vendor_applications")
      .select("email, business_name")
      .eq("id", id)
      .single();

    if (appData) {
      await db
        .from("users")
        .update({ role: "seller", business_name: appData.business_name })
        .eq("email", appData.email);
    }
  }

  return Response.json({ id, status });
}
