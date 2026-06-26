"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWishlistStore, useCartStore } from "@/lib/store";
import { toast } from "sonner";

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();

  const moveToCart = (product: (typeof items)[0]) => {
    addItem(product);
    removeItem(product.id);
    toast.success("Moved to cart!");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-6">Save items you love by clicking the heart icon on products</p>
        <Link href="/customer/products">
          <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">
            Discover Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        <Badge className="bg-red-100 text-red-700">{items.length}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((product) => (
          <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <Link href={`/customer/products/${product.id}`} className="block">
              <div className="relative aspect-square overflow-hidden bg-gray-50">
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                {product.discount > 0 && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">-{product.discount}%</Badge>
                )}
              </div>
            </Link>
            <div className="p-3">
              <Link href={`/customer/products/${product.id}`}>
                <p className="text-xs text-gray-500">{product.category}</p>
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-[#0d9488] mt-0.5">{product.name}</h3>
              </Link>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                {product.originalPrice > product.price && (
                  <span className="text-xs text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-medium"
                  onClick={() => moveToCart(product)}
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Add to Cart
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                  onClick={() => { removeItem(product.id); toast.success("Removed from wishlist"); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
