"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, Package, CheckCircle, Truck, MapPin, Phone, Download, XCircle, Wallet, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore, useOrderStore, useRefundStore, useWalletStore } from "@/lib/store";
import { toast } from "sonner";
import type { Order } from "@/lib/types";

function downloadInvoice(order: Order) {
  const rows = order.items.map(({ product, quantity }) =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${product.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${product.price.toLocaleString()}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${(product.price * quantity).toLocaleString()}</td>
    </tr>`
  ).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice — ${order.id}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#1e293b;max-width:700px;margin:40px auto;padding:0 20px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
    .logo{font-size:28px;font-weight:900}.logo span{color:#0d9488}
    .badge{background:#f1f5f9;padding:4px 12px;border-radius:20px;font-size:12px;color:#475569}
    h2{font-size:14px;color:#64748b;margin:0 0 4px}
    table{width:100%;border-collapse:collapse;margin-top:24px}
    th{background:#f8fafc;padding:10px 8px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase}
    th:nth-child(2),th:nth-child(3),th:nth-child(4){text-align:center}
    th:last-child{text-align:right}
    .total-row td{padding:12px 8px;font-weight:bold;font-size:15px;border-top:2px solid #0d9488}
    .footer{margin-top:40px;text-align:center;font-size:11px;color:#94a3b8}
    @media print{body{margin:0}}
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Big<span>pool</span></div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:bold">INVOICE</div>
      <div style="font-size:13px;color:#64748b;margin-top:4px">${order.id}</div>
      <div style="font-size:12px;color:#94a3b8">Date: ${order.createdAt}</div>
    </div>
  </div>

  <div style="display:flex;gap:40px;margin-bottom:24px">
    <div>
      <h2>Bill To</h2>
      <div style="font-weight:600">${order.customerName}</div>
      <div style="font-size:13px;color:#475569;margin-top:2px">
        ${order.address.street}<br/>
        ${order.address.city}, ${order.address.state} — ${order.address.pincode}
      </div>
    </div>
    <div>
      <h2>Payment</h2>
      <div style="font-size:13px;color:#475569">
        Status: <strong style="color:#16a34a">${order.paymentStatus.toUpperCase()}</strong><br/>
        Method: ${order.paymentMethod || "Online"}<br/>
        Est. Delivery: ${order.estimatedDelivery}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="3" style="text-align:right;padding:12px 8px;font-weight:bold;border-top:2px solid #0d9488">Total Paid</td>
        <td style="text-align:right;padding:12px 8px;font-weight:bold;border-top:2px solid #0d9488;color:#0d9488">₹${order.total.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Thank you for shopping with Bigpool! · support@bigpool.com
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${order.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

const statusSteps = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];

const statusColor: Record<string, string> = {
  placed: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  shipped: "bg-cyan-100 text-cyan-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabel: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

const CANCELLABLE = ["placed", "confirmed", "packed", "shipped"];

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { orders, updateOrderStatus } = useOrderStore();
  const { user } = useAuthStore();
  const { addRefund, getForCustomer } = useRefundStore();
  const { balance } = useWalletStore();
  const order = orders.find((o) => o.id === id);
  const myRefunds = user ? getForCustomer(user.id) : [];
  const orderRefund = myRefunds.find((r) => r.orderId === id);

  const handleCancel = async () => {
    if (!order) return;
    const deductPct = order.status === "packed" ? 0.2 : (order.status === "shipped" || order.status === "out_for_delivery") ? 0.5 : 0;
    const deductLabel = deductPct > 0 ? `${deductPct * 100}%` : null;
    const msg = deductLabel
      ? `Your order is already ${order.status.replace(/_/g, " ")}. Per our T&C, a ${deductLabel} deduction applies. Proceed with cancellation?`
      : "Cancel this order? You'll receive a 100% refund to your Bigpool Wallet instantly.";
    if (!window.confirm(msg)) return;
    await updateOrderStatus(order.id, "cancelled");
    if (user) {
      const refundAmount = Math.round(order.total * (1 - deductPct));
      const refund = {
        id: `REF-${Date.now()}`,
        orderId: order.id,
        customerId: user.id,
        customerName: user.name,
        reason: deductLabel
          ? `Order cancelled after ${order.status.replace(/_/g, " ")} (${deductLabel} deduction applied per T&C)`
          : "Order cancelled before processing — full refund",
        status: "approved" as const,
        amount: refundAmount,
        createdAt: new Date().toLocaleDateString("en-IN"),
        updatedAt: new Date().toLocaleDateString("en-IN"),
      };
      addRefund(refund);
      fetch("/api/refunds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(refund) }).catch(() => {});
      toast.success(`Order cancelled. ₹${refundAmount.toLocaleString()} refund initiated.`);
    } else {
      toast.success("Order cancelled. Refund will be processed shortly.");
    }
  };

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">😕</p>
        <h2 className="text-xl font-semibold mb-4">Order not found</h2>
        <Link href="/customer/profile/orders"><Button variant="outline">Back to Orders</Button></Link>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  // For cancelled orders, determine how far the order progressed by checking tracking events
  const lastProgressStatus = isCancelled
    ? (() => {
        const normalSteps = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
        const trackingStatuses = order.tracking.map((t) => t.status);
        let last = -1;
        for (const s of normalSteps) {
          if (trackingStatuses.includes(s)) last = normalSteps.indexOf(s);
        }
        return last;
      })()
    : -1;
  const currentStepIdx = isCancelled ? lastProgressStatus : statusSteps.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-6 pb-20 md:pb-6">
      <Link href="/customer/profile/orders" className="inline-flex items-center gap-1.5 text-sm text-[#0d9488] hover:underline mb-4 md:mb-5">
        <ChevronLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-4 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">Order #{order.id}</h1>
          <p className="text-sm text-gray-500">Placed on {order.createdAt}</p>
        </div>
        <Badge className={`capitalize flex-shrink-0 ${statusColor[order.status]}`}>
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Tracking Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Truck className="w-5 h-5 text-[#0d9488]" />
              <h2 className="font-semibold text-gray-900">Tracking</h2>
              {order.status === "delivered" && (
                <span className="ml-auto text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Delivered
                </span>
              )}
            </div>

            {/* Progress bar — scrollable on mobile */}
            <div className="overflow-x-auto pb-2 -mx-1">
              <div className="flex items-center min-w-[400px] px-1 mb-6">
              {statusSteps.map((s, i) => {
                const done = i < currentStepIdx;
                const active = i === currentStepIdx;
                const cancelledHere = isCancelled && i === currentStepIdx + 1;
                return (
                  <div key={s} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        cancelledHere
                          ? "bg-red-500 border-red-500 text-white"
                          : done || active
                            ? "bg-[#0d9488] border-[#0d9488] text-white"
                            : "border-gray-300 bg-white text-gray-400"
                      }`}>
                        {cancelledHere ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : done ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </div>
                      <p className={`text-[9px] md:text-[10px] mt-1 text-center leading-tight w-12 md:w-14 ${
                        cancelledHere ? "text-red-500 font-medium" : done || active ? "text-gray-800 font-medium" : "text-gray-400"
                      }`}>
                        {cancelledHere ? "Cancelled" : statusLabel[s]}
                      </p>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 mt-[-12px] ${
                        cancelledHere || (isCancelled && i >= currentStepIdx + 1) ? "bg-gray-200" : done ? "bg-[#0d9488]" : "bg-gray-200"
                      }`} />
                    )}
                  </div>
                );
              })}
              </div>
            </div>

            {/* Cancelled banner */}
            {isCancelled && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Order Cancelled</p>
                  <p className="text-xs text-red-600 mt-0.5">Your refund has been initiated. Check the <a href="/customer/profile/refunds" className="underline font-medium">Refunds page</a> for status.</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-4">
              {[...order.tracking].reverse().map((event, i) => (
                <div key={i} className={`flex gap-4 ${i === 0 ? "text-gray-900" : "text-gray-400"}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${i === 0 ? "bg-[#0d9488]" : "bg-gray-300"}`} />
                    {i < order.tracking.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium capitalize ${i === 0 ? "text-gray-900" : "text-gray-500"}`}>
                      {event.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {event.location} · {event.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {order.status !== "delivered" && order.status !== "cancelled" && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p className="font-medium">Estimated Delivery: {order.estimatedDelivery}</p>
                <p className="text-xs mt-0.5">Package is on its way. You'll receive updates soon.</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" /> Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 md:gap-4">
                  <Link href={`/customer/products/${product.id}`}>
                    <img src={product.images[0]} alt={product.name} className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/customer/products/${product.id}`}>
                      <p className="text-sm font-medium hover:text-[#0d9488] line-clamp-2">{product.name}</p>
                    </Link>
                    <p className="text-xs text-gray-500">Qty: {quantity}</p>
                    <p className="text-sm font-bold mt-1">₹{(product.price * quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order details sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Delivery Address</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.customerName}</p>
              <p>{order.address.street}</p>
              <p>{order.address.city}, {order.address.state}</p>
              <p>Pincode: {order.address.pincode}</p>
              <p className="flex items-center gap-1 mt-2"><Phone className="w-3.5 h-3.5" /> Contact via app</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Payment Info</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Payment Status</span>
                <Badge className={order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {order.paymentStatus}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total Paid</span>
                <span>₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Refund status card for cancelled orders */}
          {order.status === "cancelled" && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#0d9488]" /> Refund Status
              </h3>
              {orderRefund ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="font-bold text-gray-900">₹{orderRefund.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge className={`text-xs ${orderRefund.status === "approved" ? "bg-blue-100 text-blue-700" : orderRefund.status === "processed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {orderRefund.status === "approved" ? "✅ Approved" : orderRefund.status === "processed" ? "💰 Credited" : "⏳ Under Review"}
                    </Badge>
                  </div>
                  {orderRefund.refundMethod ? (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Method</span>
                      <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                        {orderRefund.refundMethod === "wallet"
                          ? <><Wallet className="w-3.5 h-3.5 text-teal-600" /> Bigpool Wallet</>
                          : <><Building2 className="w-3.5 h-3.5 text-teal-600" /> Bank Transfer</>}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                      ⚠️ Choose refund method to receive your money
                    </div>
                  )}
                  <Link href="/customer/profile/refunds" className="block mt-2">
                    <Button size="sm" className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs h-9">
                      {orderRefund.refundMethod ? "Track Refund" : "Choose Refund Method →"}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Refund is being initiated for this order.</p>
                  <Link href="/customer/profile/refunds" className="block">
                    <Button size="sm" variant="outline" className="w-full text-xs h-9">View Refunds Page</Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {order.status === "delivered" && (
              <Link href="/customer/profile/refunds">
                <Button variant="outline" className="w-full text-sm h-11">
                  Return / Refund
                </Button>
              </Link>
            )}
            {CANCELLABLE.includes(order.status) && (
              <Button
                variant="outline"
                className="w-full text-sm gap-2 text-red-600 border-red-200 hover:bg-red-50 h-11"
                onClick={handleCancel}
              >
                <XCircle className="w-4 h-4" /> Cancel Order
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full text-sm gap-2 h-11"
              onClick={() => downloadInvoice(order)}
            >
              <Download className="w-4 h-4" /> Download Invoice
            </Button>
            <Link href={`/customer/help?order=${order.id}`} className="block">
              <Button variant="ghost" className="w-full text-sm text-gray-600 h-11">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
