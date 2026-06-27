"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package, Store, Shield, DollarSign,
  CheckCircle, Clock, BarChart3, Megaphone,
  RotateCcw, ChevronRight, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useSellerApplicationStore, useProductStore, useHasHydrated, getAuthHeaders } from "@/lib/store";
import type { Seller, PromotionRequest, RefundRequest } from "@/lib/types";

const adminNavItems = [
  { href: "/superadmin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/superadmin/sellers", label: "Manage Sellers", icon: Store },
  { href: "/superadmin/promotions", label: "Promotions & Ads", icon: Megaphone },
  { href: "/superadmin/commissions", label: "Commissions & Badges", icon: DollarSign },
  { href: "/superadmin/refunds", label: "Refund Requests", icon: RotateCcw },
  { href: "/superadmin/products", label: "All Products", icon: Package },
];

export default function SuperAdminDashboard() {
  const { user, isAuthenticated, accessToken, sessionReady } = useAuthStore();
  const { applications } = useSellerApplicationStore();
  const { products, fetchProducts } = useProductStore();
  const hasHydrated = useHasHydrated();

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [promos, setPromos] = useState<PromotionRequest[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || user?.role !== "admin" || !accessToken) return;
    const h = getAuthHeaders();
    fetchProducts();
    fetch("/api/sellers", { headers: h }).then((r) => r.ok ? r.json() : []).then(setSellers).catch(() => {});
    fetch("/api/promotions").then((r) => r.ok ? r.json() : []).then(setPromos).catch(() => {});
    fetch("/api/refunds").then((r) => r.ok ? r.json() : []).then(setRefunds).catch(() => {});
  }, [hasHydrated, isAuthenticated, user?.role, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Shield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
        <Link href="/superadmin/login"><Button className="bg-[#1e293b] text-white hover:bg-gray-800 font-bold mt-4">Admin Sign In</Button></Link>
      </div>
    );
  }

  const allPendingSellers =
    sellers.filter((s) => s.status === "pending").length +
    applications.filter((a) => a.status === "pending").length;
  const approvedSellers = sellers.filter((s) => s.status === "approved").length;
  const pendingPromos = promos.filter((p) => p.status === "pending").length;
  const pendingRefunds = refunds.filter((r) => r.status === "pending").length;
  const totalRevenue = promos.filter((p) => p.status === "approved").reduce((s, p) => s + p.budget, 0);

  const stats = [
    { label: "Pending Sellers", value: allPendingSellers, icon: Store, color: "bg-yellow-50 text-yellow-600", urgent: allPendingSellers > 0 },
    { label: "Approved Sellers", value: approvedSellers, icon: CheckCircle, color: "bg-green-50 text-green-600", urgent: false },
    { label: "Pending Promos", value: pendingPromos, icon: Megaphone, color: "bg-teal-50 text-teal-600", urgent: pendingPromos > 0 },
    { label: "Pending Refunds", value: pendingRefunds, icon: RotateCcw, color: "bg-red-50 text-red-600", urgent: pendingRefunds > 0 },
    { label: "Ad Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-purple-50 text-purple-600", urgent: false },
    { label: "Total Products", value: products.length, icon: Package, color: "bg-blue-50 text-blue-600", urgent: false },
  ];

  const recentApplications = [
    ...sellers.slice(0, 3).map((s) => ({ name: s.businessName, email: s.email, status: s.status, date: s.createdAt })),
    ...applications.slice(0, 2).map((a) => ({ name: a.businessName, email: a.email, status: a.status, date: a.submittedAt })),
  ].slice(0, 5);

  const promoRevByType = ["banner", "featured", "boost", "ad"].map((type) => ({
    type,
    earned: promos.filter((p) => p.type === type && p.status === "approved").reduce((s, p) => s + p.budget, 0),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Bigpool Control Panel · bigpool.com/superadmin/dashboard</p>
        </div>
        <Badge className="bg-[#1e293b] text-white flex items-center gap-1.5 px-3 py-1.5">
          <Shield className="w-3.5 h-3.5" /> Super Admin
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] p-4 text-white">
              <div className="w-10 h-10 rounded-full bg-[#0d9488] flex items-center justify-center text-white font-bold text-lg mb-2">A</div>
              <p className="font-medium text-sm">{user?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            </div>
            <nav className="py-2">
              {adminNavItems.map((item) => {
                const isCurrent = item.href === "/superadmin/dashboard";
                return (
                  <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 ${isCurrent ? "text-[#0d9488] font-medium bg-teal-50" : "text-gray-700"}`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-400" />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main */}
        <div className="md:col-span-3 space-y-6">
          {/* Urgent alerts */}
          {(allPendingSellers > 0 || pendingPromos > 0 || pendingRefunds > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="font-semibold text-red-800">Action Required</p>
              </div>
              <div className="space-y-1.5">
                {allPendingSellers > 0 && (
                  <Link href="/superadmin/sellers" className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm hover:bg-red-100 transition-colors">
                    <span className="text-red-700">{allPendingSellers} seller application(s) awaiting verification</span>
                    <ChevronRight className="w-4 h-4 text-red-500" />
                  </Link>
                )}
                {pendingPromos > 0 && (
                  <Link href="/superadmin/promotions" className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm hover:bg-red-100 transition-colors">
                    <span className="text-red-700">{pendingPromos} promotion request(s) pending approval</span>
                    <ChevronRight className="w-4 h-4 text-red-500" />
                  </Link>
                )}
                {pendingRefunds > 0 && (
                  <Link href="/superadmin/refunds" className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm hover:bg-red-100 transition-colors">
                    <span className="text-red-700">{pendingRefunds} refund request(s) need review</span>
                    <ChevronRight className="w-4 h-4 text-red-500" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className={`bg-white rounded-xl border p-4 ${stat.urgent ? "border-orange-300" : "border-gray-200"}`}>
                <div className={`inline-flex p-2 rounded-lg mb-3 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                {stat.urgent && <Badge className="mt-1 bg-orange-100 text-orange-700 text-xs">Needs attention</Badge>}
              </div>
            ))}
          </div>

          {/* Recent applications */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Seller Applications</h2>
              <Link href="/superadmin/sellers" className="text-xs text-[#0d9488] hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {recentApplications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No applications yet</p>
              ) : (
                recentApplications.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {a.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-gray-500">{a.email} · Applied {a.date}</p>
                    </div>
                    <Badge className={`text-xs ${
                      a.status === "approved" ? "bg-green-100 text-green-700" :
                      a.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>{a.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ad Revenue breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Promotion Revenue</h2>
            <div className="grid grid-cols-4 gap-4 text-center">
              {promoRevByType.map(({ type, earned }) => (
                <div key={type} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-gray-900">₹{earned.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
