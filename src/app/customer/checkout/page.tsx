"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, MapPin, CreditCard, Smartphone, Building,
  ChevronRight, Plus, Edit3, Tag, Gift, Wallet as WalletIcon, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore, useAuthStore, useWalletStore, useVoucherStore, useCashbackStore, useOrderStore } from "@/lib/store";
import { toast } from "sonner";

declare global { interface Window { Razorpay: any } } // eslint-disable-line @typescript-eslint/no-explicit-any

const paymentMethods = [
  { id: "upi",        label: "UPI",                  icon: <Smartphone className="w-4 h-4" />, note: "Pay via any UPI app" },
  { id: "card",       label: "Credit / Debit Card",  icon: <CreditCard className="w-4 h-4" />, note: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net Banking",           icon: <Building className="w-4 h-4" />,   note: "All major banks" },
  { id: "wallet",     label: "Bigpool Wallet",        icon: <WalletIcon className="w-4 h-4" />, note: "Use your wallet balance" },
  { id: "cod",        label: "Cash on Delivery",      icon: <span className="text-sm font-bold">₹</span>, note: "Pay when delivered" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { balance: walletBalance, debit: debitWallet } = useWalletStore();
  const { appliedVoucher, applyVoucher, removeAppliedVoucher, markUsed } = useVoucherStore();
  const { earnCashback } = useCashbackStore();
  const { createOrder } = useOrderStore();

  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [placing, setPlacing] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [useNewAddress, setUseNewAddress] = useState(!user?.address?.street);
  const [address, setAddress] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
  });
  const [voucherCode, setVoucherCode] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const savedAddress = user?.address?.street ? {
    name: user.name, phone: user.phone || "",
    street: user.address.street, city: user.address.city,
    state: user.address.state, pincode: user.address.pincode,
  } : null;
  const activeAddress = useNewAddress ? address : (savedAddress ?? address);

  const subtotal = total();
  const delivery = subtotal > 499 ? 0 : 40;
  const voucherDiscount = appliedVoucher?.discount ?? 0;
  const isWalletPayment = paymentMethod === "wallet";
  // Wallet can only cover up to the wallet balance
  const walletDiscount = isWalletPayment ? Math.min(walletBalance, subtotal + delivery - voucherDiscount) : 0;
  const finalTotal = Math.max(0, subtotal + delivery - voucherDiscount - walletDiscount);

  // Cashback preview: what the user will earn on this order
  const categoryIds = [...new Set(items.map((i) => i.product.categoryId))];
  const { offers: cbOffers } = useCashbackStore();
  const now = new Date();
  const bestCbOffer = cbOffers.find((o) => {
    if (!o.active || new Date(o.validUntil) < now) return false;
    if (!o.categories?.length) return true;
    return o.categories.some((c) => categoryIds.includes(c));
  });
  const estimatedCashback = bestCbOffer
    ? Math.floor(Math.min((subtotal * bestCbOffer.percentage) / 100, bestCbOffer.maxAmount))
    : 0;

  useEffect(() => {
    if (window.Razorpay) { setRazorpayReady(true); return; }
    if (document.getElementById("rzp-sdk")) return;
    const s = document.createElement("script");
    s.id = "rzp-sdk";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => setRazorpayReady(true);
    document.head.appendChild(s);
  }, []);

  // Reset applied voucher on unmount to avoid stale state
  useEffect(() => () => { removeAppliedVoucher(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) { toast.error("Enter a voucher code"); return; }
    setApplyingVoucher(true);
    const result = applyVoucher(voucherCode.trim(), subtotal, categoryIds);
    toast[result.success ? "success" : "error"](result.message);
    setApplyingVoucher(false);
  };

  const completeOrder = async () => {
    if (!user) return;
    const deliveryAddress = {
      street: activeAddress.street, city: activeAddress.city,
      state: activeAddress.state, pincode: activeAddress.pincode, country: "India",
    };

    // Persist order to API/DB
    const savedOrder = await createOrder({
      customerId: user.id,
      customerName: user.name,
      items,
      total: finalTotal,
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
      paymentMethod,
      address: deliveryAddress,
      voucherCode: appliedVoucher?.voucher.code,
      voucherDiscount,
      cashbackAmount: estimatedCashback,
    });

    const orderId = savedOrder.id;

    // Mark voucher as used (local store + API on validate call)
    if (appliedVoucher) markUsed(appliedVoucher.voucher.code, user.id);
    // Deduct wallet if wallet payment
    if (isWalletPayment && walletDiscount > 0) debitWallet(walletDiscount, `Order ${orderId}`, orderId);
    // Earn cashback (local store; also persisted in API via /api/cashback/earn)
    if (estimatedCashback > 0) earnCashback(orderId, subtotal, categoryIds);

    clearCart();
    removeAppliedVoucher();
    const msg = estimatedCashback > 0
      ? `Order placed! ₹${estimatedCashback} cashback will be credited after delivery.`
      : "Order placed successfully!";
    toast.success(msg);
    router.push("/customer/profile/orders?success=true");
  };

  const openRazorpay = async () => {
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) { toast.error("Razorpay key not configured."); return; }
    setPlacing(true);

    // Create order server-side first so we can verify signature after payment
    let rzpOrderId: string;
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalTotal }),
      });
      if (!res.ok) throw new Error("Order creation failed");
      const rzpOrder = await res.json();
      rzpOrderId = rzpOrder.id;
    } catch {
      setPlacing(false);
      toast.error("Could not initiate payment. Please try again.");
      return;
    }

    const options = {
      key,
      amount: finalTotal * 100,
      currency: "INR",
      order_id: rzpOrderId,
      name: "Bigpool",
      description: `Order — ${items.length} item(s)`,
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        // Verify payment signature server-side before completing order
        const verify = await fetch("/api/checkout/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });
        if (!verify.ok) {
          setPlacing(false);
          toast.error("Payment verification failed. Contact support.");
          return;
        }
        completeOrder();
      },
      prefill: {
        name: user?.name ?? "",
        email: user?.email ?? "",
        contact: activeAddress.phone,
        ...(paymentMethod === "upi" && upiId ? { vpa: upiId } : {}),
      },
      notes: { address: `${activeAddress.street}, ${activeAddress.city}` },
      theme: { color: "#0d9488" },
      modal: { ondismiss: () => setPlacing(false) },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", () => { setPlacing(false); toast.error("Payment failed. Please try again."); });
    rzp.open();
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "cod") {
      setPlacing(true);
      await new Promise((r) => setTimeout(r, 1200));
      completeOrder();
      return;
    }
    if (paymentMethod === "wallet") {
      if (walletBalance < finalTotal && finalTotal > 0) {
        toast.error(`Insufficient wallet balance. Available: ₹${walletBalance.toLocaleString()}`);
        return;
      }
      setPlacing(true);
      await new Promise((r) => setTimeout(r, 800));
      completeOrder();
      return;
    }
    if (!razorpayReady) { toast.error("Payment gateway loading…"); return; }
    openRazorpay();
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center pb-20 md:pb-16">
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-xl font-semibold mb-4">Nothing to checkout</h2>
        <Link href="/customer/products"><Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white h-11 px-8">Shop Now</Button></Link>
      </div>
    );
  }

  const steps = ["Delivery Address", "Payment", "Review"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 pb-20 md:pb-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-6 md:mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 ${i <= step ? "text-[#0d9488]" : "text-gray-400"}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 ${
                i < step ? "bg-[#0d9488] border-[#0d9488] text-white" :
                i === step ? "border-[#0d9488] text-[#0d9488]" : "border-gray-300 text-gray-400"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className="text-xs sm:text-sm hidden xs:block">{s}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-16 md:w-24 mx-1.5 md:mx-2 ${i < step ? "bg-[#0d9488]" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          {/* Step 0: Address */}
          {step === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0d9488]" /> Delivery Address
              </h2>
              {savedAddress && (
                <div className="mb-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saved Address</p>
                  <div
                    onClick={() => setUseNewAddress(false)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${!useNewAddress ? "border-[#0d9488] bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${!useNewAddress ? "border-[#0d9488]" : "border-gray-300"}`}>
                      {!useNewAddress && <div className="w-2 h-2 rounded-full bg-[#0d9488]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{savedAddress.name}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{savedAddress.street}, {savedAddress.city}</p>
                      <p className="text-sm text-gray-600">{savedAddress.state} — {savedAddress.pincode}</p>
                      {savedAddress.phone && <p className="text-xs text-gray-400 mt-1">📞 {savedAddress.phone}</p>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); window.location.href = "/customer/profile"; }} className="text-[#0d9488] hover:text-[#0f766e] flex-shrink-0" title="Edit in profile">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <div
                    onClick={() => setUseNewAddress(true)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${useNewAddress ? "border-[#0d9488] bg-teal-50" : "border-dashed border-gray-300 hover:border-gray-400"}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${useNewAddress ? "border-[#0d9488]" : "border-gray-300"}`}>
                      {useNewAddress ? <div className="w-2 h-2 rounded-full bg-[#0d9488]" /> : <Plus className="w-3 h-3 text-gray-400" />}
                    </div>
                    <p className="text-sm font-medium text-gray-700">Deliver to a different address</p>
                  </div>
                </div>
              )}
              {useNewAddress && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Full Name</Label><Input className="mt-1.5" placeholder="Recipient's name" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} /></div>
                  <div><Label>Phone Number</Label><Input className="mt-1.5" placeholder="+91 9876543210" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>Street Address</Label><Input className="mt-1.5" placeholder="House no., building, street, area" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} /></div>
                  <div><Label>City</Label><Input className="mt-1.5" placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></div>
                  <div>
                    <Label>State</Label>
                    <select className="mt-1.5 w-full border border-input rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}>
                      <option value="">Select State</option>
                      {["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli and Daman & Diu","Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div><Label>Pincode</Label><Input className="mt-1.5" placeholder="560001" maxLength={6} value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} /></div>
                </div>
              )}
              <Button className="mt-6 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold w-full sm:w-auto px-8 h-11" onClick={() => {
                const a = activeAddress;
                if (!a.name || !a.street || !a.city || !a.pincode) { toast.error("Please fill all required fields"); return; }
                setStep(1);
              }}>
                Deliver to this address <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Voucher input */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#0d9488]" /> Apply Voucher
                </h3>
                {appliedVoucher ? (
                  <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-bold text-teal-800">{appliedVoucher.voucher.code}</p>
                      <p className="text-xs text-teal-600">−₹{appliedVoucher.discount.toLocaleString()} saved</p>
                    </div>
                    <button onClick={() => { removeAppliedVoucher(); setVoucherCode(""); }} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter voucher code"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyVoucher()}
                      className="font-mono uppercase tracking-widest"
                    />
                    <Button onClick={handleApplyVoucher} disabled={applyingVoucher} variant="outline" className="shrink-0 border-[#0d9488] text-[#0d9488] hover:bg-teal-50">
                      Apply
                    </Button>
                  </div>
                )}
                <Link href="/customer/vouchers" className="text-xs text-[#0d9488] hover:underline mt-2 inline-block">
                  View available vouchers →
                </Link>
              </div>

              {/* Payment method */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0d9488]" /> Payment Method
                </h2>
                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <label key={pm.id} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === pm.id ? "border-[#0d9488] bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} className="sr-only" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === pm.id ? "border-[#0d9488]" : "border-gray-300"}`}>
                        {paymentMethod === pm.id && <div className="w-2 h-2 rounded-full bg-[#0d9488]" />}
                      </div>
                      <span className="text-[#0d9488]">{pm.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{pm.label}</p>
                        <p className="text-xs text-gray-500">{pm.id === "wallet" ? `Balance: ₹${walletBalance.toLocaleString()}` : pm.note}</p>
                      </div>
                      {pm.id === "wallet" && walletBalance > 0 && (
                        <Badge className="bg-green-100 text-green-700 text-xs">₹{walletBalance.toLocaleString()}</Badge>
                      )}
                    </label>
                  ))}
                </div>
                {paymentMethod === "upi" && (
                  <div className="mt-4"><Label>UPI ID</Label><Input className="mt-1.5" placeholder="yourname@paytm / @gpay / @ybl" value={upiId} onChange={(e) => setUpiId(e.target.value)} /></div>
                )}
                {paymentMethod === "card" && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="col-span-2"><Label>Card Number</Label><Input className="mt-1.5" placeholder="•••• •••• •••• ••••" maxLength={19} /></div>
                    <div><Label>Expiry</Label><Input className="mt-1.5" placeholder="MM/YY" maxLength={5} /></div>
                    <div><Label>CVV</Label><Input className="mt-1.5" placeholder="•••" type="password" maxLength={3} /></div>
                    <div className="col-span-2"><Label>Cardholder Name</Label><Input className="mt-1.5" placeholder="Name on card" /></div>
                    <p className="col-span-2 text-xs text-gray-400 flex items-center gap-1">🔒 Secured by Razorpay · 256-bit SSL encryption</p>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(0)} className="h-11 px-5">Back</Button>
                  <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold px-6 md:px-8 h-11 flex-1 sm:flex-none" onClick={() => setStep(2)}>
                    Review Order <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-lg mb-4">Review Order</h2>
              <div className="space-y-3 mb-4">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3">
                    <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                      <p className="text-xs text-gray-500">Qty: {quantity}</p>
                      <p className="text-sm font-bold">₹{(product.price * quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Delivery to:</p>
                  <p className="font-medium">{activeAddress.name}</p>
                  <p className="text-gray-600 text-xs">{activeAddress.street}, {activeAddress.city}, {activeAddress.state} - {activeAddress.pincode}</p>
                  <p className="text-gray-600 text-xs">{activeAddress.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase mb-1">Payment via:</p>
                  <p className="font-medium capitalize">{paymentMethods.find(p => p.id === paymentMethod)?.label}</p>
                  {upiId && <p className="text-gray-600 text-xs">{upiId}</p>}
                </div>
              </div>
              {estimatedCashback > 0 && (
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 mb-4">
                  <Gift className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <p className="text-sm text-purple-700">
                    You&apos;ll earn <strong>₹{estimatedCashback} cashback</strong> after delivery!
                  </p>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="h-11 px-5">Back</Button>
                <Button className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold h-11" onClick={handlePlaceOrder} disabled={placing}>
                  {placing ? "Placing Order..." : `Place Order — ₹${finalTotal.toLocaleString()}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
            <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-2.5 text-sm">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between gap-2">
                  <span className="text-gray-600 line-clamp-1 flex-1">{product.name} ×{quantity}</span>
                  <span className="flex-shrink-0 font-medium">₹{(product.price * quantity).toLocaleString()}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className={delivery === 0 ? "text-green-600" : ""}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-teal-600">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Voucher</span>
                  <span>−₹{voucherDiscount.toLocaleString()}</span>
                </div>
              )}
              {walletDiscount > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span className="flex items-center gap-1"><WalletIcon className="w-3 h-3" /> Wallet</span>
                  <span>−₹{walletDiscount.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span><span>₹{finalTotal.toLocaleString()}</span>
              </div>
              {estimatedCashback > 0 && (
                <div className="flex justify-between text-purple-600 text-xs font-medium pt-1">
                  <span className="flex items-center gap-1"><Gift className="w-3 h-3" /> Cashback (after delivery)</span>
                  <span>+₹{estimatedCashback}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
