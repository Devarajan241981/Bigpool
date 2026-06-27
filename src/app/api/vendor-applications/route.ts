import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { upgradeToSeller } from "@/lib/server-store";

// In-memory fallback when Supabase is not configured.
// Data persists as long as the server process is alive.
const inMemoryApps: Record<string, unknown>[] = [];

export async function GET() {
  const db = getDb();
  if (!db) return Response.json(inMemoryApps);

  const { data, error } = await db
    .from("seller_applications")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
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
    gstin: body.gstin ?? "",
    category: body.category,
    address: body.address,
    description: body.description,
    bankAccount: body.bankAccount ?? "",
    ifsc: body.ifsc ?? "",
    status: "pending",
    submittedAt: new Date().toISOString(),
    fromCustomer: body.fromCustomer ?? false,
  };

  if (!db) {
    // Avoid duplicate submissions (same email + businessName)
    const exists = inMemoryApps.find(
      (a) => a.email === app.email && a.businessName === app.businessName
    );
    if (!exists) inMemoryApps.push(app);
    return Response.json(app, { status: 201 });
  }

  const { data, error } = await db
    .from("seller_applications")
    .insert({
      name: app.name, email: app.email, phone: app.phone,
      business_name: app.businessName, gstin: app.gstin,
      category: app.category, address: app.address,
      description: app.description, bank_account: app.bankAccount,
      ifsc: app.ifsc, status: "pending", from_customer: app.fromCustomer,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { id, status } = await request.json();
  const db = getDb();

  if (!db) {
    const app = inMemoryApps.find((a) => a.id === id);
    if (app) {
      (app as Record<string, unknown>).status = status;
      // If approved, upgrade the customer's role to seller so they can log in as vendor
      if (status === "approved") {
        upgradeToSeller(app.email as string, app.businessName as string);
      }
    }
    return Response.json({ id, status });
  }

  const { error } = await db
    .from("seller_applications")
    .update({ status })
    .eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id, status });
}
