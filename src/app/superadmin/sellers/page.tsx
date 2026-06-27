"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store, CheckCircle, XCircle, Clock, Search,
  Mail, FileText, Shield, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSellerApplicationStore, useAuthStore, useHasHydrated } from "@/lib/store";
// useSellerApplicationStore kept for updateStatus (syncs same-browser customer status view)
import type { Seller } from "@/lib/types";
import type { SellerApplication } from "@/lib/store";
import { toast } from "sonner";

type DisplayEntry =
  | { type: "seller"; data: Seller }
  | { type: "application"; data: SellerApplication };

export default function SuperAdminSellersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [apiApps, setApiApps] = useState<SellerApplication[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [selectedApp, setSelectedApp] = useState<SellerApplication | null>(null);
  const { updateStatus: updateAppStatus } = useSellerApplicationStore();

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "admin")) router.push("/superadmin/login");
  }, [hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.role === "admin") {
      fetch("/api/sellers")
        .then((r) => r.ok ? r.json() : [])
        .then(setSellers)
        .catch(() => {});
      fetch("/api/vendor-applications")
        .then((r) => r.ok ? r.json() : [])
        .then(setApiApps)
        .catch(() => {});
    }
  }, [hasHydrated, isAuthenticated, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasHydrated || !isAuthenticated || user?.role !== "admin") return null;

  const updateSellerStatus = (sellerId: string, status: "approved" | "rejected") => {
    fetch(`/api/sellers/${sellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    setSellers(sellers.map((s) => s.id === sellerId ? { ...s, status, verified: status === "approved" } : s));
    setSelectedSeller(null);
    toast.success(`Seller ${status === "approved" ? "approved" : "rejected"} successfully.`);
  };

  const updateApplicationStatus = (id: string, status: "approved" | "rejected") => {
    // Update server
    fetch("/api/vendor-applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
    // Update local Zustand store too (for same-browser customer status page)
    updateAppStatus(id, status);
    setApiApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    setSelectedApp(null);
    toast.success(`Application ${status === "approved" ? "approved — vendor can now log in" : "rejected"}.`);
  };

  const allEntries: DisplayEntry[] = [
    ...sellers.map((s): DisplayEntry => ({ type: "seller", data: s })),
    ...apiApps.map((a): DisplayEntry => ({ type: "application", data: a })),
  ];

  const filtered = allEntries.filter((entry) => {
    const name = entry.type === "seller" ? entry.data.businessName : entry.data.businessName;
    const email = entry.type === "seller" ? entry.data.email : entry.data.email;
    const status = entry.type === "seller" ? entry.data.status : entry.data.status;
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: allEntries.length,
    pending: allEntries.filter((e) => (e.type === "seller" ? e.data.status : e.data.status) === "pending").length,
    approved: allEntries.filter((e) => (e.type === "seller" ? e.data.status : e.data.status) === "approved").length,
    rejected: allEntries.filter((e) => (e.type === "seller" ? e.data.status : e.data.status) === "rejected").length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Store className="w-5 h-5 text-[#0d9488]" />
        <h1 className="text-2xl font-bold text-gray-900">Seller Management</h1>
        {apiApps.filter(a => a.status === "pending").length > 0 && (
          <Badge className="bg-blue-100 text-blue-700 text-xs">{apiApps.filter(a => a.status === "pending").length} new application(s)</Badge>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? "bg-[#1e293b] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? "bg-white/20" : "bg-gray-100"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search by business name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Entries list */}
      <div className="space-y-3">
        {filtered.map((entry, idx) => {
          if (entry.type === "seller") {
            const seller = entry.data;
            return (
              <div key={`s-${seller.id}`} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-lg">
                      {seller.businessName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{seller.businessName}</h3>
                        {seller.verified && <Shield className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-sm text-gray-600">{seller.name}</p>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{seller.email}</span>
                    </div>
                  </div>
                  <Badge className={`text-xs capitalize ${
                    seller.status === "approved" ? "bg-green-100 text-green-700" :
                    seller.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {seller.status === "pending" ? <><Clock className="w-3 h-3 mr-1 inline" />Pending</> :
                     seller.status === "approved" ? <><CheckCircle className="w-3 h-3 mr-1 inline" />Approved</> :
                     <><XCircle className="w-3 h-3 mr-1 inline" />Rejected</>}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold">{seller.products.length}</p><p className="text-xs text-gray-500">Products</p></div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold">{seller.totalSales.toLocaleString()}</p><p className="text-xs text-gray-500">Sales</p></div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold">{seller.rating}★</p><p className="text-xs text-gray-500">Rating</p></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedSeller(seller)}>
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> View Details
                  </Button>
                  {seller.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5" onClick={() => updateSellerStatus(seller.id, "approved")}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="text-xs gap-1.5" onClick={() => updateSellerStatus(seller.id, "rejected")}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {seller.status === "rejected" && (
                    <Button size="sm" variant="outline" className="text-xs text-green-600 border-green-300 hover:bg-green-50 gap-1.5" onClick={() => updateSellerStatus(seller.id, "approved")}>
                      <CheckCircle className="w-3.5 h-3.5" /> Re-Approve
                    </Button>
                  )}
                  {seller.status === "approved" && (
                    <Button size="sm" variant="outline" className="text-xs text-red-600 border-red-300 hover:bg-red-50" onClick={() => updateSellerStatus(seller.id, "rejected")}>
                      Suspend
                    </Button>
                  )}
                </div>
              </div>
            );
          } else {
            const app = entry.data;
            return (
              <div key={`a-${app.id}`} className="bg-white rounded-xl border-2 border-blue-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                      {app.businessName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{app.businessName}</h3>
                        <Badge className="bg-blue-100 text-blue-700 text-xs">New Application</Badge>
                        {app.fromCustomer && <Badge className="bg-purple-100 text-purple-700 text-xs flex items-center gap-0.5"><User className="w-2.5 h-2.5" /> Customer</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">{app.name}</p>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                    </div>
                  </div>
                  <Badge className={`text-xs capitalize ${
                    app.status === "approved" ? "bg-green-100 text-green-700" :
                    app.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {app.status === "pending" ? <><Clock className="w-3 h-3 mr-1 inline" />Pending</> :
                     app.status === "approved" ? <><CheckCircle className="w-3 h-3 mr-1 inline" />Approved</> :
                     <><XCircle className="w-3 h-3 mr-1 inline" />Rejected</>}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold text-xs">{app.category || "—"}</p><p className="text-xs text-gray-500">Category</p></div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold text-xs">{app.gstin || "Not provided"}</p><p className="text-xs text-gray-500">GSTIN</p></div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="font-bold text-xs">{app.submittedAt}</p><p className="text-xs text-gray-500">Applied</p></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedApp(app)}>
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> View Application
                  </Button>
                  {app.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5" onClick={() => updateApplicationStatus(app.id, "approved")}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="text-xs gap-1.5" onClick={() => updateApplicationStatus(app.id, "rejected")}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {app.status === "rejected" && (
                    <Button size="sm" variant="outline" className="text-xs text-green-600 border-green-300 hover:bg-green-50 gap-1.5" onClick={() => updateApplicationStatus(app.id, "approved")}>
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </Button>
                  )}
                </div>
              </div>
            );
          }
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No sellers or applications found</p>
          </div>
        )}
      </div>

      {/* Seller detail dialog */}
      <Dialog open={!!selectedSeller} onOpenChange={() => setSelectedSeller(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Seller — {selectedSeller?.businessName}</DialogTitle></DialogHeader>
          {selectedSeller && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Business Name", value: selectedSeller.businessName },
                  { label: "Owner", value: selectedSeller.name },
                  { label: "Email", value: selectedSeller.email },
                  { label: "GSTIN", value: selectedSeller.gstin || "Not provided" },
                  { label: "Products", value: selectedSeller.products.length },
                  { label: "Total Sales", value: selectedSeller.totalSales.toLocaleString() },
                  { label: "Rating", value: `${selectedSeller.rating} / 5` },
                  { label: "Applied", value: selectedSeller.createdAt },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                    <p className="font-medium text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
              {selectedSeller.status === "pending" && (
                <div className="flex gap-3">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => updateSellerStatus(selectedSeller.id, "approved")}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => updateSellerStatus(selectedSeller.id, "rejected")}>
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Application detail dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Vendor Application — {selectedApp?.businessName}</DialogTitle></DialogHeader>
          {selectedApp && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Business Name", value: selectedApp.businessName },
                  { label: "Applicant", value: selectedApp.name },
                  { label: "Email", value: selectedApp.email },
                  { label: "Phone", value: selectedApp.phone || "—" },
                  { label: "GSTIN", value: selectedApp.gstin || "Not provided" },
                  { label: "Category", value: selectedApp.category || "—" },
                  { label: "Bank Account", value: selectedApp.bankAccount ? "****" + selectedApp.bankAccount.slice(-4) : "—" },
                  { label: "Applied", value: selectedApp.submittedAt },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                    <p className="font-medium text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
              {selectedApp.description && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="text-xs text-gray-500 mb-1">Business Description</p>
                  <p className="text-gray-700">{selectedApp.description}</p>
                </div>
              )}
              {selectedApp.status === "pending" && (
                <div className="flex gap-3">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => updateApplicationStatus(selectedApp.id, "approved")}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve Vendor
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => updateApplicationStatus(selectedApp.id, "rejected")}>
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
