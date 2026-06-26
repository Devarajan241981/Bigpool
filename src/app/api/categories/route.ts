import { getDb } from "@/lib/supabase";
import { categories as staticCategories } from "@/lib/mock-data";

export async function GET() {
  const db = getDb();
  if (!db) return Response.json(staticCategories);

  const { data, error } = await db.from("categories").select("*").order("id");
  if (error) return Response.json(staticCategories);
  return Response.json(
    data.map((r: Record<string, unknown>) => ({
      id: r.id, name: r.name, icon: r.icon, slug: r.slug,
    }))
  );
}
