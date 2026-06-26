"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  RotateCcw, Plus, CheckCircle, Clock, XCircle, AlertCircle,
  Wallet, Building2, ChevronDown, ChevronUp, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore, useOrderStore, useRefundStore, useWalletStore, useNotificationStore } from "@/lib/store";
import type { RefundRequest } from "@/lib/types";
import { toast } from "sonner";

/* ── Timeline steps per status ─────────────────────────────── */
const TIMELINE: Record<string, { label: string; desc: string }[]> = {
  pending: [
    { label: "Request Initiated", desc: "Your refund request has been submitted." },
  ],
  approved: [
    { label: "Request Initiated", desc: "Your refund request has been submitted." },
    { label: "Approved by Team", desc: "Our team has reviewed and approved your refund." },
    { label: "Processing", desc: "Refund is being processed to your selected method." },
  ],
  processed: [
    { label: "Request Initiated", desc: "Your refund request has been submitted." },
    { label: "Approved by Team", desc: "Our team has reviewed and approved your refund." },
    { label: "Processing", desc: "Refund is being processed to your selected method." },
    { label: "Credited", desc: "Amount has been credited to your account." },
  ],
  rejected: [
    { label: "Request Initiated", desc: "Your refund request has been submitted." },
    { label: "Reviewed", desc: "Our team reviewed your request." },
    { label: "Rejected", desc: "Request did not meet our return policy criteria." },
  ],
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  processed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Under Review",
  approved: "Approved — Processing",
  processed: "Credited",
  rejected: "Rejected",
};

