"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageCircle, X, Bot, Send, RotateCcw, ExternalLink } from "lucide-react";
import { useAuthStore, useOrderStore } from "@/lib/store";

/* ─── Types ─────────────────────────────────────────────────── */
interface Msg {
  id: number;
  from: "bot" | "user";
  text: string;
  link?: { text: string; href: string };
  orders?: { id: string; status: string; total: number; date: string }[];
}
interface Chip { label: string; key: string }
interface QANode {
  answer: string;
  link?: { text: string; href: string };
  chips: Chip[];
}

/* ─── Customer Q&A ───────────────────────────────────────────── */
const CQA: Record<string, QANode> = {
  track_order: {
    answer: "To track your order, visit My Orders in your profile. Each order shows a live status timeline and the estimated delivery date.",
    link: { text: "View My Orders", href: "/customer/profile/orders" },
    chips: [
      { label: "Order is delayed", key: "order_delayed" },
      { label: "How long does delivery take?", key: "delivery_time" },
      { label: "Cancel my order", key: "cancel_order" },
    ],
  },
  order_delayed: {
    answer: "Delays are usually due to high demand or courier issues and resolve within 1–2 business days. If it's been more than 10 days past the estimate, we'll refund you in full.",
    chips: [
      { label: "Order still not arrived (7+ days)", key: "escalate" },
      { label: "Cancel this order", key: "cancel_order" },
      { label: "Back to main menu", key: "__home__" },
    ],
  },
  delivery_time: {
    answer: "Standard delivery takes 3–7 business days. Express shipping is 1–2 days. Remote areas may take up to 10 days.",
    chips: [
      { label: "Change delivery address", key: "change_address" },
      { label: "Track my order", key: "track_order" },
    ],
  },
  cancel_order: {
    answer: "You can cancel from My Orders before the order is packed — you'll get a **100% refund** to your Bigpool Wallet instantly.\n\nPer our **Terms & Conditions**, free cancellation is available before packing begins. A partial deduction applies once packing or shipping has started.",
    link: { text: "Go to My Orders", href: "/customer/profile/orders" },
    chips: [
      { label: "Already packed — what's deducted?", key: "cancel_packed" },
      { label: "Already shipped — what's deducted?", key: "cancel_shipped" },
      { label: "Where does my refund go?", key: "wallet_refund" },
      { label: "View my orders", key: "__my_orders__" },
    ],
  },
  cancel_packed: {
    answer: "Per our **Terms & Conditions**, if your order is already packed, cancellation incurs a **20% deduction**. Example: ₹500 order → ₹400 refunded to your Bigpool Wallet. The ₹100 covers packing & handling costs.",
    link: { text: "Check Wallet", href: "/customer/profile/wallet" },
    chips: [
      { label: "Still want to cancel?", key: "escalate_cancel" },
      { label: "Where does refund go?", key: "wallet_refund" },
    ],
  },
  cancel_shipped: {
    answer: "Per our **Terms & Conditions**, if your order is shipped or out-for-delivery, cancellation incurs a **50% deduction**. Example: ₹1000 order → ₹500 refunded to Wallet. Alternatively, refuse the delivery and we'll process the same refund.",
    link: { text: "Check Wallet", href: "/customer/profile/wallet" },
    chips: [
      { label: "Still want to cancel?", key: "escalate_cancel" },
      { label: "Where does refund go?", key: "wallet_refund" },
      { label: "How to use wallet balance?", key: "use_wallet" },
    ],
  },
  escalate_cancel: {
    answer: "To proceed with cancellation, go to My Orders, select your order, and tap 'Cancel Order'. Our support team reviews edge cases — if you feel the deduction is unfair, contact us.",
    link: { text: "Go to My Orders", href: "/customer/profile/orders" },
    chips: [
      { label: "Contact support", key: "contact_support" },
      { label: "Back to main menu", key: "__home__" },
    ],
  },
  wallet_refund: {
    answer: "You have 2 refund options:\n\n**1. Instant → Bigpool Wallet** — credited within 2 minutes. Use on any future order.\n**2. Original account** — back to the card/UPI/bank you paid with. Takes 3–7 business days depending on your bank.\n\nFor COD orders there is nothing to refund as no money was taken.",
    link: { text: "View Wallet", href: "/customer/profile/wallet" },
    chips: [
      { label: "Refund to card/UPI timeline?", key: "refund_timeline" },
      { label: "How to use wallet balance?", key: "use_wallet" },
      { label: "Back to main menu", key: "__home__" },
    ],
  },
  use_wallet: {
    answer: "At checkout, select 'Bigpool Wallet' as payment. Your balance is deducted instantly — no UPI or card needed. If your wallet balance is less than the order total, you can pay the remaining via UPI or card.",
    link: { text: "Shop Now", href: "/customer/products" },
    chips: [{ label: "Back to main menu", key: "__home__" }],
  },
  contact_support: {
    answer: "Our support team is available Mon–Sat, 9 AM – 8 PM. For order disputes or escalations, email us at devarajanchandu@gmail.com. Most issues are resolved within 2 hours by our admin team.",
    chips: [{ label: "Back to main menu", key: "__home__" }],
  },
  return_product: {
    answer: "Per Bigpool's **Terms & Conditions**, returns are accepted within **7 days of delivery**. Go to My Orders → select item → Request Return. Pickup scheduled within 48 hours.\n\nItems must be unused, in original packaging, with all tags intact.",
    link: { text: "Start Return", href: "/customer/profile/refunds" },
    chips: [
      { label: "Refund timeline", key: "refund_timeline" },
      { label: "Product is damaged", key: "damaged_product" },
      { label: "Wrong item received", key: "wrong_item" },
      { label: "View my orders", key: "__my_orders__" },
    ],
  },
  damaged_product: {
    answer: "We're sorry! Raise a return request immediately with photos. We process an express replacement or full refund within 24 hours for damaged items — no deductions apply for seller fault.",
    link: { text: "Report Damage", href: "/customer/profile/refunds" },
    chips: [{ label: "Refund timeline", key: "refund_timeline" }],
  },
  wrong_item: {
    answer: "If you received the wrong item, raise a return request and select 'Wrong item received'. We'll send the correct item or refund you right away.",
    link: { text: "Report Issue", href: "/customer/profile/refunds" },
    chips: [{ label: "Refund timeline", key: "refund_timeline" }],
  },
  refund_status: {
    answer: "Check your refund status in Refunds & Returns under your profile. Approved refunds go back to your original payment method.",
    link: { text: "Check Refunds", href: "/customer/profile/refunds" },
    chips: [
      { label: "Refund timeline", key: "refund_timeline" },
      { label: "Refund not received", key: "refund_not_received" },
    ],
  },
  refund_timeline: {
    answer: "Refund timelines by method:\n\n**Bigpool Wallet** → Instant (< 2 min)\n**UPI (GPay / PhonePe)** → 1–3 business days\n**Debit / Credit Card** → 5–7 business days\n**Net Banking** → 5–7 business days\n**COD** → No refund (no money was taken)\n\nWe process all refunds within 24 hours of approval. Bank/card timelines are on the bank's end.",
    chips: [
      { label: "Get refund instantly to wallet", key: "wallet_refund" },
      { label: "Refund not received yet", key: "refund_not_received" },
      { label: "Back to main menu", key: "__home__" },
    ],
  },
  refund_not_received: {
    answer: "If the refund hasn't arrived after 10 business days, contact your bank with the transaction reference from your Refunds page. Banks occasionally delay credit.",
    link: { text: "View Refund Details", href: "/customer/profile/refunds" },
    chips: [{ label: "Back to main menu", key: "__home__" }],
  },
  payment_failed: {
    answer: "If payment failed and money was deducted, it auto-refunds in 3–5 business days. Try: retry with UPI, check card limits, or use a different browser.",
    chips: [
      { label: "Which payment methods?", key: "payment_methods" },
      { label: "Money deducted, no order", key: "deducted_no_order" },
    ],
  },
  payment_methods: {
    answer: "We accept UPI (GPay, PhonePe, Paytm), Cards (Visa, Mastercard, RuPay), Net Banking, Wallets, and Cash on Delivery for eligible orders.",
    chips: [
      { label: "COD availability", key: "cod_availability" },
      { label: "Payment failed help", key: "payment_failed" },
    ],
  },
  deducted_no_order: {
    answer: "If money was deducted but no order placed, the amount auto-reverses within 3–5 business days. If it doesn't, contact your bank after this window.",
    chips: [{ label: "Back to main menu", key: "__home__" }],
  },
  cod_availability: {
    answer: "COD is available for orders below ₹10,000 in most pin codes. Check at checkout — it shows whether COD is available for your address.",
    chips: [{ label: "Back to main menu", key: "__home__" }],
  },
  use_coupon: {
    answer: "Enter the coupon code in the 'Coupon Code' field on the checkout page before placing your order. Codes are case-sensitive and single-use.",
    link: { text: "Go to Cart", href: "/customer/cart" },
    chips: [
      { label: "Coupon not working", key: "coupon_not_working" },
      { label: "Where to find coupons?", key: "find_coupons" },
    ],
  },
  coupon_not_working: {
    answer: "Coupons may fail if: they've expired, minimum order value isn't met, or the product isn't eligible. Check the coupon terms on the product page.",
    chips: [
      { label: "Find valid coupons", key: "find_coupons" },
      { label: "Back to main menu", key: "__home__" },
    ],
  },
  find_coupons: {
    answer: "Find active coupons on Homepage banners, category pages, or products with a 🔥 Live Sale badge. Sellers add their own coupon codes to those products.",
    link: { text: "Browse Deals", href: "/" },
    chips: [{ label: "How to use coupon", key: "use_coupon" }],
  },
  change_address: {
    answer: "You can update the delivery address from My Orders only if the order hasn't been packed yet. Once packed, the address is locked.",
    link: { text: "My Orders", href: "/customer/profile/orders" },
    chips: [
      { label: "Already packed or shipped", key: "cancel_shipped" },
      { label: "Back to main menu", key: "__home__" },
    ],
  },
  escalate: {
    answer: "For orders delayed beyond 10 days, raise a refund request. We'll process a full refund within 2 business days once verified.",
    link: { text: "Raise Refund", href: "/customer/profile/refunds" },
    chips: [{ label: "Back to main menu", key: "__home__" }],
  },
};

