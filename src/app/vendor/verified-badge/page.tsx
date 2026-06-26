"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, CheckCircle, XCircle, Clock, ShieldCheck, AlertCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useHasHydrated, useBadgeStore, useOrderStore } from "@/lib/store";
import { toast } from "sonner";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const BADGE_FEE = 300;
const MIN_ORDERS_REQUIRED = 20;
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

export default function VerifiedBadgePage() {
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const { orders } = useOrderStore();
  const router = useRouter();
  const { requests, submit } = useBadgeStore();
  const [paying, setPaying] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "seller")) router.push("/vendor/login");
  }, [hasHydrated, isAuthenticated, user, router]);

  // Load Razorpay script
  useEffect(() => {
    if (document.getElementById("razorpay-script")) { setScriptReady(true); return; }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);
  }, []);

  if (!hasHydrated || !isAuthenticated || user?.role !== "seller") return null;

  // Check existing request
  const myRequest = requests.find((r) => r.sellerId === user!.id);

  const ordersSold = orders.filter((o) => o.status === "delivered").length;
  const eligible = ordersSold >= MIN_ORDERS_REQUIRED;

  const handleApply = () => {
    if (!eligible) {
      toast.error(`You need ${MIN_ORDERS_REQUIRED} delivered orders. You have ${ordersSold}.`);
      return;
    }
    if (!RAZORPAY_KEY) {
      toast.error("Payment gateway not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local");
      return;
    }
    if (!scriptReady) {
      toast.error("Payment SDK loading, please try again in a moment");
      return;
    }

    setPaying(true);
    const options = {
      key: RAZORPAY_KEY,
      amount: BADGE_FEE * 100, // paise
      currency: "INR",
      name: "Bigpool",
      description: "Verified Seller Badge — One-time fee",
      image: "",
      handler: (response: { razorpay_payment_id: string }) => {
        submit({
          sellerId: user!.id,
          sellerName: user!.name,
          sellerEmail: user!.email,
          businessName: user!.name,
          productsSold: ordersSold,
          razorpayPaymentId: response.razorpay_payment_id,
        });
        setPaying(false);
        toast.success("Payment successful! Badge request submitted for admin review.");
      },
      prefill: { name: user?.name, email: user?.email },
      theme: { color: "#0d9488" },
      modal: {
        ondismiss: () => setPaying(false),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", () => {
      setPaying(false);
      toast.error("Payment failed. Please try again.");
    });
    rzp.open();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <BadgeCheck className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Get Verified on Bigpool</h1>
        <p className="text-gray-500 text-sm">Build buyer trust with a Verified Seller Badge on your profile and all your products.</p>
      </div>

      {/* Current status */}
      {myRequest && (
        <div className={`rounded-xl border-2 p-5 mb-6 ${
          myRequest.status === "approved" ? "border-green-300 bg-green-50" :
          myRequest.status === "pending" ? "border-yellow-300 bg-yellow-50" :
          "border-red-300 bg-red-50"
        }`}>
          <div className="flex items-center gap-3">
            {myRequest.status === "approved" ? <CheckCircle className="w-6 h-6 text-green-600" /> :
             myRequest.status === "pending" ? <Clock className="w-6 h-6 text-yellow-600" /> :
             <XCircle className="w-6 h-6 text-red-600" />}
            <div>
              <p className={`font-semibold ${
                myRequest.status === "approved" ? "text-green-800" :
                myRequest.status === "pending" ? "text-yellow-800" : "text-red-800"
              }`}>
                {myRequest.status === "approved" ? "🎉 You are Verified!" :
                 myRequest.status === "pending" ? "Application Under Review" :
                 "Application Rejected"}
              </p>
              <p className={`text-xs mt-0.5 ${
                myRequest.status === "approved" ? "text-green-600" :
                myRequest.status === "pending" ? "text-yellow-600" : "text-red-600"
              }`}>
                {myRequest.status === "approved"
                  ? "Your Verified Badge is active. Customers can now see ✓ on your profile."
                  : myRequest.status === "pending"
                  ? "Admin will review within 2–3 business days. Applied: " + myRequest.appliedAt
                  : "Your application was rejected. Contact support for details."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">What you get with Verified Badge</h2>
        <div className="space-y-3">
          {[
            { icon: ShieldCheck, text: "✓ Blue tick on your seller profile and all product listings" },
            { icon: BadgeCheck, text: "Priority placement in search results (15% boost in visibility)" },
            { icon: Package, text: "Access to Bigpool's 'Verified Sellers' filter used by premium buyers" },
            { icon: CheckCircle, text: "Dedicated seller support with faster response time (< 4 hours)" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="bg-blue-50 rounded-lg p-1.5 flex-shrink-0">
                <item.icon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-gray-700">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Eligibility */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Eligibility Check</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAuthenticated ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
              <span className="text-sm text-gray-700">Approved seller account</span>
            </div>
            <Badge className={isAuthenticated ? "bg-green-100 text-green-700 text-xs" : "bg-red-100 text-red-700 text-xs"}>
              {isAuthenticated ? "✓ Met" : "✗ Not met"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {eligible ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-yellow-500" />}
              <span className="text-sm text-gray-700">Minimum {MIN_ORDERS_REQUIRED} delivered orders</span>
            </div>
            <Badge className={eligible ? "bg-green-100 text-green-700 text-xs" : "bg-yellow-100 text-yellow-700 text-xs"}>
              {ordersSold}/{MIN_ORDERS_REQUIRED} orders
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">No active policy violations</span>
            </div>
            <Badge className="bg-green-100 text-green-700 text-xs">✓ Met</Badge>
          </div>
        </div>

        {!eligible && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            You need {MIN_ORDERS_REQUIRED - ordersSold} more delivered orders to be eligible.{" "}
            <Link href="/vendor/orders" className="font-medium underline">Manage your orders →</Link>
          </div>
        )}
      </div>

      {/* CTA */}
      {!myRequest && (
        <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] rounded-xl p-6 text-center text-white">
          <p className="text-3xl font-extrabold mb-1">₹300</p>
          <p className="text-gray-400 text-sm mb-4">One-time, non-refundable fee · Secured via Razorpay</p>
          <Button
            className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold px-8 h-11 text-sm gap-2 w-full sm:w-auto"
            onClick={handleApply}
            disabled={paying || !eligible}
          >
            <BadgeCheck className="w-4 h-4" />
            {paying ? "Opening payment..." : eligible ? "Pay ₹300 & Apply for Badge" : `Need ${MIN_ORDERS_REQUIRED - ordersSold} more orders`}
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            By proceeding, you agree to our{" "}
            <Link href="/terms#verified-badge" className="text-[#0d9488] hover:underline">Badge Terms</Link>.
            Fee is non-refundable once paid.
          </p>
        </div>
      )}

      {myRequest?.status === "rejected" && (
        <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] rounded-xl p-6 text-center text-white">
          <p className="text-sm text-gray-400 mb-3">Contact our support team to understand the rejection reason and reapply.</p>
          <a href="mailto:sellers@bigpool.in" className="text-[#0d9488] text-sm hover:underline">sellers@bigpool.in</a>
        </div>
      )}
    </div>
  );
}
