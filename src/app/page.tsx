"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Laptop,
  Shirt,
  Home,
  BookOpen,
  Dumbbell,
  Sparkles,
  Gamepad2,
  ShoppingBasket,
  Zap,
  Shield,
  Truck,
  RotateCcw,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/product-card";
import { banners } from "@/lib/mock-data";
import { useProductStore, useRecentlyViewedStore } from "@/lib/store";
import type { Category } from "@/lib/types";

const categoryIcons: Record<string, React.ReactNode> = {
  Laptop: <Laptop className="w-6 h-6" />,
  Shirt: <Shirt className="w-6 h-6" />,
  Home: <Home className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
  Dumbbell: <Dumbbell className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  Gamepad2: <Gamepad2 className="w-6 h-6" />,
  ShoppingBasket: <ShoppingBasket className="w-6 h-6" />,
};

function useCountdown(targetHour = 20) {
  const getSecondsLeft = useCallback(() => {
    const now = new Date();
    const end = new Date();
    end.setHours(targetHour, 0, 0, 0);
    if (end <= now) end.setDate(end.getDate() + 1);
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  }, [targetHour]);
  const [secs, setSecs] = useState(getSecondsLeft);
  useEffect(() => {
    const t = setInterval(() => setSecs(getSecondsLeft()), 1000);
    return () => clearInterval(t);
  }, [getSecondsLeft]);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return { h, m, s };
}