/* ─── Seller Q&A ─────────────────────────────────────────────── */
const SQA: Record<string, QANode> = {
  list_product: {
    answer: "Go to Vendor → Products → Add New Product. Fill in name, price, category, and description. You can also add images and request a 🔥 Live Sale badge with a coupon code.",
    link: { text: "Add Product", href: "/vendor/products" },
    chips: [
      { label: "Add coupon / Live Sale badge", key: "live_sale" },
      { label: "Image requirements", key: "image_requirements" },
      { label: "Pricing tips", key: "pricing_tips" },
    ],
  },
  image_requirements: {
    answer: "Product images should be PNG or JPG, max 5MB each, up to 5 images. White/neutral background gives the best results and higher customer trust.",
    chips: [
      { label: "List a product", key: "list_product" },
      { label: "Back to seller menu", key: "__home__" },
    ],
  },
  pricing_tips: {
    answer: "Set a Selling Price (what customers pay) and optionally an Original Price (strikethrough price) to show a discount percentage. Bigpool charges 0% commission for the first 3 months.",
    chips: [
      { label: "Request promotion", key: "request_promotion" },
      { label: "Payout info", key: "payout_info" },
    ],
  },
  update_tracking: {
    answer: "Go to Vendor → Orders and open any shipped order. Enter the courier name, AWB/tracking number, and paste the courier tracking URL. Customers see live updates.",
    link: { text: "Manage Orders", href: "/vendor/orders" },
    chips: [
      { label: "Supported couriers", key: "courier_list" },
      { label: "How to mark as delivered", key: "mark_delivered" },
    ],
  },
  courier_list: {
    answer: "We support all major couriers: Delhivery, BlueDart, DTDC, Ekart, Xpressbees, Speed Post, FedEx, Shadowfax, Shiprocket, and more. Paste the tracking URL directly from their site.",
    chips: [
      { label: "Update tracking info", key: "update_tracking" },
      { label: "Back to seller menu", key: "__home__" },
    ],
  },
  mark_delivered: {
    answer: "Once delivered, click 'Mark as Delivered' in Vendor → Orders. This triggers payment processing and completes the order cycle. Customer gets a delivery notification.",
    link: { text: "Vendor Orders", href: "/vendor/orders" },
    chips: [
      { label: "Payout info", key: "payout_info" },
      { label: "Customer not confirming receipt", key: "not_confirming" },
    ],
  },
  not_confirming: {
    answer: "If the courier confirms delivery but customer hasn't acknowledged, the system auto-confirms delivery after 7 days from the courier delivery date. Payout follows automatically.",
    chips: [{ label: "Payout info", key: "payout_info" }],
  },
  request_promotion: {
    answer: "Go to Vendor → Promotions to request Homepage Banner (₹5,000/wk), Featured Listing (₹2,500/wk), Search Boost (₹1,500/wk), or Sponsored Ad (₹3,000/wk). Admin reviews within 24 hours.",
    link: { text: "Request Promotion", href: "/vendor/promotions" },
    chips: [
      { label: "Live Sale badge (free)", key: "live_sale" },
      { label: "Approval timeline", key: "approval_time" },
    ],
  },
  approval_time: {
    answer: "All promotion and Live Sale requests are reviewed within 24 hours by our admin team. Status updates appear in your Promotions dashboard.",
    chips: [
      { label: "Request promotion", key: "request_promotion" },
      { label: "Back to seller menu", key: "__home__" },
    ],
  },
  live_sale: {
    answer: "When listing a product, check 'Request Live Sale badge' and enter a coupon code (e.g. SAVE20). Once admin approves, your product shows a 🔥 Live Sale badge. It's completely free!",
    link: { text: "Add Product with Coupon", href: "/vendor/products" },
    chips: [
      { label: "Approval timeline", key: "approval_time" },
      { label: "Can I change coupon code?", key: "change_coupon" },
    ],
  },
  change_coupon: {
    answer: "Once submitted, the coupon code can't be edited. Submit a new promotion request with the updated code. The old one can be left to expire if not yet approved.",
    chips: [
      { label: "Request new promotion", key: "request_promotion" },
      { label: "Back to seller menu", key: "__home__" },
    ],
  },
  payout_info: {
    answer: "Payouts are processed every Friday for all delivered orders of the previous week. Amount is transferred to your registered bank account after a 2% platform fee.",
    chips: [
      { label: "Update bank account", key: "update_bank" },
      { label: "Check payout history", key: "payout_history" },
    ],
  },
  update_bank: {
    answer: "To update your bank account, go to Vendor → Dashboard → Bank Details. Changes take 2–3 business days to verify before payouts resume.",
    chips: [
      { label: "Payout info", key: "payout_info" },
      { label: "Back to seller menu", key: "__home__" },
    ],
  },
  payout_history: {
    answer: "Payout history is available in Vendor → Analytics. You can see a full breakdown of earnings, deductions, and transfer dates there.",
    link: { text: "View Analytics", href: "/vendor/analytics" },
    chips: [{ label: "Back to seller menu", key: "__home__" }],
  },
  order_management: {
    answer: "In Vendor → Orders, you can view all incoming orders, update status (Confirm → Pack → Ship → Deliver), add tracking information, and see shipment details.",
    link: { text: "Manage Orders", href: "/vendor/orders" },
    chips: [
      { label: "Update tracking", key: "update_tracking" },
      { label: "Order cancellations", key: "order_cancelled" },
    ],
  },
  order_cancelled: {
    answer: "When a customer cancels, you'll see 'Cancelled' status in Vendor Orders. Reserved inventory is automatically restored and funds refunded to the customer.",
    chips: [
      { label: "Prevent cancellations", key: "prevent_cancellations" },
      { label: "Back to seller menu", key: "__home__" },
    ],
  },
  prevent_cancellations: {
    answer: "To reduce cancellations: maintain accurate stock counts, ship within 24 hours of confirmation, and write accurate product descriptions. Late shipping is the #1 reason customers cancel.",
    chips: [
      { label: "Update tracking", key: "update_tracking" },
      { label: "Back to seller menu", key: "__home__" },
    ],
  },
};

