import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  if (!db) return Response.json({ id, ...body });

  const row: Record<string, unknown> = {};
  if (body.status !== undefined) {
    row.seller_status = body.status;
    row.verified = body.status === "approved";
  }
  if (body.verified !== undefined) row.verified = body.verified;
  if (body.name !== undefined) row.name = body.name;
  if (body.businessName !== undefined) row.business_name = body.businessName;

  const { data, error } = await db.from("users").update(row).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    id: data.id, name: data.name, email: data.email, role: data.role,
    businessName: data.business_name, verified: data.verified,
    status: data.seller_status, createdAt: data.created_at,
  });
}
