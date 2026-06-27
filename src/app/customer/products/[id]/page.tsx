import type { Metadata } from "next";
import { getDb } from "@/lib/supabase";
import { products as mockProducts } from "@/lib/mock-data";
import type { Product } from "@/lib/types";
import ProductDetailClient from "./ProductDetailClient";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bigpool.in";

type Props = { params: Promise<{ id: string }> };

async function getProduct(id: string): Promise<Product | null> {
  const db = getDb();
  if (!db) return mockProducts.find((p) => p.id === id) ?? null;
  const { data } = await db.from("products").select("*").eq("id", id).single();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    price: data.price,
    originalPrice: data.original_price,
    images: data.images ?? [],
    category: data.category,
    categoryId: data.category_id,
    sellerId: data.seller_id,
    sellerName: data.seller_name,
    rating: data.rating ?? 0,
    reviewCount: data.review_count ?? 0,
    stock: data.stock,
    tags: data.tags ?? [],
    specifications: data.specifications ?? {},
    discount: data.discount ?? 0,
    featured: data.featured ?? false,
    promoted: data.promoted ?? false,
    isDemo: data.is_demo ?? false,
    createdAt: data.created_at,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Product Not Found" };

  const desc = product.description.slice(0, 155) + (product.description.length > 155 ? "…" : "");
  const image = product.images[0];

  return {
    title: `${product.name} — Buy Online at Bigpool`,
    description: `Buy ${product.name} at ₹${product.price.toLocaleString()}. ${desc}`,
    openGraph: {
      title: `${product.name} | Bigpool`,
      description: `Buy ${product.name} at ₹${product.price.toLocaleString()} on Bigpool. Free delivery above ₹499, 30-day returns.`,
      images: image ? [{ url: image, width: 800, height: 800, alt: product.name }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Bigpool`,
      description: `₹${product.price.toLocaleString()} — ${product.category}`,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images,
        sku: product.id,
        brand: { "@type": "Brand", name: product.sellerName },
        offers: {
          "@type": "Offer",
          url: `${BASE}/customer/products/${product.id}`,
          priceCurrency: "INR",
          price: product.price,
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: product.sellerName },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: product.price >= 499 ? "0" : "49",
              currency: "INR",
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
              transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 5, unitCode: "DAY" },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "IN",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 30,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/FreeReturn",
          },
        },
        ...(product.reviewCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.rating,
                reviewCount: product.reviewCount,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <ProductDetailClient id={id} serverProduct={product} />
    </>
  );
}