/* ─── Guest Q&A ──────────────────────────────────────────────── */
const GQA: Record<string, QANode> = {
  create_account: {
    answer: "Creating an account is free! Click Sign In → Create Account in the top nav bar. You need a valid email and password — no phone number required.",
    link: { text: "Create Account", href: "/customer/signup" },
    chips: [
      { label: "Payment methods accepted", key: "payment_methods_g" },
      { label: "Sell on Bigpool", key: "sell_on_bigpool" },
    ],
  },
  payment_methods_g: {
    answer: "We accept UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, Wallets, and Cash on Delivery. All payments use 256-bit encryption.",
    chips: [
      { label: "Create account", key: "create_account" },
      { label: "Return policy", key: "return_policy_g" },
    ],
  },
  sell_on_bigpool: {
    answer: "Become a seller with our Vendor Application. You need: business details, GSTIN, and bank account info. 0% commission for the first 3 months — zero upfront cost!",
    link: { text: "Apply as Vendor", href: "/vendor/application/signup" },
    chips: [
      { label: "Create customer account", key: "create_account" },
      { label: "Seller benefits", key: "seller_benefits_g" },
    ],
  },
  return_policy_g: {
    answer: "Most products can be returned within 7 days of delivery per our Terms & Conditions. Create an account, go to My Orders, and raise a return request. Refunds in 5–7 business days.",
    chips: [
      { label: "Create account", key: "create_account" },
      { label: "Back to main menu", key: "__home__" },
    ],
  },
  seller_benefits_g: {
    answer: "Bigpool offers: 0% commission for 3 months, promotion tools, analytics dashboard, weekly payouts, Live Sale coupon badges, and a dedicated seller support team.",
    link: { text: "Apply Now", href: "/vendor/application/signup" },
    chips: [{ label: "Back to main menu", key: "__home__" }],
  },
};

