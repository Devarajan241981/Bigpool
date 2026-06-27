"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowLeft, TrendingUp, Clock } from "lucide-react";
import { useProductStore, useRecentlyViewedStore } from "@/lib/store";
import { categories } from "@/lib/mock-data";

const CAT_EMOJI: Record<string, string> = {
  Electronics: "💻", Fashion: "👗", "Home & Kitchen": "🏠",
  Books: "📚", Sports: "🏋️", Beauty: "✨", Toys: "🎮", Grocery: "🛒",
};

const TRENDING = [
  "Wireless earbuds", "Running shoes", "Laptop stand", "Skincare",
  "Protein powder", "Office chair", "Phone case", "Smart watch",
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { products } = useProductStore();
  const { items: recentlyViewed } = useRecentlyViewedStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = query.trim().length >= 1
    ? products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        (p.sellerName ?? "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 30)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/customer/products?q=${encodeURIComponent(query.trim())}`);
  };

  const go = (q: string) => router.push(`/customer/products?q=${encodeURIComponent(q)}`);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Sticky search header ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-3 py-2.5 flex items-center gap-2 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-500 p-1 flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <form onSubmit={handleSubmit} className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands…"
            className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-gray-400 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
        {query && (
          <button onClick={handleSubmit} className="text-[#0d9488] text-sm font-semibold flex-shrink-0 px-1">
            Search
          </button>
        )}
      </div>

      {/* ── Results when typing ── */}
      {query.trim().length >= 1 ? (
        <div className="flex-1">
          {results.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-16">No results for &quot;{query}&quot;</p>
          ) : (
            <div>
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/customer/products/${p.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 bg-white hover:bg-gray-50 active:bg-gray-100 text-left"
                >
                  <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">₹{p.price.toLocaleString()}</p>
                    {p.discount > 0 && <p className="text-[11px] text-green-600">{p.discount}% off</p>}
                  </div>
                </button>
              ))}
              <button
                onClick={() => go(query)}
                className="w-full py-4 text-sm text-[#0d9488] font-semibold text-center bg-white border-t border-gray-100"
              >
                See all results for &quot;{query}&quot; →
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Empty state — recent + trending + categories ── */
        <div className="flex-1 px-4 pt-4 pb-24">

          {/* Recently viewed */}
          {recentlyViewed.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Recently Viewed</h2>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {recentlyViewed.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/customer/products/${p.id}`)}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm active:scale-95 transition-transform"
                  >
                    <img src={p.images[0]} alt={p.name} className="w-full aspect-square object-cover" />
                    <p className="text-[11px] text-gray-700 px-2 py-1.5 truncate font-medium">{p.name}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Trending searches */}
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#0d9488]" />
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Trending</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((term) => (
                <button
                  key={term}
                  onClick={() => go(term)}
                  className="bg-white border border-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded-full hover:border-[#0d9488] hover:text-[#0d9488] transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section>
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Browse Categories</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => router.push(`/customer/products?category=${cat.slug}`)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <span className="text-2xl">{CAT_EMOJI[cat.name] ?? "🛍️"}</span>
                  <span className="text-[11px] text-gray-600 font-medium text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
