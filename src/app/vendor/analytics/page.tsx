"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, DollarSign, ShoppingCart, Package, ArrowUpRight, ArrowDownRight, Minus, RefreshCw } from "lucide-react";
import { useAuthStore, useHasHydrated, useProductStore } from "@/lib/store";
import { subscribeToTable } from "@/lib/supabase-browser";

interface MonthBucket {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  commission: number;
  payout: number;
}

interface Summary {
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  vendorPayout: number;
  avgOrderValue: number;
  revenueChange: string | null;
  ordersChange: string | null;
}

const POLL_MS = 30_000;

function ChangeTag({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-gray-400">—</span>;
  const positive = value.startsWith("+");
  const zero = value === "+0%" || value === "0%";
  return (
    <span className={`text-xs font-semibold flex items-center gap-0.5 ${zero ? "text-gray-400" : positive ? "text-green-600" : "text-red-500"}`}>
      {zero ? <Minus className="w-3 h-3" /> : positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {value} vs last month
    </span>
  );
}

export default function VendorAnalyticsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const { products } = useProductStore();
  const router = useRouter();

  const [monthly, setMonthly] = useState<MonthBucket[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalOrders: 0, totalRevenue: 0, totalCommission: 0, vendorPayout: 0, avgOrderValue: 0, revenueChange: null, ordersChange: null });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pulse, setPulse] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "seller")) router.push("/vendor/login");
  }, [hasHydrated, isAuthenticated, user, router]);

  const fetchAnalytics = useCallback(async (showPulse = false) => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/analytics/vendor?email=${encodeURIComponent(user.email)}`);
      if (!res.ok) return;
      const data = await res.json();
      setMonthly(data.monthly ?? []);
      setSummary(data.summary ?? {});
      setLastUpdated(new Date());
      if (showPulse) { setPulse(true); setTimeout(() => setPulse(false), 600); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user?.email]);

  // Initial fetch + polling
  useEffect(() => {
    if (!user?.email) return;
    fetchAnalytics();
    timerRef.current = setInterval(() => fetchAnalytics(true), POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [user?.email, fetchAnalytics]);

  // Supabase realtime — instant update on new commission
  useEffect(() => {
    if (!user?.email) return;
    const cleanup = subscribeToTable(
      "order_commissions",
      `vendor_email=eq.${user.email}`,
      () => fetchAnalytics(true)
    );
    return cleanup;
  }, [user?.email, fetchAnalytics]);

  if (!hasHydrated || !isAuthenticated || user?.role !== "seller") return null;

  const sellerProducts = products.filter((p) => p.sellerId === user.id);
  const maxRevenue = monthly.length ? Math.max(...monthly.map(d => d.revenue), 1) : 1;

  const stats = [
    {
      label: "Total Revenue",
      value: `₹${summary.totalRevenue.toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
      change: summary.revenueChange,
    },
    {
      label: "Total Orders",
      value: summary.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50",
      change: summary.ordersChange,
    },
    {
      label: "Avg Order Value",
      value: summary.avgOrderValue ? `₹${summary.avgOrderValue.toLocaleString("en-IN")}` : "—",
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-50",
      change: null,
    },
    {
      label: "Products Listed",
      value: sellerProducts.length.toString(),
      icon: Package,
      color: "text-teal-600 bg-teal-50",
      change: null,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString("en-IN")} · Auto-refreshes every 30s` : "Loading…"}
          </p>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          className="flex items-center gap-1.5 text-xs text-[#0d9488] border border-[#0d9488]/30 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${pulse ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Live indicator */}
      <div className={`flex items-center gap-1.5 mb-5 transition-opacity ${pulse ? "opacity-100" : "opacity-60"}`}>
        <span className={`w-2 h-2 rounded-full bg-green-500 ${pulse ? "animate-ping" : ""}`} />
        <span className="text-xs text-green-600 font-medium">Live — updates instantly when orders come in</span>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((item) => (
          <div key={item.label} className={`bg-white rounded-xl border border-gray-200 p-4 transition-all ${pulse ? "border-green-300 shadow-sm shadow-green-100" : ""}`}>
            <div className={`inline-flex p-2 rounded-lg mb-3 ${item.color}`}><item.icon className="w-4 h-4" /></div>
            <p className="text-xl font-bold text-gray-900">{loading ? "—" : item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            <div className="mt-1"><ChangeTag value={item.change ?? null} /></div>
          </div>
        ))}
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-900">Monthly Revenue</h2>
            <p className="text-xs text-gray-400 mt-0.5">Real earnings from order commissions</p>
          </div>
          <span className="text-xs bg-teal-50 text-[#0d9488] border border-teal-200 px-2 py-1 rounded-full font-medium">Last 6 months</span>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Loading chart…</div>
        ) : monthly.every(b => b.revenue === 0) ? (
          <div className="h-40 flex flex-col items-center justify-center text-gray-400">
            <TrendingUp className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-sm font-medium">No order data yet</p>
            <p className="text-xs mt-1">Chart will populate as orders come in</p>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-3 h-44">
              {monthly.map((d) => {
                const pct = (d.revenue / maxRevenue) * 100;
                const isCurrentMonth = d.key === monthly[monthly.length - 1].key;
                return (
                  <div key={d.key} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {d.revenue > 0 && (
                      <span className="text-xs text-gray-500">₹{d.revenue >= 1000 ? (d.revenue / 1000).toFixed(0) + "k" : d.revenue}</span>
                    )}
                    <div className="w-full relative" style={{ height: "120px", display: "flex", alignItems: "flex-end" }}>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${isCurrentMonth ? "bg-[#0d9488]" : "bg-[#0d9488]/40"} hover:bg-[#0f766e] cursor-pointer`}
                        style={{ height: `${Math.max(pct * 1.2, d.revenue > 0 ? 4 : 0)}px` }}
                        title={`₹${d.revenue.toLocaleString("en-IN")} · ${d.orders} orders`}
                      />
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                      <p className="font-bold">₹{d.revenue.toLocaleString("en-IN")}</p>
                      <p className="text-gray-300">{d.orders} orders</p>
                    </div>
                    <span className={`text-xs font-medium ${isCurrentMonth ? "text-[#0d9488]" : "text-gray-500"}`}>{d.label}</span>
                  </div>
                );
              })}
            </div>
            {/* Commission breakdown under chart */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-400">This Month Revenue</p>
                <p className="text-sm font-bold text-gray-900">₹{monthly[monthly.length - 1]?.revenue.toLocaleString("en-IN") ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-red-400">Platform Cut (5%)</p>
                <p className="text-sm font-bold text-red-600">-₹{monthly[monthly.length - 1]?.commission.toLocaleString("en-IN") ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-green-500">Your Payout</p>
                <p className="text-sm font-bold text-green-600">₹{monthly[monthly.length - 1]?.payout.toLocaleString("en-IN") ?? 0}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Orders per month chart */}
      {!loading && monthly.some(b => b.orders > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Monthly Orders</h2>
          <div className="flex items-end gap-3 h-28">
            {monthly.map((d) => {
              const maxOrders = Math.max(...monthly.map(m => m.orders), 1);
              const pct = (d.orders / maxOrders) * 100;
              const isCurrentMonth = d.key === monthly[monthly.length - 1].key;
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                  {d.orders > 0 && <span className="text-xs text-gray-500">{d.orders}</span>}
                  <div className="w-full" style={{ height: "80px", display: "flex", alignItems: "flex-end" }}>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${isCurrentMonth ? "bg-blue-500" : "bg-blue-200"}`}
                      style={{ height: `${Math.max(pct * 0.8, d.orders > 0 ? 4 : 0)}px` }}
                      title={`${d.orders} orders`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isCurrentMonth ? "text-blue-600" : "text-gray-500"}`}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top products */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Your Products</h2>
        {sellerProducts.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <Package className="w-10 h-10 opacity-20 mx-auto mb-2" />
            <p className="text-sm">No products listed yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sellerProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4">
                <span className={`w-6 text-sm font-bold ${i === 0 ? "text-[#0d9488]" : "text-gray-400"}`}>#{i + 1}</span>
                <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.reviewCount} reviews · {p.stock} in stock</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₹{p.price.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-green-600">Rating {p.rating}★</p>
                </div>
                <div className="w-20 bg-gray-100 rounded-full h-1.5 hidden sm:block">
                  <div className="bg-[#0d9488] h-1.5 rounded-full" style={{ width: `${Math.min((p.reviewCount / Math.max(...sellerProducts.map(x => x.reviewCount), 1)) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