/* ─── Initial chips per role ─────────────────────────────────── */
const QUICK: Record<string, Chip[]> = {
  customer: [
    { label: "📦 Where is my order?", key: "track_order" },
    { label: "📋 My Orders", key: "__my_orders__" },
    { label: "↩️ Return a product", key: "return_product" },
    { label: "💰 Refund status", key: "refund_status" },
    { label: "❌ Cancel my order", key: "cancel_order" },
    { label: "💳 Payment issue", key: "payment_failed" },
    { label: "🏷️ Use a coupon", key: "use_coupon" },
  ],
  seller: [
    { label: "📦 List a product", key: "list_product" },
    { label: "🚚 Update tracking", key: "update_tracking" },
    { label: "📢 Request promotion", key: "request_promotion" },
    { label: "🔥 Live Sale badge", key: "live_sale" },
    { label: "💵 Payout info", key: "payout_info" },
    { label: "📋 Order management", key: "order_management" },
    { label: "🛍️ My Purchases", key: "__my_orders__" },
    { label: "❌ Cancel my order", key: "cancel_order" },
    { label: "↩️ Return my order", key: "return_product" },
  ],
  guest: [
    { label: "🆕 Create account", key: "create_account" },
    { label: "💳 Payment methods", key: "payment_methods_g" },
    { label: "🏪 Sell on Bigpool", key: "sell_on_bigpool" },
    { label: "↩️ Return policy", key: "return_policy_g" },
  ],
};

