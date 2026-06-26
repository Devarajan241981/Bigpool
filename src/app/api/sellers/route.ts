import { getDb } from "@/lib/supabase";
import { sellers as mockSellers } from "@/lib/mock-data";

export async function GET() {
  const db = getDb();
  if (!db) return Response.json(mockSellers);

  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("role", "seller")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(
    data.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      avatar: r.avatar,
      phone: r.phone,
      businessName: r.business_name,
      gstin: r.gstin,
      verified: r.verified,
      status: r.seller_status,
      products: r.products ?? [],
      rating: r.rating ?? 0,
      totalSales: r.total_sales ?? 0,
      createdAt: r.created_at,
    }))
  );
}
