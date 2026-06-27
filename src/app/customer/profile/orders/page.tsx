"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Package, MapPin, Truck, ChevronRight, XCircle, Star, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore, useOrderStore, useRefundStore, useNotificationStore } from "@/lib/store";
import { toast } from "sonner";
import { Suspense } from "react";

const statusColor: Record<string, string> = {
  placed: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  shipped: "bg-cyan-100 text-cyan-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-purple-100 text-purple-700",
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { orders, fetchOrders, updateOrderStatus } = useOrderStore();
  const { addRefund } = useRefundStore();
  const { addNotification } = useNotificationStore();
  const myOrders = orders.filter((o) => o.customerId === user?.id);

  const handleCancel = async (orderId: string, status: string) => {
    const deductPct = status === "packed" ? 0.2 : (status === "shipped" || status === "out_for_delivery") ? 0.5 : 0;
    const deductLabel = deductPct > 0 ? `${deductPct * 100}%` : null;
    const msg = deductLabel
      ? `Order is already ${status.replace(/_/g, " ")}. Per our T&C, a ${deductLabel} deduction applies. Proceed?`
      : "Cancel this order? You'll receive a 100% refund to your Bigpool Wallet instantly.";
    if (!window.confirm(msg)) return;
    const order = myOrders.find((o) => o.id === orderId);
    await updateOrderStatus(orderId, "cancelled");
    if (order && user) {
      const refundAmount = Math.round(order.total * (1 - deductPct));
      const refund = {
        id: `REF-${Date.now()}`,
        orderId,
        customerId: user.id,
        customerName: user.name,
        reason: deductLabel
          ? `Order cancelled after ${status.replace(/_/g, " ")} (${deductLabel} deduction applied per T&C)`
          : "Order cancelled before processing — full refund",
        status: "approved" as const,
        amount: refundAmount,
        createdAt: new Date().toLocaleDateString("en-IN"),
        updatedAt: new Date().toLocaleDateString("en-IN"),
      };
      addRefund(refund);
      fetch("/api/refunds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(refund) }).catch(() => {});
      addNotification({
        userId: user.id,
        title: "Order Cancelled",
        message: `Your order #${orderId} has been cancelled. ₹${refundAmount.toLocaleString()} refund initiated.`,
        type: "order",
        link: `/customer/profile/orders/${orderId}`,
      });
      addNotification({
        userId: user.id,
        title: "Refund Initiated",
        message: `₹${refundAmount.toLocaleString()} refund approved for order #${orderId}. Go to Refunds to choose your payout method.`,
        type: "refund",
        link: "/customer/profile/refunds",
      });
    }
    toast.success(`Order cancelled. ₹${Math.round((order?.total ?? 0) * (1 - deductPct)).toLocaleString()} refund initiated.`);
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) fetchOrders({ customerId: user.id });
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Your order has been placed successfully! 🎉");
    }
  }, [searchParams]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">📦</p>
        <h2 className="text-xl font-semibold mb-2">Sign in to view your orders</h2>
        <Link href="/customer/login"><Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold mt-4">Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-6 pb-20 md:pb-6">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Package className="w-5 h-5 text-[#0d9488]" />
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Orders</h1>
        <Badge className="bg-gray-100 text-gray-700">{myOrders.length}</Badge>
      </div>

      {myOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-5xl mb-4">📦</p>
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <Link href="/customer/products"><Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white h-11">Start Shopping</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
              onClick={() => router.push(`/customer/profile/orders/${order.id}`)}
            >
              {/* Card header — mobile stacked, desktop row */}
              <div className="px-4 md:px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Order ID</p>
                    <p className="font-semibold text-gray-800 text-sm truncate">{order.id}</p>
                  </div>
                  <Badge className={`capitalize text-xs flex-shrink-0 ${statusColor[order.status] || "bg-gray-100 text-gray-700"}`}>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span>{order.createdAt}</span>
                  <span className="text-gray-300">·</span>
                  <span className="font-semibold text-gray-800">₹{order.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 md:p-5">
                {order.items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3 mb-3">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); router.push(`/customer/products/${product.id}`); }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium text-gray-800 hover:text-[#0d9488] line-clamp-2 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); router.push(`/customer/products/${product.id}`); }}
                      >
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {quantity} · ₹{product.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-2 text-xs text-gray-500 mt-2 mb-3">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">Deliver to: {order.address.street}, {order.address.city} - {order.address.pincode}</span>
                </div>

                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5 h-9"
                    onClick={() => router.push(`/customer/profile/orders/${order.id}`)}
                  >
                    {order.status === "cancelled"
                      ? <><Eye className="w-3.5 h-3.5" /> View Details</>
                      : <><Truck className="w-3.5 h-3.5" /> Track Order</>
                    }
                  </Button>
                  {order.status === "delivered" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-orange-600 border-orange-200 hover:bg-orange-50 h-9"
                      onClick={() => router.push("/customer/profile/refunds")}
                    >
                      Return / Refund
                    </Button>
                  )}
                  {order.status === "cancelled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-[#0d9488] border-teal-200 hover:bg-teal-50 h-9"
                      onClick={() => router.push("/customer/profile/refunds")}
                    >
                      View Refund
                    </Button>
                  )}
                  {["placed", "confirmed", "packed", "shipped"].includes(order.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50 h-9"
                      onClick={() => handleCancel(order.id, order.status)}
                    >
                      <XCircle className="w-3 h-3" /> Cancel
                    </Button>
                  )}
                </div>

                {/* Rate & Review — one button per item for delivered orders */}
                {order.status === "delivered" && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-gray-500 self-center font-medium">Review:</span>
                    {order.items.map(({ product }) => (
                      <Button
                        key={product.id}
                        size="sm"
                        variant="ghost"
                        className="text-xs gap-1 text-amber-600 hover:bg-amber-50 border border-amber-200 h-8 px-2"
                        onClick={() => router.push(`/customer/products/${product.id}?tab=reviews`)}
                      >
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {product.name.length > 20 ? product.name.slice(0, 20) + "…" : product.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
