"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Eye, Search, Star, Tag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore, useHasHydrated, useProductStore } from "@/lib/store";
import type { Category } from "@/lib/types";
import { toast } from "sonner";
import CloudinaryUpload from "@/components/cloudinary-upload";
import CategoryFields from "@/components/category-fields";

export default function VendorProductsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const router = useRouter();
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", price: "", originalPrice: "", category: "",
    stock: "", description: "", tags: "", couponCode: "", requestSale: false, images: [] as string[], specs: {} as Record<string, string>,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState({
    name: "", price: "", originalPrice: "", category: "",
    stock: "", description: "", tags: "", images: [] as string[], specs: {} as Record<string, string>,
  });
  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "seller")) router.push("/vendor/login");
  }, [hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    useProductStore.persist.rehydrate();
    fetch("/api/categories").then((r) => r.ok ? r.json() : []).then(setCategories).catch(() => {});
  }, []);
  if (!hasHydrated || !isAuthenticated || user?.role !== "seller") return null;

  const sellerProducts = products.filter((p) => p.sellerId === user?.id || p.sellerId === "s1").filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePublish = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category || !newProduct.description) {
      toast.error("Please fill all required fields");
      return;
    }
    if (newProduct.requestSale && !newProduct.couponCode) {
      toast.error("Please enter a coupon code to request a Live Sale");
      return;
    }
    const price = parseFloat(newProduct.price);
    const originalPrice = parseFloat(newProduct.originalPrice) || price;
    const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    addProduct({
      name: newProduct.name,
      description: newProduct.description,
      price,
      originalPrice,
      discount,
      images: newProduct.images.length > 0 ? newProduct.images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format"],
      category: newProduct.category,
      categoryId: categories.find((c) => c.name === newProduct.category)?.id || newProduct.category.toLowerCase().replace(/\s+/g, "-"),
      sellerId: user?.id || "s1",
      sellerName: user?.name || "Vendor",
      stock: parseInt(newProduct.stock) || 0,
      tags: newProduct.tags.split(",").map((t) => t.trim()).filter(Boolean),
      specifications: newProduct.specs,
    });
    toast.success("Product listed! Customers can now see it.");
    if (newProduct.requestSale && newProduct.couponCode) {
      toast.success(`Live Sale request with coupon "${newProduct.couponCode}" sent to admin.`);
    }
    setAddOpen(false);
    setNewProduct({ name: "", price: "", originalPrice: "", category: "", stock: "", description: "", tags: "", couponCode: "", requestSale: false, images: [], specs: {} });
  };

  const handleEditOpen = (p: (typeof products)[0]) => {
    setEditingId(p.id);
    setEditProduct({
      name: p.name,
      price: String(p.price),
      originalPrice: String(p.originalPrice || p.price),
      category: p.category,
      stock: String(p.stock),
      description: p.description,
      tags: p.tags.join(", "),
      images: p.images,
      specs: (p.specifications as Record<string, string>) || {},
    });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingId || !editProduct.name || !editProduct.price || !editProduct.category) {
      toast.error("Please fill all required fields");
      return;
    }
    const price = parseFloat(editProduct.price);
    const originalPrice = parseFloat(editProduct.originalPrice) || price;
    const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    updateProduct(editingId, {
      name: editProduct.name,
      description: editProduct.description,
      price,
      originalPrice,
      discount,
      images: editProduct.images.length > 0 ? editProduct.images : undefined,
      category: editProduct.category,
      categoryId: categories.find((c) => c.name === editProduct.category)?.id || editProduct.category.toLowerCase().replace(/\s+/g, "-"),
      stock: parseInt(editProduct.stock) || 0,
      tags: editProduct.tags.split(",").map((t) => t.trim()).filter(Boolean),
      specifications: editProduct.specs,
    });
    toast.success("Product updated successfully!");
    setEditOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteProduct(id);
      toast.success("Product deleted.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-sm text-gray-500">{sellerProducts.length} products listed</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <Button onClick={() => setAddOpen(true)} className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold gap-2">
            <Plus className="w-4 h-4" /> Add New Product
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Product Name *</Label>
                  <Input className="mt-1.5" placeholder="e.g. Samsung Galaxy S24 Ultra" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                </div>
                <div>
                  <Label>Selling Price (₹) *</Label>
                  <Input className="mt-1.5" type="number" placeholder="9999" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                </div>
                <div>
                  <Label>Original Price (₹)</Label>
                  <Input className="mt-1.5" type="number" placeholder="14999" value={newProduct.originalPrice} onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })} />
                </div>
                <div>
                  <Label>Category *</Label>
                  <select className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                    <option value="">Select category</option>
                    <option>Electronics</option><option>Fashion</option><option>Home & Kitchen</option>
                    <option>Books</option><option>Sports</option><option>Beauty</option>
                    <option>Toys</option><option>Grocery</option>
                  </select>
                </div>
                <div>
                  <Label>Stock Quantity</Label>
                  <Input className="mt-1.5" type="number" placeholder="100" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Product Description *</Label>
                <Textarea className="mt-1.5" rows={4} placeholder="Describe your product..." value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input className="mt-1.5" placeholder="samsung, smartphone, android" value={newProduct.tags} onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })} />
              </div>
              <div>
                <Label>Product Images</Label>
                <div className="mt-1.5">
                  <CloudinaryUpload
                    images={newProduct.images}
                    onChange={(urls) => setNewProduct({ ...newProduct, images: urls })}
                    maxImages={5}
                  />
                </div>
              </div>

              {/* Category-specific fields */}
              <CategoryFields
                category={newProduct.category}
                specs={newProduct.specs}
                onChange={(specs) => setNewProduct({ ...newProduct, specs })}
              />

              {/* Live Sale / Coupon Request */}
              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.requestSale}
                    onChange={(e) => setNewProduct({ ...newProduct, requestSale: e.target.checked, couponCode: "" })}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Request Live Sale badge for this product</span>
                  </div>
                </label>
                {newProduct.requestSale && (
                  <div className="mt-3">
                    <Label className="text-orange-700">Coupon Code *</Label>
                    <Input
                      className="mt-1.5 uppercase tracking-widest font-mono"
                      placeholder="e.g. SAVE20"
                      value={newProduct.couponCode}
                      onChange={(e) => setNewProduct({ ...newProduct, couponCode: e.target.value.toUpperCase() })}
                      maxLength={20}
                    />
                    <p className="text-xs text-orange-600 mt-1.5">
                      Admin will review and approve. Once approved, your product will show a 🔥 Live Sale badge and customers can use this coupon.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Save as Draft</Button>
                <Button onClick={handlePublish} className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">Publish Product</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Product Name *</Label>
                <Input className="mt-1.5" value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} />
              </div>
              <div>
                <Label>Selling Price (₹) *</Label>
                <Input className="mt-1.5" type="number" value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })} />
              </div>
              <div>
                <Label>Original Price (₹)</Label>
                <Input className="mt-1.5" type="number" value={editProduct.originalPrice} onChange={(e) => setEditProduct({ ...editProduct, originalPrice: e.target.value })} />
              </div>
              <div>
                <Label>Category *</Label>
                <select className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm" value={editProduct.category} onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}>
                  <option value="">Select category</option>
                  <option>Electronics</option><option>Fashion</option><option>Home & Kitchen</option>
                  <option>Books</option><option>Sports</option><option>Beauty</option>
                  <option>Toys</option><option>Grocery</option>
                </select>
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input className="mt-1.5" type="number" value={editProduct.stock} onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea className="mt-1.5" rows={4} value={editProduct.description} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} />
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input className="mt-1.5" value={editProduct.tags} onChange={(e) => setEditProduct({ ...editProduct, tags: e.target.value })} />
            </div>
            <div>
              <Label>Product Images</Label>
              <div className="mt-1.5">
                <CloudinaryUpload
                  images={editProduct.images}
                  onChange={(urls) => setEditProduct({ ...editProduct, images: urls })}
                  maxImages={5}
                />
              </div>
            </div>
            <CategoryFields
              category={editProduct.category}
              specs={editProduct.specs}
              onChange={(specs) => setEditProduct({ ...editProduct, specs })}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdate} className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search your products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sellerProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-1 max-w-48">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.category}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-gray-900">₹{p.price.toLocaleString()}</p>
                    {p.discount > 0 && <p className="text-xs text-green-600">-{p.discount}% off</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${p.stock < 10 ? "text-red-600" : "text-gray-800"}`}>{p.stock}</span>
                    {p.stock < 10 && <p className="text-xs text-red-500">Low stock!</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                      <span className="text-sm">{p.rating}</span>
                      <span className="text-xs text-gray-400">({p.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge className="bg-green-100 text-green-700 text-xs w-fit">Live</Badge>
                      {p.promoted && <Badge className="bg-orange-100 text-orange-700 text-xs w-fit">Promoted</Badge>}
                      {p.featured && <Badge className="bg-blue-100 text-blue-700 text-xs w-fit">Featured</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/customer/products/${p.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600" onClick={() => handleEditOpen(p)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(p.id, p.name)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sellerProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
