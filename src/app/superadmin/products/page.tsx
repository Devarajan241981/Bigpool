"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Search, Eye, Trash2, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useHasHydrated, useProductStore } from "@/lib/store";
import { toast } from "sonner";

export default function SuperAdminProductsPage() {
  const { user, isAuthenticated, accessToken, sessionReady } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const { products, fetchProducts } = useProductStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "admin")) router.push("/superadmin/login");
    if (hasHydrated && sessionReady && !accessToken && isAuthenticated && user?.role === "admin") router.push("/superadmin/login");
  }, [hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.role === "admin") fetchProducts();
  }, [hasHydrated, isAuthenticated, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasHydrated || !isAuthenticated || user?.role !== "admin") return null;

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ||
      (filter === "featured" && p.featured) ||
      (filter === "promoted" && p.promoted);
    return matchSearch && matchFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="w-5 h-5 text-[#0d9488]" />
        <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
        <Badge className="bg-gray-100 text-gray-700">{filtered.length}</Badge>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "featured", "promoted"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? "bg-[#1e293b] text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search products or sellers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Seller</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Rating</th>
                <th className="text-left px-4 py-3">Flags</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-800 line-clamp-1 max-w-40">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.sellerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.category}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">₹{p.price.toLocaleString()}</p>
                    {p.discount > 0 && <p className="text-xs text-green-600">-{p.discount}%</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                      <span className="text-sm">{p.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {p.featured && <Badge className="bg-blue-100 text-blue-700 text-xs w-fit">Featured</Badge>}
                      {p.promoted && <Badge className="bg-orange-100 text-orange-700 text-xs w-fit">Promoted</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link href={`/products/${p.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => toast.error("Remove requires confirmation")}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
