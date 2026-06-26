"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCcw, Gift, AlertCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore, useHasHydrated, useWalletStore } from "@/lib/store";
import type { WalletTransaction } from "@/lib/types";

const TX_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; amountColor: string }> = {
  credit:               { icon: ArrowDownLeft,  label: "Added",           color: "bg-green-50 text-green-700",   amountColor: "text-green-600" },
  debit:                { icon: ArrowUpRight,   label: "Used",            color: "bg-red-50 text-red-700",       amountColor: "text-red-600" },
  refund:               { icon: RefreshCcw,     label: "Refund",          color: "bg-blue-50 text-blue-700",     amountColor: "text-blue-600" },
  cashback:             { icon: Gift,           label: "Cashback",        color: "bg-purple-50 text-purple-700", amountColor: "text-purple-600" },
  cancellation_refund:  { icon: AlertCircle,   label: "Cancel Refund",   color: "bg-yellow-50 text-yellow-700", amountColor: "text-yellow-600" },
};

function TxRow({ tx }: { tx: WalletTransaction }) {
  const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.credit;
  const Icon = cfg.icon;
  const isCredit = ["credit", "refund", "cashback", "cancellation_refund"].includes(tx.type);
  const dt = new Date(tx.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`p-2 rounded-full flex-shrink-0 ${cfg.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{tx.description}</p>
        <p className="text-xs text-gray-400 mt-0.5">{dt}</p>
      </div>
      <p className={`text-sm font-bold flex-shrink-0 ${cfg.amountColor}`}>
        {isCredit ? "+" : "−"}₹{tx.amount.toLocaleString()}
      </p>
    </div>
  );
}

export default function WalletPage() {
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const router = useRouter();
  const { balance, transactions, credit } = useWalletStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push("/customer/login");
  }, [hasHydrated, isAuthenticated, router]);
  if (!hasHydrated || !isAuthenticated) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Balance card */}
      <div className="bg-gradient-to-br from-[#0d9488] to-[#0f766e] rounded-2xl p-6 text-white mb-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-white/80" />
          <span className="text-sm text-white/80">Bigpool Wallet</span>
        </div>
        <p className="text-4xl font-extrabold">₹{balance.toLocaleString()}</p>
        <p className="text-white/70 text-sm mt-1">Available balance · {user?.name}</p>
        <div className="flex gap-3 mt-5">
          <Button
            size="sm"
            className="bg-white text-[#0d9488] hover:bg-white/90 font-semibold gap-1.5 h-9"
            onClick={() => credit(500, "Test top-up (demo)", undefined, "credit")}
          >
            <Plus className="w-3.5 h-3.5" /> Add Money (Demo)
          </Button>
        </div>
      </div>

      {/* How wallet works */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-amber-800 mb-2">How Bigpool Wallet works</p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>Cancellation/return refunds go to wallet <strong>instantly</strong> ({"<"}2 min) or back to original account in <strong>3–7 business days</strong> — your choice.</li>
          <li>Cancellation deductions: <strong>20% cut if packed</strong>, <strong>50% cut if shipped/out-for-delivery</strong>.</li>
          <li>COD orders: no refund needed (no money was taken at checkout).</li>
          <li>Use your wallet balance at checkout — no OTP or UPI PIN needed.</li>
          <li>Cashback & promotional credits credited automatically, no expiry.</li>
        </ul>
      </div>

      {/* Refund timeline card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-3">Refund Timeline by Payment Method</p>
        <div className="space-y-2">
          {[
            { method: "Bigpool Wallet", time: "Instant (< 2 min)", color: "text-green-600 bg-green-50" },
            { method: "UPI (GPay / PhonePe / Paytm)", time: "1–3 business days", color: "text-blue-600 bg-blue-50" },
            { method: "Debit / Credit Card", time: "5–7 business days", color: "text-yellow-700 bg-yellow-50" },
            { method: "Net Banking", time: "5–7 business days", color: "text-yellow-700 bg-yellow-50" },
            { method: "Cash on Delivery (COD)", time: "No refund needed", color: "text-gray-500 bg-gray-50" },
          ].map((row) => (
            <div key={row.method} className="flex items-center justify-between text-xs py-1.5">
              <span className="text-gray-700">{row.method}</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${row.color}`}>{row.time}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 border-t pt-2">Wallet refunds are instant. Card/bank timelines are determined by your bank, not Bigpool.</p>
      </div>

      {/* Cancellation policy callout */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-500" /> Cancellation Refund Policy
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { stage: "Before Packing", refund: "100%", cut: "₹0", color: "bg-green-50 border-green-200 text-green-800" },
            { stage: "After Packed", refund: "80%", cut: "20% deducted", color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
            { stage: "Shipped / OFD", refund: "50%", cut: "50% deducted", color: "bg-red-50 border-red-200 text-red-800" },
          ].map((row) => (
            <div key={row.stage} className={`rounded-lg border p-3 ${row.color}`}>
              <p className="text-xs font-medium">{row.stage}</p>
              <p className="text-xl font-extrabold mt-1">{row.refund}</p>
              <p className="text-[10px] mt-0.5 opacity-70">{row.cut}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">Refunds are credited to your Bigpool Wallet within minutes. Wallet balance can be used on your next order.</p>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
          {transactions.length > 0 && (
            <Badge className="bg-gray-100 text-gray-700 text-xs">{transactions.length} total</Badge>
          )}
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Your refunds and cashback will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 px-5">
            {transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Questions?{" "}
        <Link href="/terms#payments" className="text-[#0d9488] hover:underline">See our refund policy</Link>
      </p>
    </div>
  );
}
