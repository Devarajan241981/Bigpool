"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Package, RotateCcw, CreditCard, User, Store,
  ChevronDown, ChevronUp, MessageCircle, ArrowRight,
  Truck, Wallet, Tag, ShieldCheck,
} from "lucide-react";

interface FAQ {
  q: string;
  a: string;
  link?: { text: string; href: string };
}

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  color: string;
  faqs: FAQ[];
}

const SECTIONS: Section[] = [
  {
    id: "orders",
    icon: Package,
    title: "Orders & Tracking",
    color: "bg-blue-50 text-blue-600 border-blue-200",
    faqs: [
      {
        q: "Where is my order?",
        a: "Visit My Orders in your profile to see a live status timeline for every order — from placed to out-for-delivery. You'll also receive SMS and email updates at each step.",
        link: { text: "View My Orders", href: "/customer/profile/orders" },
      },
      {
        q: "How long does delivery take?",
        a: "Standard delivery is 3–7 business days. Express shipping arrives in 1–2 days. Remote PIN codes may take up to 10 days.",
      },
      {
        q: "My order is delayed — what do I do?",
        a: "Delays of 1–2 days are common during peak seasons. If your order is 7+ days past the estimated delivery date, raise a refund request and we'll process a full refund within 2 business days.",
        link: { text: "Raise Refund", href: "/customer/profile/refunds" },
      },
      {
        q: "Can I change my delivery address?",
        a: "Yes, but only before the order is packed. Go to My Orders → select your order → Edit Address. Once packed, the address is locked and can't be changed.",
        link: { text: "My Orders", href: "/customer/profile/orders" },
      },
    ],
  },
  {
    id: "cancel",
    icon: RotateCcw,
    title: "Cancellations & Returns",
    color: "bg-orange-50 text-orange-600 border-orange-200",
    faqs: [
      {
        q: "How do I cancel my order?",
        a: "Go to My Orders, select the order, and tap 'Cancel Order'. You can cancel for free before the order is packed. After packing, a deduction applies (see below).",
        link: { text: "My Orders", href: "/customer/profile/orders" },
      },
      {
        q: "What if my order is already packed?",
        a: "If already packed, cancellation incurs a 20% deduction to cover packing costs. Example: ₹500 order → ₹400 refunded to your Bigpool Wallet instantly.",
      },
      {
        q: "What if my order is shipped or out for delivery?",
        a: "Cancellation at this stage incurs a 50% deduction. Example: ₹1,000 order → ₹500 refunded to Wallet. Alternatively, you can refuse delivery and the same policy applies.",
      },
      {
        q: "How do I return a product?",
        a: "Returns are accepted within 7 days of delivery. Go to My Orders → select the item → Request Return. Pickup is scheduled within 48 hours of approval.",
        link: { text: "Start a Return", href: "/customer/profile/refunds" },
      },
      {
        q: "I received a damaged or wrong item. What now?",
        a: "Raise a return immediately with photos via My Orders. We process express replacement or full refund within 24 hours for damaged/wrong items.",
        link: { text: "Report Issue", href: "/customer/profile/refunds" },
      },
    ],
  },
  {
    id: "refunds",
    icon: Wallet,
    title: "Refunds & Wallet",
    color: "bg-green-50 text-green-600 border-green-200",
    faqs: [
      {
        q: "Where does my refund go?",
        a: "You have two options: (1) Instant refund to your Bigpool Wallet — credited in under 2 minutes. (2) Refund to your original payment method — 1–7 business days depending on the method.",
        link: { text: "View Wallet", href: "/customer/profile/wallet" },
      },
      {
        q: "How long does a refund take?",
        a: "Bigpool Wallet: instant (< 2 min). UPI (GPay/PhonePe): 1–3 business days. Debit/Credit Card: 5–7 business days. Net Banking: 5–7 business days. COD orders: no refund needed as no money was taken.",
      },
      {
        q: "What is Bigpool Wallet?",
        a: "Your Bigpool Wallet stores refund credits, cashback, and promotional credits. Use the balance at checkout instantly — no OTP or UPI PIN required. No expiry on wallet balance.",
        link: { text: "My Wallet", href: "/customer/profile/wallet" },
      },
      {
        q: "My refund hasn't arrived after 10 days. What do I do?",
        a: "Contact your bank with the transaction reference shown in your Refunds page. Banks occasionally delay credits. If the bank confirms nothing is pending, contact our support team.",
        link: { text: "Check Refunds", href: "/customer/profile/refunds" },
      },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Payments & Coupons",
    color: "bg-purple-50 text-purple-600 border-purple-200",
    faqs: [
      {
        q: "What payment methods are accepted?",
        a: "UPI (GPay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, Bigpool Wallet, and Cash on Delivery for eligible orders under ₹10,000.",
      },
      {
        q: "My payment failed but money was deducted. Help!",
        a: "Failed payment amounts auto-reverse within 3–5 business days to your original account. If it doesn't arrive by then, contact your bank with the transaction reference.",
      },
      {
        q: "How do I apply a coupon code?",
        a: "Enter the coupon code in the 'Coupon Code' field on the checkout page before placing your order. Codes are case-sensitive and single-use per account.",
        link: { text: "Go to Cart", href: "/customer/cart" },
      },
      {
        q: "Where do I find coupons?",
        a: "Active coupons appear on homepage banners, category pages, and on products with a 🔥 Live Sale badge. Each seller can add their own coupon codes to their products.",
        link: { text: "Browse Deals", href: "/" },
      },
    ],
  },
  {
    id: "account",
    icon: User,
    title: "Account & Profile",
    color: "bg-teal-50 text-teal-600 border-teal-200",
    faqs: [
      {
        q: "How do I create an account?",
        a: "Click 'Sign In → Create Account' in the top nav. You need a valid email and password — no phone number required. Takes under a minute.",
        link: { text: "Create Account", href: "/customer/signup" },
      },
      {
        q: "How do I reset my password?",
        a: "On the login page, click 'Forgot password?' and enter your email. You'll receive a reset link within 5 minutes. Check your spam folder if it doesn't arrive.",
        link: { text: "Login Page", href: "/customer/login" },
      },
      {
        q: "How do I update my delivery address?",
        a: "Go to Profile → Settings and update your default delivery address. You can also add a new address at checkout without changing your default.",
        link: { text: "My Profile", href: "/customer/profile" },
      },
    ],
  },
  {
    id: "sellers",
    icon: Store,
    title: "Seller / Vendor Help",
    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    faqs: [
      {
        q: "How do I become a seller on Bigpool?",
        a: "Apply via the Vendor Application form. You'll need business details, GSTIN, and bank account info. 0% commission for the first 3 months — completely free to start.",
        link: { text: "Apply as Vendor", href: "/vendor/application/signup" },
      },
      {
        q: "How do seller commissions work?",
        a: "Listing fee: <500 products = ₹10/mo, 500–999 = ₹40/mo, 1000+ = ₹70/mo. Transaction fee: orders <₹750 = ₹15, ₹750–₹1,999 = ₹30, ₹2,000+ = ₹100. All configurable by admin.",
        link: { text: "See Full Terms", href: "/terms#commissions" },
      },
      {
        q: "How do I update tracking info for my orders?",
        a: "Go to Vendor → Orders, open any shipped order, enter the courier name, AWB/tracking number, and paste the courier's tracking URL. Customers see live updates instantly.",
        link: { text: "Vendor Orders", href: "/vendor/orders" },
      },
      {
        q: "When do I get paid?",
        a: "Payouts are processed every Friday for all orders delivered in the previous week. Transferred to your registered bank account after a 2% platform fee deduction.",
      },
      {
        q: "What is the Verified Seller badge?",
        a: "A one-time ₹300 badge (via Razorpay) available to sellers with 20+ delivered orders. It increases customer trust and appears prominently on your products.",
        link: { text: "Get Verified", href: "/vendor/verified-badge" },
      },
    ],
  },
];

const POPULAR: FAQ[] = [
  { q: "Where is my order?", a: "Visit My Orders in your profile to see live tracking.", link: { text: "My Orders", href: "/customer/profile/orders" } },
  { q: "How to cancel an order?", a: "Go to My Orders and tap 'Cancel Order' before packing for a full refund.", link: { text: "My Orders", href: "/customer/profile/orders" } },
  { q: "How long does a refund take?", a: "Wallet: instant. UPI: 1–3 days. Card/Net Banking: 5–7 business days." },
  { q: "How do I apply a coupon?", a: "Enter the code at checkout in the 'Coupon Code' field before placing the order." },
  { q: "How to become a seller?", a: "Apply via the Vendor Application. 0% commission for the first 3 months.", link: { text: "Apply Now", href: "/vendor/application/signup" } },
  { q: "What payment methods are accepted?", a: "UPI, Cards, Net Banking, Bigpool Wallet, and Cash on Delivery." },
];

function AccordionItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left py-4 flex items-center justify-between gap-3 group"
      >
        <span className="text-sm font-medium text-gray-800 group-hover:text-[#0d9488] transition-colors">{faq.q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#0d9488] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="pb-4 text-sm text-gray-600 leading-relaxed">
          <p>{faq.a}</p>
          {faq.link && (
            <Link href={faq.link.href} className="inline-flex items-center gap-1 mt-2 text-[#0d9488] font-medium hover:underline text-xs">
              {faq.link.text} <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const searchLower = search.toLowerCase();
  const searchResults = search.length > 1
    ? SECTIONS.flatMap((s) =>
        s.faqs
          .filter((f) => f.q.toLowerCase().includes(searchLower) || f.a.toLowerCase().includes(searchLower))
          .map((f) => ({ ...f, section: s.title }))
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1e293b] to-[#0f766e] py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-extrabold text-white mb-2">How can we help you?</h1>
          <p className="text-white/70 text-sm mb-6">Search FAQs or browse by category below. Our agent is always one tap away.</p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your question (e.g. cancel order, refund, tracking...)"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none shadow-lg focus:ring-2 focus:ring-[#0d9488]/40 text-gray-800"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Search results */}
        {search.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
              </p>
            </div>
            {searchResults.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-gray-500 mb-1">No FAQs matched your search.</p>
                <p className="text-xs text-gray-400">Try the <strong>Ask Agent</strong> button below for a live answer.</p>
              </div>
            ) : (
              <div className="px-5 divide-y divide-gray-50">
                {searchResults.map((f, i) => (
                  <div key={i} className="py-3">
                    <p className="text-[11px] font-semibold text-[#0d9488] uppercase tracking-wide mb-1">{f.section}</p>
                    <AccordionItem faq={f} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        {!search && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-10">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSection(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all hover:shadow-md ${activeSection === s.id ? s.color + " shadow-md" : "bg-white border-gray-200 text-gray-600 hover:border-[#0d9488]"}`}
                >
                  <s.icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium leading-tight">{s.title}</span>
                </button>
              ))}
            </div>

            {/* Popular / recently asked */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0d9488]" />
                <h2 className="font-semibold text-gray-900 text-sm">Most Asked Questions</h2>
                <span className="ml-auto text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Top picks</span>
              </div>
              <div className="px-5 divide-y divide-gray-50">
                {POPULAR.map((f, i) => <AccordionItem key={i} faq={f} />)}
              </div>
            </div>
          </>
        )}

        {/* All sections */}
        {!search && SECTIONS.map((section) => (
          <div key={section.id} id={section.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden scroll-mt-24">
            <div className={`px-5 py-4 border-b flex items-center gap-2.5 ${section.color} border`}>
              <section.icon className="w-4 h-4" />
              <h2 className="font-semibold text-sm">{section.title}</h2>
            </div>
            <div className="px-5 divide-y divide-gray-50">
              {section.faqs.map((f, i) => <AccordionItem key={i} faq={f} />)}
            </div>
          </div>
        ))}

        {/* Chat CTA banner */}
        <div className="mt-8 bg-gradient-to-r from-[#0d9488] to-[#0f766e] rounded-2xl p-6 text-white text-center">
          <MessageCircle className="w-8 h-8 mx-auto mb-3 text-white/80" />
          <h3 className="font-bold text-lg mb-1">Still need help?</h3>
          <p className="text-white/80 text-sm mb-4">Our AI agent answers instantly. For complex issues, we connect you to a human admin (Mon–Sat, 9 AM – 8 PM).</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                const fab = document.querySelector<HTMLButtonElement>('[aria-label="Open support chat"]');
                fab?.click();
              }}
              className="bg-white text-[#0d9488] font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors flex items-center gap-2 justify-center"
            >
              <MessageCircle className="w-4 h-4" /> Ask Agent
            </button>
            <Link
              href="mailto:devarajanchandu@gmail.com"
              className="border border-white/40 text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-white/10 transition-colors"
            >
              Email Support
            </Link>
          </div>
        </div>

        {/* Useful links */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Package, label: "My Orders", href: "/customer/profile/orders" },
            { icon: Wallet, label: "My Wallet", href: "/customer/profile/wallet" },
            { icon: Tag, label: "Browse Deals", href: "/customer/products" },
            { icon: ShieldCheck, label: "Terms & Policies", href: "/terms" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-[#0d9488] hover:shadow-md transition-all group"
            >
              <item.icon className="w-5 h-5 text-[#0d9488]" />
              <span className="text-xs font-medium text-gray-700 group-hover:text-[#0d9488]">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
