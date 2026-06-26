"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star, Heart, ShoppingCart, Zap, Shield, Truck, RotateCcw,
  ChevronRight, Minus, Plus, Share2, Store, CheckCircle, Camera, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartStore, useWishlistStore, useProductStore, useAuthStore, useOrderStore, useReviewStore, useRecentlyViewedStore } from "@/lib/store";
import type { Review } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { toast } from "sonner";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { products } = useProductStore();
  const storeProduct = products.find((p) => p.id === id);
  const [fetchedProduct, setFetchedProduct] = useState<typeof storeProduct>(undefined);
  const [productLoading, setProductLoading] = useState(!storeProduct);
  const product = storeProduct ?? fetchedProduct;

  // Fallback: fetch directly if store doesn't have this product (e.g. store was rehydrated with different data)
  useEffect(() => { setMounted(true); }, []);

  // Track recently viewed once product is resolved
  useEffect(() => {
    if (product) addRecentlyViewed(product);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!storeProduct) {
      setProductLoading(true);
      fetch(`/api/products/${id}`)
        .then((r) => r.ok ? r.json() : null)
        .then((p) => p && setFetchedProduct(p))
        .catch(() => {})
        .finally(() => setProductLoading(false));
    }
  }, [id, storeProduct]);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCartStore();
  const { addItem: addWishlist, removeItem: removeWishlist, isWishlisted } = useWishlistStore();
  const wishlisted = product ? isWishlisted(product.id) : false;
  const { user } = useAuthStore();
  const { orders } = useOrderStore();
  const { addReview: saveReviewLocally, addReply, getForProduct } = useReviewStore();
  const { addItem: addRecentlyViewed } = useRecentlyViewedStore();
  const searchParams = useSearchParams();
  const reviewFormRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [apiReviews, setApiReviews] = useState<Review[]>([]);
  const localReviews = mounted ? getForProduct(id) : [];
  // Merge: local reviews take precedence (de-duplicate by userId)
  const reviews = [
    ...localReviews,
    ...apiReviews.filter((r) => !localReviews.some((l) => l.userId === r.userId)),
  ];
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/reviews?productId=${id}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setApiReviews)
      .catch(() => {});
  }, [id]);

  // auto-open reviews tab when coming from orders page via ?tab=reviews
  useEffect(() => {
    if (searchParams.get("tab") === "reviews") {
      setActiveTab("reviews");
      setTimeout(() => reviewFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [searchParams]);

  const hasDeliveredOrder = orders.some(
    (o) =>
      o.status === "delivered" &&
      o.customerId === user?.id &&
      o.items.some((i) => i.product.id === id || i.product.id === product?.id)
  );
  const alreadyReviewed = reviews.some((r) => r.userId === user?.id);

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - reviewImages.length);
    if (!files.length) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    setUploadingImages(true);
    try {
      const urls = await Promise.all(files.map(async (file) => {
        if (cloudName && preset) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("upload_preset", preset);
          fd.append("folder", "bigpool/reviews");
          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
          return (await res.json()).secure_url as string;
        }
        // fallback: data URL (local only)
        return new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result as string);
          r.readAsDataURL(file);
        });
      }));
      setReviewImages((prev) => [...prev, ...urls].slice(0, 3));
    } catch {
      toast.error("Photo upload failed");
    } finally {
      setUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const submitVendorReply = (reviewId: string) => {
    const text = replyText[reviewId]?.trim();
    if (!text) return;
    addReply(reviewId, {
      vendorId: user!.id,
      vendorName: user!.name,
      text,
      createdAt: new Date().toISOString(),
    });
    setReplyText((p) => ({ ...p, [reviewId]: "" }));
    setReplyOpen((p) => ({ ...p, [reviewId]: false }));
    toast.success("Reply posted!");
  };

  const submitReview = async () => {
    if (reviewRating === 0) { toast.error("Please select a star rating"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          userId: user!.id,
          userName: user!.name,
          rating: reviewRating,
          comment: reviewComment,
          images: reviewImages,
        }),
      });
      if (res.ok) {
        const newReview = await res.json();
        saveReviewLocally({ ...newReview, images: reviewImages });
        setReviewRating(0);
        setReviewComment("");
        setReviewImages([]);
        toast.success("Review submitted! Thank you 🎉");
      } else {
        toast.error("Failed to submit review");
      }
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  };
  const related = products.filter((p) => p.categoryId === product?.categoryId && p.id !== id).slice(0, 4);

  if (productLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0d9488]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-6xl">😕</p>
        <h2 className="text-xl font-semibold text-gray-700">Product not found</h2>
        <Link href="/customer/products">
          <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white">Browse Products</Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${quantity}x ${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push("/customer/cart");
  };

  const handleWishlist = () => {
    if (wishlisted) {
      removeWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addWishlist(product);
      toast.success("Added to wishlist");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-gray-500 mb-4 flex-wrap">
        <Link href="/" className="hover:text-[#0d9488]">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/customer/products" className="hover:text-[#0d9488]">Products</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/customer/products?category=${product.categoryId}`} className="hover:text-[#0d9488]">{product.category}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800 line-clamp-1">{product.name}</span>
      </nav>

      {product.isDemo && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-xl">🏷️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Sample Listing</p>
            <p className="text-xs text-amber-700">This product is a showcase example. Real sellers are joining Bigpool soon. You can save it to your wishlist and we'll notify you when it's available.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Images */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50 mb-3">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.discount > 0 && (
                <Badge className="absolute top-3 left-3 bg-red-500 text-white">-{product.discount}%</Badge>
              )}
              {product.promoted && (
                <Badge className="absolute top-3 right-3 bg-[#0d9488] text-white text-xs font-bold">SPONSORED</Badge>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      i === selectedImage ? "border-[#0d9488]" : "border-gray-200"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{product.category}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{product.name}</h1>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-gray-200 text-gray-200"}`} />
                ))}
              </div>
              <span className="text-[#0d9488] text-sm hover:underline cursor-pointer">
                {product.reviewCount.toLocaleString()} ratings
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                  <Badge className="bg-green-100 text-green-800">Save {product.discount}%</Badge>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Store className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Sold by</span>
            <span className="text-[#0d9488] font-medium hover:underline cursor-pointer">{product.sellerName}</span>
          </div>

          <div className="flex gap-1 flex-wrap">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs capitalize">{tag}</Badge>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-700">
              <Truck className="w-4 h-4" />
              <span>Free delivery on orders above ₹499</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <RotateCcw className="w-4 h-4" />
              <span>30-day easy return & replacement</span>
            </div>
            <div className="flex items-center gap-2 text-purple-700">
              <Shield className="w-4 h-4" />
              <span>Secure payments — 100% authentic</span>
            </div>
          </div>

          {product.stock < 10 && (
            <Badge className="bg-red-100 text-red-700">
              Only {product.stock} left in stock — order soon!
            </Badge>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Qty:</span>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-semibold border-x">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {product.isDemo ? (
              <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-center">
                <p className="text-sm font-semibold text-amber-800 mb-1">Sample Product</p>
                <p className="text-xs text-amber-700 mb-3">
                  This is a showcase listing. Real sellers are joining Bigpool soon — check back shortly!
                </p>
                <Button
                  onClick={handleWishlist}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold h-10"
                >
                  <Heart className={`w-4 h-4 mr-2 ${wishlisted ? "fill-white" : ""}`} />
                  {wishlisted ? "Saved — We'll notify you" : "Notify me when available"}
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleBuyNow}
                  className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold h-11"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="w-full border-[#0d9488] text-[#0d9488] hover:bg-teal-50 h-11"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleWishlist}
                  variant="ghost"
                  className={`w-full h-10 ${wishlisted ? "text-red-500" : "text-gray-600"}`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${wishlisted ? "fill-red-500" : ""}`} />
                  {wishlisted ? "Wishlisted" : "Add to Wishlist"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Right panel - delivery info */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20 space-y-4">
            <h3 className="font-semibold text-gray-800">Delivery & Services</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <Truck className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Free Delivery</p>
                  <p className="text-gray-500 text-xs">For orders above ₹499. Estimated: 3-5 days</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Zap className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Express Delivery</p>
                  <p className="text-gray-500 text-xs">Get it by tomorrow. ₹99 extra</p>
                </div>
              </div>
              <div className="flex gap-3">
                <RotateCcw className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">30-Day Returns</p>
                  <p className="text-gray-500 text-xs">Free return pick-up from your doorstep</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">1 Year Warranty</p>
                  <p className="text-gray-500 text-xs">Manufacturer warranty included</p>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-gray-500 mb-2">Sold & Fulfilled by:</p>
              <div className="flex items-center gap-2">
                <div className="bg-[#0d9488] rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                  {product.sellerName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{product.sellerName}</p>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">Verified Seller</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200 w-full justify-start rounded-xl p-1">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="bg-white rounded-xl border border-gray-200 p-6 mt-2">
            <h3 className="font-semibold text-gray-900 mb-3">Product Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </TabsContent>

          <TabsContent value="specifications" className="bg-white rounded-xl border border-gray-200 p-6 mt-2">
            <h3 className="font-semibold text-gray-900 mb-4">Technical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {Object.entries(product.specifications).map(([key, val], i) => (
                <div key={key} className={`flex gap-4 py-2.5 px-3 text-sm ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                  <span className="text-gray-500 font-medium w-40 flex-shrink-0">{key}</span>
                  <span className="text-gray-800">{val}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="bg-white rounded-xl border border-gray-200 p-6 mt-2">
            {/* Rating summary with breakdown bars */}
            {(() => {
              const allRatings = reviews.map((r) => r.rating);
              const total = allRatings.length || product.reviewCount || 1;
              const counts = [5, 4, 3, 2, 1].map((star) => ({
                star,
                count: allRatings.filter((r) => r === star).length,
                pct: Math.round((allRatings.filter((r) => r === star).length / total) * 100),
              }));
              const avgRating = allRatings.length
                ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1)
                : product.rating.toFixed(1);
              return (
                <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-100">
                  <div className="text-center flex-shrink-0">
                    <div className="text-5xl font-bold text-gray-900">{avgRating}</div>
                    <div className="flex justify-center mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(Number(avgRating)) ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-gray-200 text-gray-200"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{product.reviewCount.toLocaleString()} ratings</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {counts.map(({ star, count, pct }) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                        <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b] flex-shrink-0" />
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-[#f59e0b] h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-8">{count > 0 ? `${pct}%` : "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Write a review — any logged-in user who received this product */}
            {user && hasDeliveredOrder && !alreadyReviewed && (
              <div ref={reviewFormRef} className="mb-6 bg-teal-50 border border-teal-200 rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-0.5">Write a Review</h4>
                <p className="text-xs text-gray-500 mb-3">You purchased this product — share your experience!</p>

                {/* Star rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewRating(n)}
                      onMouseEnter={() => setReviewHover(n)}
                      onMouseLeave={() => setReviewHover(0)}
                    >
                      <Star className={`w-8 h-8 transition-colors ${n <= (reviewHover || reviewRating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className="ml-2 text-sm font-medium text-gray-600">
                      {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewRating]}
                    </span>
                  )}
                </div>

                {/* Comment */}
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about your experience (optional)"
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:border-[#0d9488] transition-colors bg-white mb-3"
                />

                {/* Photo upload */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Add Photos (optional, max 3)</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {reviewImages.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setReviewImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {reviewImages.length < 3 && (
                      <label className={`w-20 h-20 rounded-lg border-2 border-dashed border-teal-300 flex flex-col items-center justify-center cursor-pointer hover:bg-teal-100 transition-colors ${uploadingImages ? "opacity-50 cursor-not-allowed" : ""}`}>
                        {uploadingImages ? <Loader2 className="w-5 h-5 text-teal-500 animate-spin" /> : <Camera className="w-5 h-5 text-teal-500" />}
                        <span className="text-[10px] text-teal-600 mt-1">{uploadingImages ? "Uploading…" : "Add photo"}</span>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={uploadingImages}
                          onChange={handleReviewImageUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <Button
                  onClick={submitReview}
                  disabled={submitting || reviewRating === 0 || uploadingImages}
                  className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit Review"}
                </Button>
              </div>
            )}

            {user && hasDeliveredOrder && alreadyReviewed && (
              <div className="mb-5 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> You've already reviewed this product. Thank you!
              </div>
            )}

            {user && !hasDeliveredOrder && (
              <div className="mb-5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
                📦 Purchase and receive this product to leave a review.
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                    {/* Review header */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-[#0d9488] rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {r.userName[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{r.userName}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-gray-200 text-gray-200"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400 ml-auto">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    {r.comment && <p className="text-sm text-gray-700 ml-9 mt-1">{r.comment}</p>}
                    {r.images && r.images.length > 0 && (
                      <div className="flex gap-2 mt-2 ml-9 flex-wrap">
                        {r.images.map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                            <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Vendor reply */}
                    {(r as any).reply && (
                      <div className="ml-9 mt-3 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                        <p className="text-[11px] font-semibold text-indigo-700 mb-0.5 flex items-center gap-1">
                          <Store className="w-3 h-3" /> {(r as any).reply.vendorName} (Seller)
                        </p>
                        <p className="text-sm text-gray-700">{(r as any).reply.text}</p>
                      </div>
                    )}

                    {/* Seller: reply box (only for this product's seller, no existing reply) */}
                    {user?.role === "seller" && product?.sellerId === user.id && !(r as any).reply && (
                      <div className="ml-9 mt-2">
                        {replyOpen[r.id] ? (
                          <div className="flex gap-2 items-start">
                            <textarea
                              value={replyText[r.id] ?? ""}
                              onChange={(e) => setReplyText((p) => ({ ...p, [r.id]: e.target.value }))}
                              placeholder="Write a reply to this review…"
                              className="flex-1 border border-gray-200 rounded-lg p-2 text-sm resize-none h-16 focus:outline-none focus:border-indigo-400"
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7" onClick={() => submitVendorReply(r.id)}>
                                Reply
                              </Button>
                              <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-500" onClick={() => setReplyOpen((p) => ({ ...p, [r.id]: false }))}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setReplyOpen((p) => ({ ...p, [r.id]: true }))} className="text-xs text-indigo-600 hover:underline">
                            Reply as seller
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
