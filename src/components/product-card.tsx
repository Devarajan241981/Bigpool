"use client";

import { memo } from "react";
import Link from "next/link";
import { Heart, Star, ShoppingCart, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { useCartStore, useWishlistStore, useCashbackStore } from "@/lib/store";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

function ProductCardInner({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { addItem: addWishlist, removeItem: removeWishlist, isWishlisted } = useWishlistStore();
  const { offers } = useCashbackStore();
  const wishlisted = isWishlisted(product.id);

  // Find best cashback offer for this product
  const now = new Date();
  const cashbackOffer = offers.find((o) => {
    if (!o.active || new Date(o.validUntil) < now) return false;
    if (!o.categories?.length) return true;
    return o.categories.includes(product.categoryId);
  });

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlisted) {
      removeWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addWishlist(product);
      toast.success("Added to wishlist");
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success("Added to cart");
  };

  return (
    <Link href={`/customer/products/${product.id}`} className="group">
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.isDemo && (
            <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold">
              SAMPLE
            </Badge>
          )}
          {!product.isDemo && product.discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
              -{product.discount}%
            </Badge>
          )}
          {product.promoted && (
            <Badge className="absolute top-2 right-8 bg-[#0d9488] text-white text-[10px] font-bold">
              AD
            </Badge>
          )}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
              wishlisted ? "bg-red-100 text-red-500" : "bg-white/80 text-gray-400 hover:text-red-500"
            }`}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? "fill-red-500" : ""}`} />
          </button>
        </div>

        <div className="p-3 flex flex-col flex-1 gap-1.5">
          <p className="text-xs text-gray-500 truncate">{product.category}</p>
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 flex-1">
            {product.name}
          </h3>

          <div className="flex items-center gap-1">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating)
                      ? "fill-[#f59e0b] text-[#f59e0b]"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviewCount.toLocaleString()})</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Cashback offer badge */}
          {cashbackOffer && (
            <div className="flex items-center gap-1 text-purple-600 bg-purple-50 rounded px-1.5 py-0.5">
              <Gift className="w-3 h-3 flex-shrink-0" />
              <span className="text-[10px] font-semibold leading-tight">
                {cashbackOffer.percentage}% cashback up to ₹{cashbackOffer.maxAmount}
              </span>
            </div>
          )}

          {product.stock < 10 && product.stock > 0 && (
            <p className="text-xs text-red-500">Only {product.stock} left!</p>
          )}
          {product.stock === 0 && (
            <p className="text-xs text-red-600 font-medium">Out of stock</p>
          )}

          <Button
            onClick={handleAddToCart}
            size="sm"
            disabled={product.stock === 0}
            className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-medium mt-1 disabled:opacity-50"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </Link>
  );
}

const ProductCard = memo(ProductCardInner);
export default ProductCard;
