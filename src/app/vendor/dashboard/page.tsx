"use client";

import Link from "next/link";
import {
  Package, TrendingUp, DollarSign, ShoppingBag, Star, Plus,
  BarChart3, Bell, ArrowUpRight, ChevronRight, Store, BadgeCheck, Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { useAuthStore, useProductStore, useOrderStore } from "@/lib/store";

const vendorNavItems = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/vendor/products", label: "My Products", icon: Package },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
  { href: "/vendor/earnings", label: "My Earnings", icon: Banknote },
  { href: "/vendor/promotions", label: "Promotions & Ads", icon: TrendingUp },
  { href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/vendor/verified-badge", label: "Get Verified ✓", icon: BadgeCheck },
];

export default function VendorDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const { products, fetchProducts } = useProductStore();
  const { orders, fetchOrders } = useOrderStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchProducts({ sellerId: user.id });
      fetchOrders({ sellerId: user.id });
    }
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated || user?.role !== "seller") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Store className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Vendor Access Required</h2>
        <p className="text-gray-500 mb-4">Please sign in as a vendor to access the dashboard</p>
        <Link href="/vendor/login"><Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">Vendor Sign In</Button></Link>
      </div>
    );
  }

  const sellerProducts = products.filter((p) => p.sellerId === user.id);
  const sellerOrders = orders.filter((o) => o.items.some((i) => i.product.sellerId === user.id));
  const totalRevenue = sellerOrders.reduce((s, o) => s + o.total, 0);

  const stats = [
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-50 text-green-600", trend: "+12% this month" },
    { label: "Total Orders", value: sellerOrders.length, icon: ShoppingBag, color: "bg-blue-50 text-blue-600", trend: `${sellerOrders.filter((o) => o.status === "placed").length} new` },
    { label: "Products Listed", value: sellerProducts.length, icon: Package, color: "bg-purple-50 text-purple-600", trend: "0 pending review" },
    { label: "Avg. Rating", value: "4.8★", icon: Star, color: "bg-yellow-50 text-yellow-600", trend: "Excellent" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.name}!</p>
        </div>
        <Link href="/vendor/products">
          <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] p-4 text-white">
              <div className="w-10 h-10 rounded-full bg-[#0d9488] flex items-center justify-center text-white font-bold text-lg mb-2">
                {user.name?.[0]}
              </div>
              <p className="font-medium text-sm">{user?.name}</p>
              <Badge className="mt-1 bg-[#0d9488]/20 text-[#0d9488] text-xs border border-[#0d9488]/30">Verified Seller ✓</Badge>
            </div>
            <nav className="py-2">
              {vendorNavItems.map((item) => (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 ${item.href === "/vendor/dashboard" ? "text-[#0d9488] font-medium bg-teal-50" : "text-gray-700"}`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-400" />
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="md:col-span-3 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={`inline-flex p-2 rounded-lg mb-3 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> {stat.trend}
                </p>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Orders</h2>
              <Link href="/vendor/orders" className="text-xs text-[#0d9488] hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {sellerOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                  <img src={order.items[0]?.product.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">#{order.id}</p>
                    <p className="text-xs text-gray-500">{order.customerName} · {order.items.length} item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">₹{order.total.toLocaleString()}</p>
                    <Badge className={`text-xs capitalize mt-0.5 ${
                      order.status === "delivered" ? "bg-green-100 text-green-700" :
                      order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>{order.status.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Products overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Your Products</h2>
              <Link href="/vendor/products">
                <Button size="sm" className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sellerProducts.slice(0, 4).map((p) => (
                <div key={p.id} className="flex gap-3 p-2 border border-gray-100 rounded-lg">
                  <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2">{p.name}</p>
                    <p className="text-xs text-gray-500">₹{p.price.toLocaleString()} · {p.stock} in stock</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                      <span className="text-xs text-gray-500">{p.rating} ({p.reviewCount})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
