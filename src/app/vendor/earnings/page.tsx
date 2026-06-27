"use client";

import { useEffect, useState } from "react";
import { useAuthStore, useHasHydrated } from "@/lib/store";
import { useRouter } from "next/navigation";
import { IndianRupee, TrendingUp, Package, Banknote, Clock, CheckCircle, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Commission {
  id: string;
  order_id: string;
  product_name: string;
  order_total: number;
  commission_rate: number;
  commission_amount: number;
  vendor_payout: number;
  status: "pending" | "paid";
  created_at: string;
}

interface Summary {
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  vendorPayout: number;
  pendingPayout: number;
}

export default function VendorEarningsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const router = useRouter();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalOrders: 0, totalRevenue: 0, totalCommission: 0, vendorPayout: 0, pendingPayout: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || (user?.role !== "seller" && user?.role !== "admin"))) {
      router.push("/vendor/login");
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/commissions?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        setCommissions(data.commissions ?? []);
        setSummary(data.summary ?? { totalOrders: 0, totalRevenue: 0, totalCommission: 0, vendorPayout: 0, pendingPayout: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.email]);

  if (!hasHydrated || !isAuthenticated) return null;

  const COMMISSION_RATE = 5;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-2 mb-6">
        <Banknote className="w-5 h-5 text-[#0d9488]" />
        <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Package, label: "Total Orders", value: summary.totalOrders.toString(), color: "text-blue-600 bg-blue-50" },
          { icon: IndianRupee, label: "Gross Revenue", value: `₹${summary.totalRevenue.toLocaleString("en-IN")}`, color: "text-purple-600 bg-purple-50" },
          { icon: TrendingUp, label: `Commission (${COMMISSION_RATE}%)`, value: `₹${summary.totalCommission.toLocaleString("en-IN")}`, color: "text-red-600 bg-red-50" },
          { icon: Banknote, label: "Net Earnings", value: `₹${summary.vendorPayout.toLocaleString("en-IN")}`, color: "text-green-600 bg-green-50" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`inline-flex p-2 rounded-lg mb-2 ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Pending payout banner */}
      {summary.pendingPayout > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Pending Payout</p>
              <p className="text-xs text-amber-600">Admin will process your payment shortly</p>
            </div>
          </div>
          <p className="text-xl font-bold text-amber-700">₹{summary.pendingPayout.toLocaleString("en-IN")}</p>
        </div>
      )}

      {/* Commission calculator */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#0d9488]" />
          Commission Calculator
        </h2>
        <CommissionCalculator rate={COMMISSION_RATE} />
      </div>

      {/* Per-order breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="font-bold text-gray-900 text-sm">Order-by-Order Breakdown</h2>
          <span className="text-xs text-gray-500">{commissions.length} orders</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading earnings...</div>
        ) : commissions.length === 0 ? (
          <div className="py-16 text-center">
            <Banknote className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-600">No earnings yet</p>
            <p className="text-sm text-gray-400 mt-1">Your per-order commission breakdown will appear here once you start receiving orders.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-6 gap-2 px-5 py-2.5 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-2">Order / Product</div>
              <div className="text-right">Order Total</div>
              <div className="text-right">Commission ({COMMISSION_RATE}%)</div>
              <div className="text-right">You Get</div>
              <div className="text-center">Status</div>
            </div>
            <div className="divide-y divide-gray-100">
              {commissions.map((c) => (
                <div key={c.id} className="px-5 py-4">
                  {/* Mobile */}
                  <div className="md:hidden">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.product_name || `Order #${c.order_id}`}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(c.created_at).toLocaleDateString("en-IN")}</p>
                      </div>
                      <Badge className={c.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                        {c.status === "paid" ? <><CheckCircle className="w-3 h-3 inline mr-1" />Paid</> : <><Clock className="w-3 h-3 inline mr-1" />Pending</>}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-gray-400">Sale</p>
                        <p className="text-sm font-bold text-gray-900">₹{Number(c.order_total).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-red-400">Cut ({c.commission_rate}%)</p>
                        <p className="text-sm font-bold text-red-600">-₹{Number(c.commission_amount).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-400">You Get</p>
                        <p className="text-sm font-bold text-green-600">₹{Number(c.vendor_payout).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-6 gap-2 items-center text-sm">
                    <div className="col-span-2">
                      <p className="font-medium text-gray-900">{c.product_name || "—"}</p>
                      <p className="text-xs text-gray-400">#{c.order_id} · {new Date(c.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right font-semibold text-gray-900">₹{Number(c.order_total).toLocaleString("en-IN")}</div>
                    <div className="text-right font-semibold text-red-600">-₹{Number(c.commission_amount).toLocaleString("en-IN")}</div>
                    <div className="text-right font-bold text-green-600">₹{Number(c.vendor_payout).toLocaleString("en-IN")}</div>
                    <div className="text-center">
                      <Badge className={c.status === "paid" ? "bg-green-100 text-green-700 text-xs" : "bg-amber-100 text-amber-700 text-xs"}>
                        {c.status === "paid" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer totals */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-gray-600">Total ({commissions.length} orders)</span>
                <div className="flex items-center gap-6">
                  <span className="text-gray-900">₹{summary.totalRevenue.toLocaleString("en-IN")} gross</span>
                  <span className="text-red-600">-₹{summary.totalCommission.toLocaleString("en-IN")} cut</span>
                  <span className="text-green-600 font-bold">₹{summary.vendorPayout.toLocaleString("en-IN")} yours</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CommissionCalculator({ rate }: { rate: number }) {
  const [amount, setAmount] = useState("");
  const num = parseFloat(amount) || 0;
  const commission = Math.round(num * rate) / 100;
  const payout = num - commission;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">Enter Sale Amount (₹)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
          />
        </div>
      </div>
      {num > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xs text-blue-500 mb-1">Sale Price</p>
            <p className="text-lg font-bold text-blue-700">₹{num.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-xs text-red-400 mb-1">Bigpool Cut ({rate}%)</p>
            <p className="text-lg font-bold text-red-600">-₹{commission.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center border-2 border-green-200">
            <p className="text-xs text-green-500 mb-1">You Receive</p>
            <p className="text-lg font-bold text-green-600">₹{payout.toLocaleString("en-IN")}</p>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400 flex items-center gap-1">
        <ArrowUpRight className="w-3 h-3" />
        Bigpool charges {rate}% platform fee on every sale. Payouts are processed weekly.
      </p>
    </div>
  );
}