export default function HomePage() {
  const [bannerIdx, setBannerIdx] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const { products, fetchProducts } = useProductStore();
  const { items: recentlyViewed } = useRecentlyViewedStore();
  const countdown = useCountdown(20);

  useEffect(() => {
    fetchProducts();
    fetch("/api/categories").then((r) => r.ok ? r.json() : []).then(setCategories).catch(() => {});
    const t = setInterval(() => {
      setBannerIdx((i) => (i + 1) % banners.length);
    }, 4000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const featuredProducts = products.filter((p) => p.featured);
  const promotedProducts = products.filter((p) => p.promoted);
  const dealsProducts = products.filter((p) => p.discount >= 20);

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gray-800 h-[220px] sm:h-[300px] md:h-[420px]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === bannerIdx ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
              <div className="max-w-7xl mx-auto px-6 text-white">
                <Badge className="mb-3 bg-[#0d9488] text-white font-bold">SALE</Badge>
                <h1 className="text-xl sm:text-3xl md:text-5xl font-bold mb-2 md:mb-3 max-w-lg">{banner.title}</h1>
                <p className="text-sm sm:text-lg text-gray-200 mb-4 md:mb-6 hidden sm:block">{banner.subtitle}</p>
                <Link href={banner.link}>
                  <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold px-8 py-3 text-base">
                    Shop Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => setBannerIdx((i) => (i - 1 + banners.length) % banners.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setBannerIdx((i) => (i + 1) % banners.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIdx(i)}
              className={`h-2 rounded-full transition-all ${
                i === bannerIdx ? "bg-[#0d9488] w-5" : "bg-white/60 w-2"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-4 overflow-x-auto md:grid md:grid-cols-4 scrollbar-hide">
          {[
            { icon: <Truck className="w-5 h-5 text-[#0d9488]" />, title: "Free Delivery", sub: "On orders above ₹499" },
            { icon: <Shield className="w-5 h-5 text-[#0d9488]" />, title: "Secure Payment", sub: "100% safe transactions" },
            { icon: <RotateCcw className="w-5 h-5 text-[#0d9488]" />, title: "Easy Returns", sub: "30-day return policy" },
            { icon: <Zap className="w-5 h-5 text-[#0d9488]" />, title: "24/7 Support", sub: "Dedicated customer care" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 flex-shrink-0 md:flex-shrink">
              <div className="flex-shrink-0 bg-teal-50 p-2 rounded-lg">{t.icon}</div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                <p className="text-xs text-gray-500">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Shop by Category</h2>
            <Link href="/customer/products" className="text-sm text-[#0d9488] hover:text-[#0f766e]">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 md:gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/customer/products?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:border-[#0d9488] hover:shadow-md transition-all group"
              >
                <div className="text-gray-600 group-hover:text-[#0d9488] transition-colors">
                  {categoryIcons[cat.icon]}
                </div>
                <span className="text-xs text-center text-gray-600 font-medium leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Deals of the day with countdown */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Zap className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-gray-800">Deals of the Day</h2>
              <Badge className="bg-red-500 text-white text-xs">Up to 71% OFF</Badge>
              {/* Countdown timer */}
              <div className="flex items-center gap-1 ml-2">
                <span className="text-xs text-gray-500 font-medium">Ends in</span>
                {[countdown.h, countdown.m, countdown.s].map((unit, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    <span className="bg-gray-900 text-white text-xs font-bold px-1.5 py-0.5 rounded min-w-[26px] text-center tabular-nums">{unit}</span>
                    {i < 2 && <span className="text-gray-600 font-bold text-xs">:</span>}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/customer/products?sort=discount" className="text-sm text-[#0d9488] hover:text-[#0f766e]">
              See all deals
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {dealsProducts.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Featured products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-gray-800">Featured Products</h2>
            </div>
            <Link href="/customer/products?sort=featured" className="text-sm text-[#0d9488] hover:text-[#0f766e]">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featuredProducts.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Sponsored banner */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-gradient-to-r from-[#1e293b] to-[#334155] rounded-xl p-6 text-white flex items-center gap-4">
            <div className="flex-1">
              <Badge className="bg-[#0d9488] text-white text-xs mb-2">SPONSORED</Badge>
              <h3 className="text-xl font-bold mb-1">Apple iPhone 15 Pro Max</h3>
              <p className="text-gray-300 text-sm mb-3">Experience the future with A17 Pro chip and titanium design</p>
              <Link href="/customer/products/p1">
                <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold text-sm">
                  Shop Now – ₹1,34,900
                </Button>
              </Link>
            </div>
            <img
              src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200&auto=format"
              alt="iPhone"
              className="w-28 h-28 object-cover rounded-lg flex-shrink-0"
            />
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white flex flex-col justify-between">
            <div>
              <Badge className="bg-white text-purple-600 text-xs mb-2">FOR SELLERS</Badge>
              <h3 className="text-lg font-bold mb-1">Sell on Bigpool</h3>
              <p className="text-sm text-purple-100">Reach crores of customers. Start your business journey today.</p>
            </div>
            <Link href="/vendor/application/signup">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600 mt-3 w-full">
                Start Selling
              </Button>
            </Link>
          </div>
        </section>

        {/* Trending */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0d9488]" />
              <h2 className="text-xl font-bold text-gray-800">Trending Now</h2>
              <Badge className="bg-teal-100 text-teal-700 text-xs">Sponsored</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {promotedProducts.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* Download App banner */}
        <section className="bg-gradient-to-r from-[#1e293b] to-[#0d9488] rounded-xl p-5 text-white flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold text-teal-300 uppercase tracking-wide mb-1">Now Available</p>
            <h3 className="text-xl font-bold mb-1">Get the Bigpool App</h3>
            <p className="text-sm text-gray-300 mb-3">Install on your phone for faster access, exclusive app-only deals & offline browsing.</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <a
                href="#install"
                onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event("triggerInstallPrompt")); }}
                className="bg-white text-[#1e293b] font-bold text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                📱 Install App
              </a>
              <span className="text-xs text-gray-400 self-center">• Works on Android & iPhone</span>
            </div>
          </div>
          <div className="text-6xl">🛍️</div>
        </section>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[#0d9488]" />
                <h2 className="text-xl font-bold text-gray-800">Recently Viewed</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {recentlyViewed.slice(0, 6).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
