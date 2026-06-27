"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useHasHydrated, getAuthHeaders } from "@/lib/store";
import type { RefundRequest } from "@/lib/types";
import { toast } from "sonner";

export default function SuperAdminRefundsPage() {
  const { user, isAuthenticated, accessToken, sessionReady } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const router = useRouter();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "processed">("all");

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "admin")) router.push("/superadmin/login");
    if (hasHydrated && sessionReady && !accessToken && isAuthenticated && user?.role === "admin") router.push("/superadmin/login");
  }, [hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.role === "admin" && accessToken) {
      fetch("/api/refunds")
        .then((r) => r.ok ? r.json() : [])
        .then(setRefunds)
        .catch(() => {});
    }
  }, [hasHydrated, isAuthenticated, user?.role, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasHydrated || !isAuthenticated || user?.role !== "admin") return null;

  const updateStatus = (id: string, status: "approved" | "rejected" | "processed") => {
    fetch(`/api/refunds/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    }).catch(() => {});
    setRefunds(refunds.map((r) => r.id === id ? { ...r, status, updatedAt: new Date().toISOString().split("T")[0] } : r));
    toast.success(`Refund ${status === "approved" ? "approved" : status === "processed" ? "processed" : "rejected"}`);
  };

  const filtered = refunds.filter((r) => filter === "all" || r.status === filter);
  const counts = {
    all: refunds.length,
    pending: refunds.filter((r) => r.status === "pending").length,
    approved: refunds.filter((r) => r.status === "approved").length,
    rejected: refunds.filter((r) => r.status === "rejected").length,
    processed: refunds.filter((r) => r.status === "processed").length,
  };
  const totalProcessed = refunds.filter((r) => r.status === "approved" || r.status === "processed").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-[#0d9488]" />
          <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-red-600" />
          <div>
            <p className="text-xs text-red-700">Total Refunds (Approved)</p>
            <p className="font-bold text-red-800">₹{totalProcessed.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "pending", "approved", "rejected", "processed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? "bg-[#1e293b] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} <span className="opacity-70 ml-1">({counts[f]})</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((refund) => (
          <div key={refund.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">Refund #{refund.id}</h3>
                  <Badge className={`text-xs ${
                    refund.status === "approved" || refund.status === "processed" ? "bg-green-100 text-green-700" :
                    refund.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  }`}>
                    {refund.status === "pending" ? <><Clock className="w-3 h-3 mr-1 inline" />Pending</> :
                     refund.status === "approved" ? <><CheckCircle className="w-3 h-3 mr-1 inline" />Approved</> :
                     refund.status === "processed" ? <><CheckCircle className="w-3 h-3 mr-1 inline" />Processed</> :
                     <><XCircle className="w-3 h-3 mr-1 inline" />Rejected</>}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">Order #{refund.orderId} · {refund.customerName}</p>
                <p className="text-xs text-gray-400">Requested: {refund.createdAt} · Updated: {refund.updatedAt}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">₹{refund.amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Refund Amount</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
              <p className="text-xs text-gray-500 font-medium mb-1">Customer's Reason:</p>
              {refund.reason}
            </div>
            {refund.status === "pending" && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5" onClick={() => updateStatus(refund.id, "approved")}>
                  <CheckCircle className="w-3.5 h-3.5" /> Approve Refund
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => updateStatus(refund.id, "rejected")}>
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            )}
            {refund.status === "approved" && (
              <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => updateStatus(refund.id, "processed")}>
                Mark as Processed (₹{refund.amount.toLocaleString()} credited)
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
