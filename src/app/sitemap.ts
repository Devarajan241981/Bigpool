import { MetadataRoute } from "next";
import { getDb } from "@/lib/supabase";
import { products as mockProducts } from "@/lib/mock-data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bigpool.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, priority: 1.0, changeFrequency: "daily", lastModified: now },
    { url: `${BASE}/customer/products`, priority: 0.9, changeFrequency: "hourly", lastModified: now },
    { url: `${BASE}/customer/login`, priority: 0.5, changeFrequency: "monthly", lastModified: now },
    { url: `${BASE}/customer/signup`, priority: 0.5, changeFrequency: "monthly", lastModified: now },
    { url: `${BASE}/vendor/application/signup`, priority: 0.7, changeFrequency: "monthly", lastModified: now },
    { url: `${BASE}/vendor/login`, priority: 0.4, changeFrequency: "monthly", lastModified: now },
    { url: `${BASE}/help`, priority: 0.6, changeFrequency: "monthly", lastModified: now },
    { url: `${BASE}/terms`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
  ];

  try {
    const db = getDb();
    const rows = db
      ? (await db.from("products").select("id, created_at, images").eq("status", "active").limit(5000)).data ?? []
      : mockProducts.map((p) => ({ id: p.id, created_at: p.createdAt, images: p.images }));

    const productPages: MetadataRoute.Sitemap = rows.map((p) => ({
      url: `${BASE}/customer/products/${p.id}`,
      lastModified: new Date(p.created_at ?? now),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: Array.isArray(p.images) && p.images[0] ? [p.images[0]] : undefined,
    }));

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