function RefundCard({ refund }: { refund: RefundRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [choosingMethod, setChoosingMethod] = useState(false);
  const [method, setMethod] = useState<"wallet" | "bank">(refund.refundMethod ?? "wallet");
  const [bank, setBank] = useState({ accountNumber: "", ifsc: "", accountName: "" });
  const { updateRefund } = useRefundStore();
  const { credit, transactions } = useWalletStore();
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();
  const steps = TIMELINE[refund.status] ?? TIMELINE.pending;
  const isApproved = refund.status === "approved" || refund.status === "processed";
  const needsMethod = isApproved && !refund.refundMethod;

  // If wallet was chosen but credit never ran (e.g. set in a previous session), credit now
  useEffect(() => {
    if (refund.refundMethod === "wallet" && refund.status === "approved") {
      // Guard: only credit if no existing wallet transaction for this order
      const alreadyCredited = transactions.some(
        (t) => t.orderId === refund.orderId && (t.type === "refund" || t.type === "cancellation_refund")
      );
      if (!alreadyCredited) {
        credit(refund.amount, `Refund for order #${refund.orderId}`, refund.orderId, "refund");
      }
      updateRefund(refund.id, { status: "processed" });
    }
  }, [refund.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMethod = () => {
    if (method === "bank" && (!bank.accountNumber || !bank.ifsc || !bank.accountName)) {
      toast.error("Please fill all bank details");
      return;
    }
    if (method === "wallet") {
      const alreadyCredited = transactions.some(
        (t) => t.orderId === refund.orderId && (t.type === "refund" || t.type === "cancellation_refund")
      );
      if (!alreadyCredited) {
        credit(refund.amount, `Refund for order #${refund.orderId}`, refund.orderId, "refund");
        addNotification({
          userId: user?.id ?? "",
          title: "Refund Credited!",
          message: `₹${refund.amount.toLocaleString()} has been credited to your Bigpool Wallet for order #${refund.orderId}.`,
          type: "refund",
          link: "/customer/profile/wallet",
        });
        toast.success(`₹${refund.amount.toLocaleString()} credited to your Bigpool Wallet instantly! 🎉`);
      } else {
        toast.info("Refund already credited to your wallet.");
      }
      updateRefund(refund.id, { refundMethod: "wallet", status: "processed" });
      setChoosingMethod(false);
    } else {
      updateRefund(refund.id, { refundMethod: "bank", bankDetails: bank });
      addNotification({
        userId: user?.id ?? "",
        title: "Refund Processing",
        message: `Your ₹${refund.amount.toLocaleString()} refund for order #${refund.orderId} is being processed to your bank account (3–5 business days).`,
        type: "refund",
        link: "/customer/profile/refunds",
      });
      setChoosingMethod(false);
      toast.success("Bank details saved. Refund will be credited in 3–5 business days.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">Refund #{refund.id}</span>
            <Badge className={`text-xs ${STATUS_COLOR[refund.status]}`}>{STATUS_LABEL[refund.status]}</Badge>
            {refund.refundMethod && (
              <Badge className="text-xs bg-teal-50 text-teal-700 border border-teal-200">
                {refund.refundMethod === "wallet" ? "💳 Wallet" : "🏦 Bank Transfer"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Order #{refund.orderId} · {refund.createdAt}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <p className="font-bold text-lg text-gray-900">₹{refund.amount.toLocaleString()}</p>
          <button
            className="text-xs text-[#0d9488] hover:underline flex items-center gap-0.5 ml-auto"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />Details</>}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pb-4">
        <div className="flex items-start gap-0">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            const isRejected = refund.status === "rejected" && isLast;
            return (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 ${
                    isRejected
                      ? "bg-red-500 border-red-500"
                      : "bg-[#0d9488] border-[#0d9488]"
                  }`}>
                    {isRejected
                      ? <XCircle className="w-3.5 h-3.5 text-white" />
                      : <CheckCircle className="w-3.5 h-3.5 text-white" />
                    }
                  </div>
                  {!isLast && <div className="flex-1 h-0.5 bg-[#0d9488] mx-1" />}
                </div>
                <p className={`text-[9px] mt-1 text-center leading-tight max-w-16 font-medium ${isRejected ? "text-red-500" : "text-gray-700"}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
          {/* Future steps (greyed out) */}
          {(TIMELINE.processed.length - steps.length) > 0 && refund.status !== "rejected" && (
            Array.from({ length: TIMELINE.processed.length - steps.length }).map((_, i) => (
              <div key={`future-${i}`} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  <div className="flex-1 h-0.5 bg-gray-200 mx-1" />
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-gray-300 bg-white z-10">
                    <Clock className="w-3 h-3 text-gray-300" />
                  </div>
                </div>
                <p className="text-[9px] mt-1 text-center leading-tight max-w-16 text-gray-300">
                  {TIMELINE.processed[steps.length + i]?.label}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Choose refund method banner (only when approved and no method chosen) */}
      {needsMethod && !choosingMethod && (
        <div className="mx-5 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-amber-800">Choose where to receive ₹{refund.amount.toLocaleString()}</p>
            <p className="text-xs text-amber-600 mt-0.5">Select your preferred refund method to proceed.</p>
          </div>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs flex-shrink-0" onClick={() => setChoosingMethod(true)}>
            Select Method
          </Button>
        </div>
      )}

      {/* Method selector */}
      {choosingMethod && (
        <div className="mx-5 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <p className="text-sm font-semibold text-gray-800">Where should we send ₹{refund.amount.toLocaleString()}?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMethod("wallet")}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${method === "wallet" ? "border-[#0d9488] bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <Wallet className={`w-6 h-6 ${method === "wallet" ? "text-[#0d9488]" : "text-gray-400"}`} />
              <div className="text-center">
                <p className={`text-xs font-semibold ${method === "wallet" ? "text-[#0d9488]" : "text-gray-700"}`}>Bigpool Wallet</p>
                <p className="text-[10px] text-green-600 font-medium">⚡ Credited instantly</p>
              </div>
            </button>
            <button
              onClick={() => setMethod("bank")}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${method === "bank" ? "border-[#0d9488] bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <Building2 className={`w-6 h-6 ${method === "bank" ? "text-[#0d9488]" : "text-gray-400"}`} />
              <div className="text-center">
                <p className={`text-xs font-semibold ${method === "bank" ? "text-[#0d9488]" : "text-gray-700"}`}>Bank Account</p>
                <p className="text-[10px] text-gray-400">3–5 business days</p>
              </div>
            </button>
          </div>
          {method === "bank" && (
            <div className="space-y-2 pt-1">
              <Input placeholder="Account Holder Name" value={bank.accountName} onChange={(e) => setBank((b) => ({ ...b, accountName: e.target.value }))} className="text-sm h-9" />
              <Input placeholder="Account Number" value={bank.accountNumber} onChange={(e) => setBank((b) => ({ ...b, accountNumber: e.target.value }))} className="text-sm h-9" />
              <Input placeholder="IFSC Code" value={bank.ifsc} onChange={(e) => setBank((b) => ({ ...b, ifsc: e.target.value.toUpperCase() }))} className="text-sm h-9" />
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setChoosingMethod(false)}>Cancel</Button>
            <Button size="sm" className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs" onClick={saveMethod}>Confirm Method</Button>
          </div>
        </div>
      )}

      {/* Method already set — show where it goes */}
      {refund.refundMethod && (
        <div className="mx-5 mb-4 p-3 bg-teal-50 border border-teal-100 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            {refund.refundMethod === "wallet" ? <Wallet className="w-4 h-4 text-teal-600" /> : <Building2 className="w-4 h-4 text-teal-600" />}
            <div>
              <p className="text-xs font-semibold text-teal-800">
                {refund.refundMethod === "wallet" ? "Bigpool Wallet" : `Bank — ••••${refund.bankDetails?.accountNumber?.slice(-4) ?? "****"}`}
              </p>
              <p className="text-[10px] text-teal-600">
                {refund.refundMethod === "wallet" ? "⚡ Credited to wallet instantly" : "3–5 business days"}
              </p>
            </div>
          </div>
          {refund.status !== "processed" && (
            <button className="text-[10px] text-teal-600 underline" onClick={() => setChoosingMethod(true)}>Change</button>
          )}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 mx-5 pt-4 pb-5 space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 font-medium mb-0.5">Reason</p>
            <p className="text-sm text-gray-700">{refund.reason}</p>
          </div>
          {/* Step-by-step detail */}
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0d9488] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-800">{step.label}</p>
                  <p className="text-xs text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {refund.status === "rejected" && (
            <div className="p-3 bg-red-50 rounded-lg text-xs text-red-700">
              <p className="font-medium">Request Rejected</p>
              <p className="mt-0.5">Didn&apos;t meet return policy criteria. <Link href="/customer/help" className="underline">Contact support</Link> to appeal.</p>
            </div>
          )}
          <Link href={`/customer/help?refund=${refund.id}`}>
            <Button size="sm" variant="ghost" className="text-xs text-gray-500 w-full mt-1">Contact Support</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function RefundsPage() {
  const { user } = useAuthStore();
  const { orders } = useOrderStore();
  const { getForCustomer, addRefund } = useRefundStore();
  const [apiRefunds, setApiRefunds] = useState<RefundRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("");
  const returnableOrders = orders.filter(
    (o) => o.customerId === user?.id && (o.status === "delivered" || o.status === "shipped")
  );
  const hasFetched = useRef(false);
  const hasAutoCreated = useRef(false);

  const localRefunds = user ? getForCustomer(user.id) : [];
  const localOrderIds = new Set(localRefunds.map((r) => r.orderId));
  const refunds = [...localRefunds, ...apiRefunds.filter((r) => !localOrderIds.has(r.orderId))];

  // Auto-create refunds for cancelled paid orders without one
  useEffect(() => {
    if (!user?.id || hasAutoCreated.current) return;
    hasAutoCreated.current = true;
    const myOrders = orders.filter((o) => o.customerId === user.id);
    const existingOrderIds = new Set(refunds.map((r) => r.orderId));
    myOrders
      .filter((o) => o.status === "cancelled" && o.paymentStatus === "paid" && !existingOrderIds.has(o.id))
      .forEach((o) => {
        const refund: RefundRequest = {
          id: `REF-${o.id}`,
          orderId: o.id,
          customerId: user.id,
          customerName: user.name,
          reason: "Order cancelled by customer — automatic refund",
          status: "approved",
          amount: o.total,
          createdAt: new Date().toLocaleDateString("en-IN"),
          updatedAt: new Date().toLocaleDateString("en-IN"),
        };
        addRefund(refund);
        fetch("/api/refunds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(refund) }).catch(() => {});
      });
  }, [user?.id, orders]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.id || hasFetched.current) return;
    hasFetched.current = true;
    fetch(`/api/refunds?customerId=${user.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setApiRefunds)
      .catch(() => {});
  }, [user?.id]);

  const handleSubmit = () => {
    if (!selectedOrder || !reason || !category) { toast.error("Please fill all required fields"); return; }
    const order = orders.find((o) => o.id === selectedOrder);
    const refund: RefundRequest = {
      id: `REF-${Date.now()}`,
      orderId: selectedOrder,
      customerId: user?.id ?? "",
      customerName: user?.name ?? "Customer",
      reason: `${category}: ${reason}`,
      status: "pending",
      amount: order?.total ?? 0,
      createdAt: new Date().toLocaleDateString("en-IN"),
      updatedAt: new Date().toLocaleDateString("en-IN"),
    };
    addRefund(refund);
    fetch("/api/refunds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(refund) }).catch(() => {});
    toast.success("Refund request submitted! We'll process it within 3-5 business days.");
    setDialogOpen(false); setReason(""); setSelectedOrder(""); setCategory("");
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <RotateCcw className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Sign in to view your refunds</h2>
        <Link href="/customer/login"><Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white mt-4">Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-[#0d9488]" />
          <h1 className="text-2xl font-bold text-gray-900">Returns & Refunds</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)} className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold gap-2">
            <Plus className="w-4 h-4" /> New Request
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Request Return / Refund</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Select Order</Label>
                <select className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm" value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)}>
                  <option value="">Choose an order...</option>
                  {returnableOrders.map((o) => (
                    <option key={o.id} value={o.id}>#{o.id} — {o.items[0]?.product.name?.slice(0, 28)}…</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Reason Category</Label>
                <select className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select reason...</option>
                  <option>Defective / Damaged product</option>
                  <option>Wrong item delivered</option>
                  <option>Item not as described</option>
                  <option>Missing parts / accessories</option>
                  <option>Changed my mind</option>
                  <option>Better price available</option>
                </select>
              </div>
              <div>
                <Label>Describe the Issue</Label>
                <Textarea className="mt-1.5" placeholder="Please describe the issue in detail..." rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <p className="font-medium mb-1">📋 Return Policy</p>
                <p>Items can be returned within 30 days of delivery. Refunds processed in 5-7 business days.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSubmit} className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">Submit Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">Bigpool Return Policy</p>
          <p className="text-xs mt-1">Most items can be returned within 30 days of delivery. Cancelled orders get instant refund approval — choose wallet for same-day credit.</p>
        </div>
      </div>

      {refunds.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No refund requests yet</h3>
          <p className="text-gray-500 text-sm mb-4">Cancelled orders will appear here automatically.</p>
          <Link href="/customer/profile/orders">
            <Button variant="outline" className="text-sm">View My Orders</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => <RefundCard key={refund.id} refund={refund} />)}
        </div>
      )}
    </div>
  );
}
