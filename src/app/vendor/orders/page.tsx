"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Truck, Search, ChevronDown, ChevronUp, CheckCircle2,
  Circle, Package, MapPin, Link2, ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuthStore, useHasHydrated, useOrderTrackingStore, useOrderStore } from "@/lib/store";
import type { Order } from "@/lib/types";
import { toast } from "sonner";

/* ─── Constants ──────────────────────────────────────────────── */
const STATUS_STEPS = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

const NEXT_STATUS: Record<string, string> = {
  placed: "confirmed",
  confirmed: "packed",
  packed: "shipped",
  shipped: "out_for_delivery",
  out_for_delivery: "delivered",
};

const STATUS_COLOR: Record<string, string> = {
  placed: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  shipped: "bg-cyan-100 text-cyan-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const COURIERS = [
  "Delhivery", "BlueDart", "DTDC", "Ekart Logistics",
  "Xpressbees", "Speed Post", "FedEx", "Shadowfax",
  "Shiprocket", "Other",
];

/* ─── Delivery Stepper ───────────────────────────────────────── */
function DeliveryStepper({ status }: { status: string }) {
  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-red-500 text-xs py-2">
        <Circle className="w-4 h-4" /> Order Cancelled
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto py-3 px-1">
      {STATUS_STEPS.map((step, i) => {
        const done = i < stepIndex;
        const current = i === stepIndex;
        const upcoming = i > stepIndex;
        return (
          <div key={step.key} className="flex items-center flex-shrink-0">
            {/* Node */}
            <div className="flex flex-col items-center gap-1">
              <div className={`relative w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                done
                  ? "bg-green-500 border-green-500"
                  : current
                  ? "bg-[#0d9488] border-[#0d9488]"
                  : "bg-white border-gray-300"
              }`}>
                {done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : current ? (
                  <>
                    <span className="w-2 h-2 bg-white rounded-full" />
                    <span className="absolute inset-0 rounded-full bg-[#0d9488]/30 animate-ping" />
                  </>
                ) : (
                  <span className="w-2 h-2 bg-gray-300 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${
                done ? "text-green-600" : current ? "text-[#0d9488]" : "text-gray-400"
              }`}>
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 w-8 md:w-12 mx-1 rounded-full flex-shrink-0 transition-colors ${
                i < stepIndex ? "bg-green-400" : "bg-gray-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tracking Panel ─────────────────────────────────────────── */
function TrackingPanel({ order }: { order: Order }) {
  const { tracking, updateTracking } = useOrderTrackingStore();
  // O(1) lookup — single map access, no N+1
  const saved = tracking[order.id];

  const [form, setForm] = useState({
    courier: saved?.courier ?? "",
    trackingNumber: saved?.trackingNumber ?? "",
    trackingUrl: saved?.trackingUrl ?? "",
  });
  const [dirty, setDirty] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const save = () => {
    if (!form.courier || !form.trackingNumber) {
      toast.error("Please select a courier and enter a tracking number");
      return;
    }
    updateTracking(order.id, form);
    setDirty(false);
    toast.success(`Tracking saved for #${order.id}`);
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <Truck className="w-3.5 h-3.5" /> Tracking Info
      </p>

      {saved && !dirty && (
        <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-green-700 font-medium">{saved.courier} · {saved.trackingNumber}</p>
            <p className="text-[10px] text-green-600 mt-0.5">Updated {new Date(saved.updatedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</p>
          </div>
          {saved.trackingUrl && (
            <a href={saved.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:underline flex items-center gap-1">
              Track <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-gray-500">Courier Partner</Label>
          <select
            className="w-full mt-1 h-9 px-2 rounded-md border border-gray-200 bg-white text-sm"
            value={form.courier}
            onChange={(e) => set("courier", e.target.value)}
          >
            <option value="">Select courier</option>
            {COURIERS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs text-gray-500">AWB / Tracking Number</Label>
          <Input
            className="mt-1 h-9 text-sm font-mono"
            placeholder="e.g. 1234567890"
            value={form.trackingNumber}
            onChange={(e) => set("trackingNumber", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">Tracking URL (paste link)</Label>
          <div className="relative mt-1">
            <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              className="pl-8 h-9 text-sm"
              placeholder="https://tracking.delhivery.com/..."
              value={form.trackingUrl}
              onChange={(e) => set("trackingUrl", e.target.value)}
            />
          </div>
        </div>
      </div>
      <Button
        size="sm"
        className="mt-3 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs gap-1.5"
        onClick={save}
        disabled={!dirty && !!saved}
      >
        <Truck className="w-3.5 h-3.5" />
        {saved && !dirty ? "Tracking Saved ✓" : "Save Tracking"}
      </Button>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function VendorOrdersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const { orders: storeOrders, fetchOrders, updateOrderStatus } = useOrderStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [localOrders, setLocalOrders] = useState(storeOrders);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.id) {
      fetchOrders({ sellerId: user.id });
    }
  }, [hasHydrated, isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setLocalOrders(storeOrders); }, [storeOrders]);
  // Only show orders that contain at least one product belonging to this seller
  const orders = localOrders.filter((o) =>
    o.items.some((i) => i.product.sellerId === user?.id)
  );

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "seller")) router.push("/vendor/login");
  }, [hasHydrated, isAuthenticated, user, router]);
  if (!hasHydrated || !isAuthenticated || user?.role !== "seller") return null;

  const filtered = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = (orderId: string, newStatus: string) => {
    setLocalOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o));
    updateOrderStatus(orderId, newStatus as Order["status"]);
    toast.success(`Order #${orderId} → "${newStatus.replace(/_/g, " ")}"`);
  };

  const printLabel = (order: Order) => {
    const itemLines = order.items
      .map((i) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #e5e7eb">${i.product.name}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:center">×${i.quantity}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${(i.product.price * i.quantity).toLocaleString()}</td></tr>`)
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Shipping Label – ${order.id}</title>
<style>
  @page{size:A5 landscape;margin:10mm}
  *{box-sizing:border-box;font-family:Arial,sans-serif}
  body{margin:0;padding:0;background:#fff}
  .label{border:2px solid #111;padding:12px;width:100%}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:8px}
  .logo{font-size:20px;font-weight:900;letter-spacing:-0.5px}
  .logo span{color:#0d9488}
  .order-id{font-size:11px;color:#555;text-align:right}
  .order-id strong{font-size:14px;color:#111;display:block}
  .sections{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
  .box{border:1px solid #ccc;border-radius:4px;padding:8px}
  .box-title{font-size:9px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:4px;letter-spacing:.5px}
  .box p{margin:2px 0;font-size:12px;color:#111}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#f3f4f6;padding:4px 8px;text-align:left;border-bottom:1px solid #e5e7eb}
  .total-row td{font-weight:700;border-top:2px solid #111;padding-top:6px}
  .barcode{text-align:center;font-size:28px;letter-spacing:4px;font-family:monospace;color:#111;margin-top:8px;padding-top:8px;border-top:1px dashed #ccc}
  .barcode-num{font-size:10px;letter-spacing:1px;color:#555;font-family:monospace}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head><body onload="window.print()">
<div class="label">
  <div class="header">
    <div class="logo">Big<span>pool</span></div>
    <div class="order-id">Order ID<strong>${order.id}</strong><span style="font-size:11px;color:#555">${new Date(order.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span></div>
  </div>
  <div class="sections">
    <div class="box">
      <div class="box-title">Ship To</div>
      <p><strong>${order.customerName}</strong></p>
      <p>${order.address.street}</p>
      <p>${order.address.city}, ${order.address.state}</p>
      <p>PIN: ${order.address.pincode}</p>
    </div>
    <div class="box">
      <div class="box-title">Sold By</div>
      <p><strong>${user?.name ?? "Seller"}</strong></p>
      <p style="font-size:11px;color:#555">via Bigpool Marketplace</p>
      <p style="margin-top:6px"><strong>Payment:</strong> Prepaid</p>
      <p><strong>Items:</strong> ${order.items.length}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
    <tbody>${itemLines}<tr class="total-row"><td colspan="2">Total</td><td style="text-align:right">₹${order.total.toLocaleString()}</td></tr></tbody>
  </table>
  <div class="barcode">||||| |||  || |||||  |||  ||  |||||</div>
  <div class="barcode-num">${order.id.replace("#", "")}</div>
</div>
</body></html>`;

    const win = window.open("", "_blank", "width=700,height=500");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const activeShipments = orders.filter((o) => ["shipped", "out_for_delivery"].includes(o.status));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-xl font-bold text-gray-900">₹{revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Orders", value: orders.length, color: "text-blue-600" },
          { label: "Processing", value: orders.filter((o) => ["placed", "confirmed", "packed"].includes(o.status)).length, color: "text-orange-600" },
          { label: "In Transit", value: activeShipments.length, color: "text-cyan-600" },
          { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length, color: "text-green-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active shipments banner */}
      {activeShipments.length > 0 && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Truck className="w-5 h-5 text-cyan-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-cyan-800">
              {activeShipments.length} order{activeShipments.length > 1 ? "s" : ""} currently in transit
            </p>
            <p className="text-xs text-cyan-600 mt-0.5">
              {activeShipments.filter((o) => o.status === "shipped").length} shipped ·{" "}
              {activeShipments.filter((o) => o.status === "out_for_delivery").length} out for delivery
              {" "}— expand orders below to add/update tracking info
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search by order ID or customer name..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Orders */}
      <div className="space-y-4">
        {filtered.map((order) => {
          const isExpanded = expanded[order.id];
          const canTrack = ["shipped", "out_for_delivery", "delivered"].includes(order.status);
          return (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Order header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">#{order.id}</p>
                    <p className="text-xs text-gray-500">{order.customerName} · {order.createdAt}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <Badge className={`capitalize text-xs ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                    <p className="text-sm font-bold">₹{order.total.toLocaleString()}</p>
                  </div>
                </div>

                {/* Delivery stepper */}
                <DeliveryStepper status={order.status} />

                {/* Items */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {order.items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                      <img src={product.images[0]} alt="" className="w-6 h-6 object-cover rounded" />
                      <span className="text-xs text-gray-700 truncate max-w-32">{product.name}</span>
                      <span className="text-xs text-gray-500">×{quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Address */}
                <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {order.address.street}, {order.address.city} — {order.address.pincode}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {NEXT_STATUS[order.status] && (
                    <Button size="sm" className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs" onClick={() => updateStatus(order.id, NEXT_STATUS[order.status])}>
                      <Truck className="w-3.5 h-3.5 mr-1.5" />
                      Mark as {NEXT_STATUS[order.status].replace(/_/g, " ")}
                    </Button>
                  )}
                  {canTrack && (
                    <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => toggleExpand(order.id)}>
                      <Package className="w-3.5 h-3.5" />
                      {isExpanded ? "Hide" : "Add / Update"} Tracking
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs text-gray-500" onClick={() => printLabel(order)}>Print Label</Button>
                </div>

                {/* Tracking panel (expanded) */}
                {isExpanded && canTrack && <TrackingPanel order={order} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
