"use client";

import { useState, useMemo, useEffect } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product-card";
import { useProductStore } from "@/lib/store";
import type { Category } from "@/lib/types";

function ProductsContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 250000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(categorySlug);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(sort || "relevance");
  const [categories, setCategories] = useState<Category[]>([]);
  const { products } = useProductStore();

  useEffect(() => {
    useProductStore.persist.rehydrate();
    fetch("/api/categories").then((r) => r.ok ? r.json() : []).then(setCategories).catch(() => {});
  }, [])

  // Sync category filter when URL query param changes (e.g. navbar link click)
  useEffect(() => { setSelectedCategory(categorySlug); }, [categorySlug]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (q) {
      const qLower = q.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(qLower) ||
          p.description.toLowerCase().includes(qLower) ||
          p.category.toLowerCase().includes(qLower) ||
          p.tags.some((t) => t.toLowerCase().includes(qLower))
      );
    }

    if (selectedCategory) {
      const cat = categories.find(
        (c) => c.slug === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (cat) {
        result = result.filter((p) =>
          p.categoryId === cat.id ||
          p.categoryId === cat.slug ||
          p.category.toLowerCase() === cat.name.toLowerCase()
        );
      } else {
        // Categories not loaded yet — match directly against slug/name on the product
        const slugLower = selectedCategory.toLowerCase();
        result = result.filter((p) =>
          p.categoryId === selectedCategory ||
          p.category.toLowerCase().replace(/[\s&]+/g, "-") === slugLower ||
          p.category.toLowerCase() === slugLower.replace(/-/g, " ")
        );
      }
    }

    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    if (selectedRating > 0) {
      result = result.filter((p) => p.rating >= selectedRating);
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "discount":
        result.sort((a, b) => b.discount - a.discount);
        break;
      case "featured":
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [q, selectedCategory, priceRange, selectedRating, sortBy, products]);

  const filterContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <button
          onClick={() => {
            setSelectedCategory("");
            setPriceRange([0, 250000]);
            setSelectedRating(0);
          }}
          className="text-xs text-[#0d9488] hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Category */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Category</h4>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              checked={selectedCategory === ""}
              onChange={() => setSelectedCategory("")}
              className="text-[#0d9488]"
            />
            <span className="text-sm text-gray-600">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === cat.slug}
                onChange={() => setSelectedCategory(cat.slug)}
              />
              <span className="text-sm text-gray-600">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Price Range</h4>
        <div className="space-y-2">
          {[
            [0, 500], [500, 2000], [2000, 10000], [10000, 50000], [50000, 250000]
          ].map(([min, max]) => (
            <label key={`${min}-${max}`} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="price"
                checked={priceRange[0] === min && priceRange[1] === max}
                onChange={() => setPriceRange([min, max])}
              />
              <span className="text-sm text-gray-600">
                ₹{min.toLocaleString()} – ₹{max.toLocaleString()}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Min. Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2, 0].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={selectedRating === r}
                onChange={() => setSelectedRating(r)}
              />
              <span className="text-sm text-gray-600">
                {r === 0 ? "All Ratings" : `${r}★ & above`}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">
            {q ? `Results for "${q}"` : selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name || "Products" : "All Products"}
          </h1>
          <p className="text-sm text-gray-500">{filtered.length} products found</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 h-9"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {showFilters && <X className="w-3.5 h-3.5" />}
          </Button>
          <div className="flex items-center gap-1.5 border rounded-md px-2.5 py-1.5 bg-white text-sm">
            <span className="text-gray-500 hidden xs:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="outline-none bg-transparent text-sm cursor-pointer"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Rating</option>
              <option value="discount">Best Discount</option>
              <option value="featured">Featured</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile filter panel — slides in below header */}
      {showFilters && (
        <div className="md:hidden bg-white rounded-xl border border-gray-200 p-4 mb-4">
          {filterContent}
          <Button
            className="w-full mt-4 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold h-11"
            onClick={() => setShowFilters(false)}
          >
            Show {filtered.length} Results
          </Button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Filters — desktop only */}
        <div className="hidden md:block w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
            {filterContent}
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div>
              <div className="text-center py-10 bg-white rounded-xl border border-gray-200 mb-6">
                <p className="text-4xl mb-3">🏪</p>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  {selectedCategory
                    ? `No products in "${categories.find(c => c.slug === selectedCategory)?.name ?? selectedCategory}" right now`
                    : "No products found"}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedCategory
                    ? "Our sellers are restocking soon. Browse other categories below!"
                    : "Try adjusting your search or filters"}
                </p>
                <Button
                  onClick={() => { setSelectedCategory(""); setPriceRange([0, 250000]); setSelectedRating(0); }}
                  className="bg-[#0d9488] hover:bg-[#0f766e] text-white"
                >
                  Browse All Products
                </Button>
              </div>

              {/* Show products from other categories */}
              {products.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">You might also like</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {products.slice(0, 8).map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