/* ─── Keyword matcher ────────────────────────────────────────── */
const KEYWORDS: [string, string[]][] = [
  ["track_order", ["track", "where order", "order status", "shipping", "out for delivery", "delivered yet"]],
  ["return_product", ["return", "send back", "pickup"]],
  ["refund_status", ["refund", "money back", "reimburs"]],
  ["cancel_order", ["cancel", "stop order"]],
  ["payment_failed", ["payment fail", "payment issue", "not paid", "error pay"]],
  ["use_coupon", ["coupon", "promo code", "discount code", "voucher"]],
  ["change_address", ["address", "change location", "delivery address"]],
  ["damaged_product", ["damaged", "broken", "defective", "not working"]],
  ["wrong_item", ["wrong item", "wrong product", "incorrect item"]],
  ["__my_orders__", ["my order", "show order", "my purchase", "order list", "see order", "view order"]],
  // seller
  ["list_product", ["list product", "add product", "upload product", "new listing", "create product"]],
  ["update_tracking", ["tracking", "track number", "courier", "awb", "update shipment"]],
  ["request_promotion", ["promotion", "advertise", "banner", "boost", "featured", "sponsored"]],
  ["live_sale", ["live sale", "sale badge", "flash sale", "coupon code"]],
  ["payout_info", ["payout", "when paid", "commission", "earnings", "payment receive"]],
  ["order_management", ["order manage", "incoming order", "all order"]],
  // guest
  ["create_account", ["create account", "sign up", "register", "new account"]],
  ["sell_on_bigpool", ["sell", "become seller", "vendor"]],
];

