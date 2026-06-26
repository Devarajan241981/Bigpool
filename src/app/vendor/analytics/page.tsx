"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, DollarSign, ShoppingCart, Package, Star } from "lucide-react";
import { useAuthStore, useHasHydrated, useProductStore, useOrderStore } from "@/lib/store";

const monthlyData = [
  { month: "Oct", revenue: 45000, orders: 12 },
  { month: "Nov", revenue: 62000, orders: 18 },
  { month: "Dec", revenue: 89000, orders: 25 },
  { month: "Jan", revenue: 71000, orders: 19 },
  { month: "Feb", revenue: 95000, orders: 28 },
  { month: "Mar", revenue: 112000, orders: 32 },
];

const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue));

export default function VendorAnalyticsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const { products, fetchProducts } = useProductStore();
  const { orders, fetchOrders } = useOrderStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "seller")) router.push("/vendor/login");
  }, [hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.id) {
      fetchProducts({ sellerId: user.id });
      fetchOrders({ sellerId: user.id });
    }
  }, [hasHydrated, isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasHydrated || !isAuthenticated || user?.role !== "seller") return null;

  const sellerProducts = products.filter((p) => p.sellerId === user.id);
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = orders.length ? Math.round(totalRevenue / orders.length) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50", change: "+12%" },
          { label: "Total Orders", value: orders.length, icon: ShoppingCart, color: "text-blue-600 bg-blue-50", change: "+8%" },
          { label: "Avg Order Value", value: `₹${avgOrderValue.toLocaleString()}`, icon: TrendingUp, color: "text-purple-600 bg-purple-50", change: "+3%" },
          { label: "Products Listed", value: sellerProducts.length, icon: Package, color: "text-teal-600 bg-teal-50", change: "0%" },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${item.color}`}><item.icon className="w-4 h-4" /></div>
            <p className="text-xl font-bold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            <p className="text-xs text-green-600 mt-1">↑ {item.change} vs last month</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Monthly Revenue (₹)</h2>
        <div className="flex items-end gap-3 h-40">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">₹{(d.revenue / 1000).toFixed(0)}k</span>
              <div
                className="w-full bg-[#0d9488] rounded-t-md transition-all hover:bg-[#0f766e]"
                style={{ height: `${(d.revenue / maxRevenue) * 120}px` }}
                title={`₹${d.revenue.toLocaleString()}`}
              />
              <span className="text-xs font-medium text-gray-600">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Top Products by Sales</h2>
        <div className="space-y-3">
          {sellerProducts
            .sort((a, b) => b.reviewCount - a.reviewCount)
            .map((p, i) => (
              <div key={p.id} className="flex items-center gap-4">
                <span className={`w-6 text-sm font-bold ${i === 0 ? "text-[#0d9488]" : "text-gray-400"}`}>#{i + 1}</span>
                <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                    <span className="text-xs text-gray-500">{p.rating} ({p.reviewCount} reviews)</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₹{p.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{p.stock} in stock</p>
                </div>
                <div className="w-24 bg-gray-100 rounded-full h-2">
                  <div className="bg-[#0d9488] h-2 rounded-full" style={{ width: `${(p.reviewCount / sellerProducts[0].reviewCount) * 100}%` }} />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
