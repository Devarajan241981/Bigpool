"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tag, Copy, CheckCheck, Gift, Ticket, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useHasHydrated, useVoucherStore, useCashbackStore } from "@/lib/store";
import { toast } from "sonner";
import type { Voucher } from "@/lib/types";

function VoucherCard({ voucher }: { voucher: Voucher }) {
  const [copied, setCopied] = useState(false);
  const expired = new Date(voucher.validUntil) < new Date();
  const full = voucher.usedCount >= voucher.maxUses;
  const unavailable = expired || full || !voucher.active;
  const isDemo = voucher.createdBy === "mock";

  const copy = () => {
    if (isDemo) { toast.error("This is a demo coupon — not valid for real orders."); return; }
    navigator.clipboard.writeText(voucher.code).then(() => {
      setCopied(true);
      toast.success(`Copied "${voucher.code}" to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const typeLabel = {
    percentage: `${voucher.value}% OFF`,
    flat: `₹${voucher.value} OFF`,
    free_delivery: "FREE DELIVERY",
  }[voucher.type];

  const typeColor = {
    percentage: "bg-blue-500",
    flat: "bg-[#0d9488]",
    free_delivery: "bg-purple-500",
  }[voucher.type];

  return (
    <div className={`bg-white rounded-xl border-2 overflow-hidden transition-all relative ${
      isDemo ? "border-gray-200 opacity-70" :
      unavailable ? "opacity-50 border-gray-200" :
      "border-gray-200 hover:border-[#0d9488] hover:shadow-md"
    }`}>
      {/* Demo overlay banner */}
      {isDemo && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/60 backdrop-blur-[2px] rounded-xl absolute inset-0" />
          <div className="relative z-20 text-center px-4">
            <p className="text-white text-xs font-semibold">Demo Coupon</p>
            <p className="text-gray-300 text-[10px] mt-0.5">Only coupons from verified vendors are valid</p>
          </div>
        </div>
      )}

      {/* Ticket-style left band */}
      <div className="flex">
        <div className={`${typeColor} text-white flex items-center justify-center px-3 py-4 min-w-[80px] writing-mode-vertical`}>
          <Ticket className="w-5 h-5 mb-1 rotate-90" />
          <span className="text-xs font-bold tracking-wider text-center leading-tight">{typeLabel}</span>
        </div>

        {/* Dashed divider */}
        <div className="border-l-2 border-dashed border-gray-200" />

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-bold tracking-widest text-base ${isDemo ? "blur-sm select-none text-gray-900" : "text-gray-900"}`}>
                  {isDemo ? "XXXXXXXX" : voucher.code}
                </span>
                {isDemo && <Badge className="bg-gray-100 text-gray-500 text-[10px]">Demo</Badge>}
                {!isDemo && unavailable && (
                  <Badge className="bg-red-100 text-red-600 text-[10px]">
                    {expired ? "Expired" : full ? "Limit Reached" : "Inactive"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{voucher.description}</p>
            </div>
            <button
              onClick={copy}
              disabled={unavailable || isDemo}
              className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${unavailable || isDemo ? "opacity-40 cursor-not-allowed" : "hover:bg-teal-50 text-[#0d9488]"}`}
              title={isDemo ? "Demo coupon — not usable" : "Copy code"}
            >
              {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            {voucher.minOrderValue > 0 && (
              <span>Min order ₹{voucher.minOrderValue.toLocaleString()}</span>
            )}
            {voucher.maxDiscount && (
              <span>Max discount ₹{voucher.maxDiscount.toLocaleString()}</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Valid till {new Date(voucher.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          <div className="mt-3">
            {isDemo ? (
              <p className="text-[11px] text-gray-400 italic">Available once vendors add real coupons</p>
            ) : (
              <Link href="/customer/checkout">
                <Button size="sm" disabled={unavailable} className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs h-7 px-3">
                  Apply at checkout
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VouchersPage() {
  const { isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const router = useRouter();
  const { vouchers } = useVoucherStore();
  const { offers: cashbackOffers } = useCashbackStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push("/customer/login");
  }, [hasHydrated, isAuthenticated, router]);
  if (!hasHydrated || !isAuthenticated) return null;

  const active = vouchers.filter((v) => v.active && new Date(v.validUntil) >= new Date() && v.usedCount < v.maxUses);
  const inactive = vouchers.filter((v) => !v.active || new Date(v.validUntil) < new Date() || v.usedCount >= v.maxUses);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-50 rounded-lg">
          <Tag className="w-6 h-6 text-[#0d9488]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vouchers & Offers</h1>
          <p className="text-sm text-gray-500">Copy a code and apply it at checkout to save</p>
        </div>
      </div>

      {/* Cashback offers */}
      {cashbackOffers.filter((o) => o.active && new Date(o.validUntil) >= new Date()).length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-600" /> Cashback Offers
          </h2>
          <div className="grid gap-3">
            {cashbackOffers
              .filter((o) => o.active && new Date(o.validUntil) >= new Date())
              .map((offer) => (
                <div key={offer.id} className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <Gift className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-purple-800 text-sm">
                      {offer.percentage}% Cashback — up to ₹{offer.maxAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-600 mt-0.5">{offer.description}</p>
                    <p className="text-xs text-purple-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Credited to your wallet automatically after delivery. No code needed.
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Active vouchers */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          Available Vouchers <Badge className="ml-1 bg-teal-100 text-teal-700">{active.length}</Badge>
        </h2>
        {active.length > 0 ? (
          <div className="grid gap-4">
            {active.map((v) => <VoucherCard key={v.id} voucher={v} />)}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No active vouchers right now. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Expired / used */}
      {inactive.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Expired / Used Up</h2>
          <div className="grid gap-3">
            {inactive.map((v) => <VoucherCard key={v.id} voucher={v} />)}
          </div>
        </section>
      )}
    </div>
  );
}
