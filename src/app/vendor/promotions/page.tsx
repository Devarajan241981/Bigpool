"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, Plus, Megaphone, Star, Image as ImageIcon,
  CheckCircle, Clock, XCircle, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore, useHasHydrated, useProductStore } from "@/lib/store";
import type { PromotionRequest } from "@/lib/types";
import { toast } from "sonner";

const promotionTypes = [
  { id: "banner", label: "Homepage Banner", icon: <ImageIcon className="w-5 h-5" />, description: "Large banner on the homepage. Maximum visibility.", price: "₹5,000/week", color: "bg-purple-50 border-purple-200" },
  { id: "featured", label: "Featured Listing", icon: <Star className="w-5 h-5" />, description: "Your product in the 'Featured' section across the site.", price: "₹2,500/week", color: "bg-blue-50 border-blue-200" },
  { id: "boost", label: "Search Boost", icon: <TrendingUp className="w-5 h-5" />, description: "Boost to the top of search results for relevant keywords.", price: "₹1,500/week", color: "bg-green-50 border-green-200" },
  { id: "ad", label: "Sponsored Ad", icon: <Megaphone className="w-5 h-5" />, description: "Display ads across product and category pages.", price: "₹3,000/week", color: "bg-teal-50 border-teal-200" },
  { id: "sale", label: "Live Sale / Coupon", icon: <Tag className="w-5 h-5" />, description: "Add a coupon code and get a 🔥 Live Sale badge on your product.", price: "Free (Admin approval)", color: "bg-orange-50 border-orange-200" },
];

const statusConfig = {
  pending: { label: "Under Review", color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: "Active", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function VendorPromotionsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const { products } = useProductStore();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({ productId: "", budget: "", duration: "7", message: "", couponCode: "" });
  const [myRequests, setMyRequests] = useState<PromotionRequest[]>([]);

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "seller")) router.push("/vendor/login");
  }, [hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.id) {
      fetch(`/api/promotions?sellerId=${user.id}`)
        .then((r) => r.ok ? r.json() : [])
        .then(setMyRequests)
        .catch(() => {});
    }
  }, [hasHydrated, isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasHydrated || !isAuthenticated || user?.role !== "seller") return null;
  const sellerProducts = products.filter((p) => p.sellerId === user.id);

  const handleSubmit = () => {
    if (!selectedType || !form.message) {
      toast.error("Please fill all required fields");
      return;
    }
    if (selectedType !== "sale" && !form.budget) {
      toast.error("Please enter a budget");
      return;
    }
    if (selectedType === "sale" && !form.couponCode) {
      toast.error("Please enter a coupon code for Live Sale promotion");
      return;
    }
    const selectedProduct = sellerProducts.find((p) => p.id === form.productId);
    fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerId: user?.id,
        sellerName: user?.name,
        productId: form.productId || undefined,
        productName: selectedProduct?.name,
        type: selectedType,
        budget: Number(form.budget) || 0,
        duration: Number(form.duration),
        message: form.message,
        couponCode: form.couponCode || undefined,
      }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((req) => { if (req) setMyRequests((prev) => [req, ...prev]); })
      .catch(() => {});
    toast.success("Promotion request submitted! Admin will review within 24 hours.");
    setDialogOpen(false);
    setSelectedType("");
    setForm({ productId: "", budget: "", duration: "7", message: "", couponCode: "" });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Advertising</h1>
          <p className="text-sm text-gray-500">Boost your products and reach more customers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)} className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold gap-2">
            <Plus className="w-4 h-4" /> Request Promotion
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Promotion Request</DialogTitle></DialogHeader>
            <div className="space-y-5 mt-2">
              <div>
                <Label className="mb-2 block">Select Promotion Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {promotionTypes.map((pt) => (
                    <button key={pt.id} onClick={() => setSelectedType(pt.id)} className={`p-3 rounded-lg border-2 text-left transition-all ${selectedType === pt.id ? "border-[#0d9488] bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="flex items-center gap-2 mb-1 text-gray-700">{pt.icon}<span className="text-sm font-medium">{pt.label}</span></div>
                      <p className="text-xs text-gray-500">{pt.description}</p>
                      <p className="text-xs font-bold text-[#0d9488] mt-1">{pt.price}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Product (Optional)</Label>
                <select className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                  <option value="">All products / Store-wide</option>
                  {sellerProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {selectedType === "sale" && (
                <div>
                  <Label>Coupon Code *</Label>
                  <Input className="mt-1.5 uppercase tracking-widest font-mono" placeholder="e.g. SAVE20" value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })} maxLength={20} />
                  <p className="text-xs text-gray-500 mt-1">Customers will use this code at checkout. Once admin approves, a 🔥 Live Sale badge appears on your product.</p>
                </div>
              )}
              {selectedType !== "sale" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Budget (₹) *</Label>
                    <Input className="mt-1.5" type="number" placeholder="10000" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                  </div>
                  <div>
                    <Label>Duration (days)</Label>
                    <select className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
                      <option value="7">7 days</option><option value="15">15 days</option>
                      <option value="30">30 days</option><option value="60">60 days</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <Label>Message to Admin *</Label>
                <Textarea className="mt-1.5" rows={3} placeholder="Describe your promotion goal..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800">
                <p className="font-medium mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Submit your promotion request with budget</li>
                  <li>Admin reviews and approves within 24 hours</li>
                  <li>Payment collected on approval</li>
                  <li>Promotion goes live immediately after payment</li>
                </ol>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">Submit Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {promotionTypes.map((pt) => (
          <div key={pt.id} className={`rounded-xl border-2 p-4 ${pt.color}`}>
            <div className="text-gray-700 mb-2">{pt.icon}</div>
            <h3 className="text-sm font-semibold text-gray-800">{pt.label}</h3>
            <p className="text-xs text-gray-600 mt-1">{pt.description}</p>
            <p className="text-sm font-bold text-gray-900 mt-2">{pt.price}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">My Promotion Requests</h2>
        </div>
        {myRequests.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No promotion requests yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {myRequests.map((req) => {
              const config = statusConfig[req.status];
              const pt = promotionTypes.find((p) => p.id === req.type);
              return (
                <div key={req.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{pt?.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{pt?.label}</p>
                        {req.productName && <p className="text-xs text-gray-500">Product: {req.productName}</p>}
                      </div>
                    </div>
                    <Badge className={`text-xs gap-1 ${config.color}`}>{config.icon} {config.label}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div><p className="text-xs text-gray-500">Budget</p><p className="font-medium">₹{req.budget.toLocaleString()}</p></div>
                    <div><p className="text-xs text-gray-500">Duration</p><p className="font-medium">{req.duration} days</p></div>
                    <div><p className="text-xs text-gray-500">Requested</p><p className="font-medium">{req.createdAt}</p></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded p-2">{req.message}</p>
                  {req.status === "rejected" && (
                    <Button size="sm" variant="outline" className="mt-3 text-xs">Revise & Resubmit</Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