function findMatch(text: string): string | null {
  const lower = text.toLowerCase().trim();
  if (/^(hi+|hello+|hey+|hiya|howdy|help|sup|good\s*(morning|afternoon|evening|day)|what can you do|what do you do)/.test(lower)) {
    return "__greeting__";
  }
  for (const [key, kws] of KEYWORDS) {
    if (kws.some((kw) => lower.includes(kw))) return key;
  }
  return null;
}

/* ─── Status badge colour ────────────────────────────────────── */
function statusChipColor(status: string) {
  const map: Record<string, string> = {
    placed: "bg-gray-100 text-gray-700",
    confirmed: "bg-blue-100 text-blue-700",
    packed: "bg-indigo-100 text-indigo-700",
    shipped: "bg-cyan-100 text-cyan-700",
    out_for_delivery: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-purple-100 text-purple-700",
  };
  return map[status] || "bg-gray-100 text-gray-700";
}

/* ─── Markdown renderer (bold + line breaks) ─────────────────── */
function BotText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, lineIdx) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={lineIdx}>
            {lineIdx > 0 && <br />}
            {parts.map((p, i) =>
              i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>
            )}
          </span>
        );
      })}
    </>
  );
}

/* ─── Inline orders list ─────────────────────────────────────── */
function BotOrders({ orders }: { orders: NonNullable<Msg["orders"]> }) {
  return (
    <div className="mt-2 space-y-1.5">
      {orders.map((o) => (
        <Link
          key={o.id}
          href={`/customer/profile/orders/${o.id}`}
          className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:bg-teal-50 hover:border-teal-200 transition-colors"
        >
          <div>
            <p className="text-[11px] font-mono text-gray-500 leading-none">{o.id.length > 20 ? o.id.slice(0, 18) + "…" : o.id}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{o.date}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${statusChipColor(o.status)}`}>
              {o.status.replace(/_/g, " ")}
            </span>
            <span className="text-xs font-bold text-gray-800">₹{o.total.toLocaleString()}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────── */
export default function ChatSupport() {
  const { user } = useAuthStore();
  const { orders } = useOrderStore();

  const role: "customer" | "seller" | "guest" =
    user?.role === "seller" ? "seller" : user?.role === "customer" ? "customer" : "guest";
  const qa = role === "seller" ? SQA : role === "customer" ? CQA : GQA;
  const quickChips = QUICK[role];

  const userOrders = orders.filter((o) => o.customerId === user?.id).slice().reverse();
  const resolveNode = (key: string): QANode | null => qa[key] || CQA[key] || GQA[key] || null;

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addMsg = useCallback((msg: Omit<Msg, "id">) => {
    setMsgs((prev) => [...prev, { ...msg, id: Date.now() + Math.random() }]);
  }, []);

  /* ── Open / init ── */
  useEffect(() => {
    if (!open) return;
    if (msgs.length > 0) return;
    const name = user?.name?.split(" ")[0] ?? "there";
    const greeting =
      role === "seller"
        ? `Hi ${name}! 👋 I'm Bigpool's support assistant. I can help with your seller account or your own purchases. What can I help you with today?`
        : role === "customer"
        ? `Hi ${name}! 👋 I'm your Bigpool support assistant. I can help with orders, returns, refunds, and more. What can I help you with?`
        : "Welcome to Bigpool! 👋 I'm your support assistant. How can I help?";
    addMsg({ from: "bot", text: greeting });
    setChips(quickChips);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, typing]);

  /* ── Handle chip click ── */
  const handleChip = (chip: Chip) => {
    /* ── home ── */
    if (chip.key === "__home__") {
      addMsg({ from: "user", text: "← Main menu" });
      setTimeout(() => {
        addMsg({ from: "bot", text: "Sure! What else can I help you with?" });
        setChips(quickChips);
      }, 300);
      return;
    }

    /* ── my orders ── */
    if (chip.key === "__my_orders__") {
      addMsg({ from: "user", text: "My Orders" });
      setChips([]);
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        // read fresh from store — avoids stale closure if store hydrates after first render
        const currentUser = useAuthStore.getState().user;
        const allOrders = useOrderStore.getState().orders;
        const fresh = allOrders.filter((o) => o.customerId === currentUser?.id).slice().reverse();
        const recent = fresh.slice(0, 5);
        if (recent.length === 0) {
          addMsg({
            from: "bot",
            text: "You haven't placed any orders yet. Browse our products to get started!",
            link: { text: "Shop Now", href: "/customer/products" },
          });
          setChips([{ label: "Back to main menu", key: "__home__" }]);
        } else {
          addMsg({
            from: "bot",
            text: `Here are your **${recent.length}** most recent order${recent.length > 1 ? "s" : ""}. Tap any order to track it:`,
            orders: recent.map((o) => ({ id: o.id, status: o.status, total: o.total, date: o.createdAt })),
          });
          const orderChips: Chip[] = [];
          recent.slice(0, 3).forEach((o) => {
            if (!["delivered", "cancelled", "returned"].includes(o.status)) {
              orderChips.push({ label: `❌ Cancel ${o.id.slice(-6)}`, key: `cancel_specific_${o.id}` });
            }
            if (o.status === "delivered") {
              orderChips.push({ label: `↩️ Return ${o.id.slice(-6)}`, key: `return_specific_${o.id}` });
            }
          });
          orderChips.push({ label: "📦 All Orders page", key: "__orders_page__" });
          orderChips.push({ label: "Back to menu", key: "__home__" });
          setChips(orderChips);
        }
      }, 650);
      return;
    }

    /* ── orders page link ── */
    if (chip.key === "__orders_page__") {
      addMsg({ from: "user", text: "View all orders" });
      setTimeout(() => {
        addMsg({ from: "bot", text: "Here's your full orders history:", link: { text: "My Orders", href: "/customer/profile/orders" } });
        setChips([{ label: "Back to menu", key: "__home__" }]);
      }, 300);
      return;
    }

    /* ── cancel specific order ── */
    if (chip.key.startsWith("cancel_specific_")) {
      const orderId = chip.key.replace("cancel_specific_", "");
      addMsg({ from: "user", text: `Cancel order ${orderId.slice(-8)}` });
      setChips([]);
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        const order = useOrderStore.getState().orders.find((o) => o.id === orderId);
        const status = order?.status ?? "";
        if (status === "placed" || status === "confirmed") {
          addMsg({
            from: "bot",
            text: `Order **${orderId.slice(-12)}** hasn't been packed yet — you can cancel it for a **100% refund** to your Bigpool Wallet.\n\nPer our **Terms & Conditions**, free cancellation is available before packing begins. Tap the order below and choose 'Cancel Order'.`,
            link: { text: "Go to Order", href: `/customer/profile/orders/${orderId}` },
          });
        } else if (status === "packed") {
          addMsg({
            from: "bot",
            text: `Order **${orderId.slice(-12)}** is already packed. Per our **Terms & Conditions**, a **20% deduction** applies at this stage (to cover packing costs). Proceed to the order page to confirm cancellation.`,
            link: { text: "Go to Order", href: `/customer/profile/orders/${orderId}` },
          });
        } else {
          addMsg({
            from: "bot",
            text: `Order **${orderId.slice(-12)}** is currently **${(status || "unknown").replace(/_/g, " ")}**. Per our **Terms & Conditions**, cancellation at this stage may not be possible or may incur a significant deduction. Contact support for assistance.`,
            link: { text: "Go to Order", href: `/customer/profile/orders/${orderId}` },
          });
        }
        setChips([
          { label: "↩ Back to my orders", key: "__my_orders__" },
          { label: "Contact support", key: "contact_support" },
        ]);
      }, 650);
      return;
    }

    /* ── return specific order ── */
    if (chip.key.startsWith("return_specific_")) {
      const orderId = chip.key.replace("return_specific_", "");
      addMsg({ from: "user", text: `Return order ${orderId.slice(-8)}` });
      setChips([]);
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        addMsg({
          from: "bot",
          text: `To return order **${orderId.slice(-12)}**, open the order detail page and tap 'Return / Refund'.\n\nPer Bigpool's **Terms & Conditions**, returns are accepted within **7 days of delivery**. Items must be unused, in original packaging. Pickup scheduled within 48 hours. Refund processed in 5–7 business days.`,
          link: { text: "View Order", href: `/customer/profile/orders/${orderId}` },
        });
        setChips([
          { label: "Refund timeline", key: "refund_timeline" },
          { label: "↩ Back to my orders", key: "__my_orders__" },
        ]);
      }, 650);
      return;
    }

    /* ── normal chip ── */
    addMsg({ from: "user", text: chip.label.replace(/^[^\s]*\s/, "") });
    setChips([]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const node = resolveNode(chip.key);
      if (node) {
        addMsg({ from: "bot", text: node.answer, link: node.link });
        setChips(node.chips);
      } else {
        addMsg({ from: "bot", text: "I couldn't find info on that. Please choose a topic below." });
        setChips(quickChips);
      }
    }, 650);
  };

  /* ── Handle text send ── */
  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    addMsg({ from: "user", text });
    setChips([]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const key = findMatch(text);
      if (key === "__greeting__") {
        const name = user?.name?.split(" ")[0] ?? "there";
        addMsg({
          from: "bot",
          text: `Hi ${name}! 👋 I can help you with orders, returns, cancellations, refunds, payments, coupons, and more. Choose a topic below or type your question!`,
        });
        setChips(quickChips);
        return;
      }
      if (key === "__my_orders__") {
        handleChip({ label: "My Orders", key: "__my_orders__" });
        return;
      }
      const node = key ? resolveNode(key) : null;
      if (node) {
        addMsg({ from: "bot", text: node.answer, link: node.link });
        setChips(node.chips);
      } else {
        addMsg({ from: "bot", text: "I couldn't find a match for that. Try choosing one of the topics below or rephrase your question." });
        setChips(quickChips);
      }
    }, 700);
  };

  const handleClose = () => {
    setOpen(false);
    setMsgs([]);
    setChips([]);
    setInput("");
    setTyping(false);
  };

  const roleLabel = role === "seller" ? "Bigpool Support" : role === "customer" ? "Customer Support" : "Bigpool Support";
  const roleColor = role === "seller" ? "bg-indigo-600" : "bg-[#0d9488]";
  const chipBorderClass = roleColor === "bg-indigo-600"
    ? "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
    : "border-teal-200 text-teal-700 hover:bg-teal-50";
  const linkTextClass = roleColor === "bg-indigo-600" ? "text-indigo-600" : "text-[#0d9488]";

  return (
    <>
      {/* ── Chat window ── */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-200 bg-white">
          {/* Header */}
          <div className={`${roleColor} px-4 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              <div className="bg-white/20 rounded-full p-1.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none">{roleLabel}</p>
                <p className="text-white/70 text-[11px] mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 align-middle" />
                  Always online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setMsgs([]); setChips([]); setTyping(false); }}
                className="text-white/70 hover:text-white transition-colors p-1"
                title="Reset chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50" style={{ maxHeight: 360 }}>
            {msgs.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.from === "bot" && (
                  <div className={`${roleColor} rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mt-0.5`}>
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.from === "user" ? "order-first" : ""}`}>
                  <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.from === "user"
                      ? `${roleColor} text-white rounded-tr-sm`
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                  }`}>
                    {msg.from === "bot" ? <BotText text={msg.text} /> : msg.text}
                    {msg.orders && <BotOrders orders={msg.orders} />}
                  </div>
                  {msg.link && (
                    <Link
                      href={msg.link.href}
                      className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${linkTextClass} hover:underline`}
                    >
                      {msg.link.text} <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex justify-start gap-2">
                <div className={`${roleColor} rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center`}>
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick-reply chips */}
          {chips.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-white flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => handleChip(chip)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${chipBorderClass}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your question..."
              className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-[#0d9488] transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`${roleColor} text-white rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── FAB button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-4 right-4 z-50 ${roleColor} text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-2 ${open ? "rounded-full w-12 h-12 justify-center" : "rounded-full px-4 h-12"}`}
        aria-label="Open support chat"
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <MessageCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap">Ask Agent</span>
          </>
        )}
      </button>
    </>
  );
}
