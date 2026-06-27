import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bigpool.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    { url: "/", priority: 1.0, changeFrequency: "daily" as const },
    { url: "/customer/products", priority: 0.9, changeFrequency: "hourly" as const },
    { url: "/customer/login", priority: 0.5, changeFrequency: "monthly" as const },
    { url: "/customer/signup", priority: 0.5, changeFrequency: "monthly" as const },
    { url: "/customer/cart", priority: 0.4, changeFrequency: "weekly" as const },
    { url: "/vendor/application/signup", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/vendor/login", priority: 0.4, changeFrequency: "monthly" as const },
    { url: "/help", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return staticPages.map(({ url, priority, changeFrequency }) => ({
    url: `${BASE}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
