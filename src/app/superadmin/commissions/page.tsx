"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, RotateCcw, Save, Info, BadgeCheck, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useHasHydrated, useCommissionStore, useBadgeStore } from "@/lib/store";
import { toast } from "sonner";

export default function CommissionsPage() {
  const { user, isAuthenticated, accessToken, sessionReady } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const router = useRouter();
  const { tiers, updateFee, toggleActive, resetDefaults } = useCommissionStore();
  const { requests, updateStatus } = useBadgeStore();

  const [editFees, setEditFees] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "admin")) router.push("/superadmin/login");
    if (hasHydrated && sessionReady && !accessToken && isAuthenticated && user?.role === "admin") router.push("/superadmin/login");
  }, [hasHydrated, isAuthenticated, user, router]);
  if (!hasHydrated || !isAuthenticated || user?.role !== "admin") return null;

  const listingTiers = tiers.filter((t) => t.type === "listing_fee");
  const transactionTiers = tiers.filter((t) => t.type === "transaction");

  const handleSave = (id: string) => {
    const raw = editFees[id];
    if (raw === undefined) return;
    const fee = parseInt(raw, 10);
    if (isNaN(fee) || fee < 0) { toast.error("Enter a valid fee (0 or above)"); return; }
    updateFee(id, fee);
    setEditFees((prev) => { const n = { ...prev }; delete n[id]; return n; });
    toast.success("Commission rate updated");
  };

  const pendingBadges = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#0d9488]" />
          <h1 className="text-2xl font-bold text-gray-900">Commission & Badge Management</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => { resetDefaults(); setEditFees({}); toast.success("Rates reset to defaults"); }}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 mb-8">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">How commission rates work</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li><strong>Listing Fees</strong> are charged monthly per seller based on their total active product count.</li>
            <li><strong>Transaction Commissions</strong> are deducted from each completed order before payout.</li>
            <li>Changes take effect from the next billing cycle. Sellers are notified 14 days in advance.</li>
          </ul>
        </div>
      </div>

      {/* Listing Fees */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Listing Fees (Monthly per Seller)</h2>
          <Badge className="bg-purple-100 text-purple-700 text-xs">By Products Listed</Badge>
        </div>
        <div className="divide-y divide-gray-100">
          {listingTiers.map((tier) => {
            const isEditing = editFees[tier.id] !== undefined;
            return (
              <div key={tier.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{tier.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tier.condition}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">₹</span>
                  <Input
                    className="w-24 h-8 text-sm text-center font-mono"
                    value={isEditing ? editFees[tier.id] : String(tier.fee)}
                    onChange={(e) => setEditFees((prev) => ({ ...prev, [tier.id]: e.target.value }))}
                  />
                  <span className="text-xs text-gray-400">/mo</span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <Button size="sm" className="h-8 text-xs bg-[#0d9488] hover:bg-[#0f766e] text-white gap-1" onClick={() => handleSave(tier.id)}>
                      <Save className="w-3 h-3" /> Save
                    </Button>
                  )}
                  <button
                    onClick={() => toggleActive(tier.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      tier.active
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    {tier.active ? "Active" : "Off"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Commissions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Transaction Commissions (Per Order)</h2>
          <Badge className="bg-teal-100 text-teal-700 text-xs">By Order Value</Badge>
        </div>
        <div className="divide-y divide-gray-100">
          {transactionTiers.map((tier) => {
            const isEditing = editFees[tier.id] !== undefined;
            return (
              <div key={tier.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{tier.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tier.condition}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">₹</span>
                  <Input
                    className="w-24 h-8 text-sm text-center font-mono"
                    value={isEditing ? editFees[tier.id] : String(tier.fee)}
                    onChange={(e) => setEditFees((prev) => ({ ...prev, [tier.id]: e.target.value }))}
                  />
                  <span className="text-xs text-gray-400">/order</span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <Button size="sm" className="h-8 text-xs bg-[#0d9488] hover:bg-[#0f766e] text-white gap-1" onClick={() => handleSave(tier.id)}>
                      <Save className="w-3 h-3" /> Save
                    </Button>
                  )}
                  <button
                    onClick={() => toggleActive(tier.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      tier.active
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    {tier.active ? "Active" : "Off"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Badge Requests */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Verified Badge Requests (₹300 each)</h2>
          </div>
          {pendingBadges > 0 && (
            <Badge className="bg-yellow-100 text-yellow-700 text-xs">{pendingBadges} pending</Badge>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <BadgeCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No badge requests yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req) => (
              <div key={req.id} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{req.businessName}</p>
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
                    <p className="text-xs text-gray-500 mt-0.5">{req.sellerEmail} · {req.productsSold} orders sold · Applied {req.appliedAt}</p>
                    {req.razorpayPaymentId && (
                      <p className="text-xs text-green-600 mt-0.5">Payment: {req.razorpayPaymentId}</p>
                    )}
                  </div>
                  {req.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => { updateStatus(req.id, "approved"); toast.success("Badge approved! ✓"); }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="text-xs gap-1" onClick={() => { updateStatus(req.id, "rejected"); toast.success("Badge request rejected"); }}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
