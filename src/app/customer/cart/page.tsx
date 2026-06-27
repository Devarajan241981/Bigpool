"use client";

import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { useState } from "react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const subtotal = total();
  const delivery = subtotal > 499 ? 0 : 40;
  const finalTotal = subtotal + delivery - discount;

  const applyCoupon = () => {
    if (coupon.toUpperCase() === "SAVE10") {
      setDiscount(Math.round(subtotal * 0.1));
      toast.success("Coupon SAVE10 applied! 10% off");
    } else if (coupon.toUpperCase() === "FIRST50") {
      setDiscount(50);
      toast.success("₹50 off with FIRST50");
    } else {
      toast.error("Invalid coupon code");
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center gap-4 pb-24 md:pb-16">
        <div className="text-6xl md:text-7xl">🛒</div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Your cart is empty</h2>
        <p className="text-gray-500 text-center">Add items to your cart to continue shopping</p>
        <Link href="/customer/products">
          <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold px-8 h-11">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 pb-20 md:pb-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 flex gap-3 md:gap-4">
              <Link href={`/customer/products/${product.id}`} className="flex-shrink-0">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg hover:opacity-90 transition-opacity"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/customer/products/${product.id}`}>
                  <h3 className="font-medium text-gray-800 text-sm hover:text-[#0d9488] line-clamp-2">{product.name}</h3>
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">{product.sellerName}</p>
                {product.stock <= 10 && (
                  <p className="text-xs text-red-500 mt-0.5">Only {product.stock} left</p>
                )}
                <div className="flex items-center justify-between mt-2 md:mt-3 flex-wrap gap-2">
                  <div>
                    <span className="text-base md:text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through ml-2">₹{product.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(product.id, quantity - 1)} className="px-2 py-1.5 hover:bg-gray-100 min-w-[32px] flex items-center justify-center">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1.5 text-sm font-semibold border-x min-w-[36px] text-center">{quantity}</span>
                      <button onClick={() => updateQuantity(product.id, quantity + 1)} className="px-2 py-1.5 hover:bg-gray-100 min-w-[32px] flex items-center justify-center" disabled={quantity >= product.stock}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => { removeItem(product.id); toast.success("Removed from cart"); }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <button onClick={() => { clearCart(); toast.success("Cart cleared"); }} className="text-sm text-red-500 hover:underline">
              Clear Cart
            </button>
            <Link href="/customer/products" className="text-sm text-[#0d9488] hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#0d9488]" /> Apply Coupon
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="text-sm"
              />
              <Button onClick={applyCoupon} variant="outline" className="flex-shrink-0 text-sm border-[#0d9488] text-[#0d9488] hover:bg-teal-50">
                Apply
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Try: SAVE10 or FIRST50</p>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Price Details</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Price ({items.length} item{items.length > 1 ? "s" : ""})</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges</span>
                <span className={delivery === 0 ? "text-green-600" : ""}>
                  {delivery === 0 ? "FREE" : `₹${delivery}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base text-gray-900">
                <span>Total Amount</span>
                <span>₹{finalTotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <p className="text-green-600 text-xs">You save ₹{discount} on this order!</p>
              )}
            </div>

            <Link href="/customer/checkout">
              <Button className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold h-11 mt-5">
                Proceed to Checkout
              </Button>
            </Link>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-800">
            <p className="font-semibold mb-1">Safe & Secure Payments</p>
            <p>All transactions are encrypted and protected by Bigpool's buyer protection policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
