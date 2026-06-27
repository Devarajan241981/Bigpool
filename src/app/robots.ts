import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bigpool.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/superadmin/",
          "/customer/cart",
          "/customer/checkout",
          "/customer/profile",
          "/vendor/dashboard",
          "/vendor/orders",
          "/vendor/earnings",
          "/vendor/products",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
