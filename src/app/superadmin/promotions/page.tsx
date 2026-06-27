"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone, CheckCircle, XCircle, Clock,
  DollarSign, ImageIcon, Star, TrendingUp, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useHasHydrated } from "@/lib/store";
import type { PromotionRequest } from "@/lib/types";
import { toast } from "sonner";

const typeIcons: Record<string, React.ReactNode> = {
  banner: <ImageIcon className="w-4 h-4" />,
  featured: <Star className="w-4 h-4" />,
  boost: <TrendingUp className="w-4 h-4" />,
  ad: <Megaphone className="w-4 h-4" />,
  sale: <Tag className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
  banner: "bg-purple-100 text-purple-700",
  featured: "bg-blue-100 text-blue-700",
  boost: "bg-green-100 text-green-700",
  ad: "bg-orange-100 text-orange-700",
  sale: "bg-orange-100 text-orange-700",
};

export default function SuperAdminPromotionsPage() {
  const { user, isAuthenticated, accessToken, sessionReady } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const router = useRouter();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "admin")) router.push("/superadmin/login");
    if (hasHydrated && sessionReady && !accessToken && isAuthenticated && user?.role === "admin") router.push("/superadmin/login");
  }, [hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.role === "admin") {
      fetch("/api/promotions")
        .then((r) => r.ok ? r.json() : [])
        .then(setRequests)
        .catch(() => {});
    }
  }, [hasHydrated, isAuthenticated, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasHydrated || !isAuthenticated || user?.role !== "admin") return null;

  const updateStatus = (id: string, status: "approved" | "rejected") => {
    fetch(`/api/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    setRequests(requests.map((r) => r.id === id ? { ...r, status } : r));
    toast.success(`Promotion request ${status}`);
  };

  const filtered = requests.filter((r) => filter === "all" || r.status === filter);
  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };
  const totalAdRevenue = requests.filter((r) => r.status === "approved").reduce((s, r) => s + r.budget, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#0d9488]" />
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Ads</h1>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs text-green-700">Total Ad Revenue</p>
            <p className="font-bold text-green-800">₹{totalAdRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? "bg-[#1e293b] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} <span className="ml-1 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((req) => (
          <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${typeColors[req.type]}`}>{typeIcons[req.type]}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 capitalize">{req.type} Promotion</h3>
                    <Badge className={`text-xs ${typeColors[req.type]}`}>{req.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{req.sellerName}</p>
                  {req.productName && <p className="text-xs text-gray-500">Product: {req.productName}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">Requested: {req.createdAt}</p>
                </div>
              </div>
              <Badge className={`text-xs ${
                req.status === "approved" ? "bg-green-100 text-green-700" :
                req.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {req.status === "pending" ? <><Clock className="w-3 h-3 mr-1 inline" />Pending</> :
                 req.status === "approved" ? <><CheckCircle className="w-3 h-3 mr-1 inline" />Approved</> :
                 <><XCircle className="w-3 h-3 mr-1 inline" />Rejected</>}
              </Badge>
            </div>
            {req.type === "sale" && req.couponCode ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-orange-600 font-medium">Coupon Code</p>
                    <p className="font-bold font-mono tracking-widest text-orange-800">{req.couponCode}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Approve to activate 🔥 Live Sale badge on this product</p>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold text-gray-900">₹{req.budget.toLocaleString()}</p><p className="text-xs text-gray-500">Budget</p></div>
                <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold text-gray-900">{req.duration} days</p><p className="text-xs text-gray-500">Duration</p></div>
                <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold text-gray-900">₹{Math.round(req.budget / req.duration).toLocaleString()}</p><p className="text-xs text-gray-500">Per Day</p></div>
              </div>
            )}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
              <p className="text-xs text-gray-500 font-medium mb-1">Seller's message:</p>
              {req.message}
            </div>
            {req.status === "pending" && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5" onClick={() => updateStatus(req.id, "approved")}>
                  <CheckCircle className="w-3.5 h-3.5" /> {req.type === "sale" ? "Approve Live Sale" : `Approve & Collect ₹${req.budget.toLocaleString()}`}
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => updateStatus(req.id, "rejected")}>
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
