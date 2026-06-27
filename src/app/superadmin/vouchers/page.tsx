"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore, useHasHydrated, useVoucherStore } from "@/lib/store";
import { toast } from "sonner";
import type { Voucher, VoucherType } from "@/lib/types";

const EMPTY_FORM = {
  code: "", type: "flat" as VoucherType, value: "",
  minOrderValue: "", maxDiscount: "", validUntil: "", maxUses: "",
  description: "", active: true, categories: [] as string[],
};

export default function SuperAdminVouchersPage() {
  const { user, isAuthenticated, accessToken, sessionReady } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const router = useRouter();
  const { vouchers, addVoucher, updateVoucher, deleteVoucher } = useVoucherStore();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== "admin")) router.push("/superadmin/login");
    if (hasHydrated && sessionReady && !accessToken && isAuthenticated && user?.role === "admin") router.push("/superadmin/login");
  }, [hasHydrated, isAuthenticated, user, router]);
  if (!hasHydrated || !isAuthenticated || user?.role !== "admin") return null;

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (v: Voucher) => {
    setEditingId(v.id);
    setForm({
      code: v.code, type: v.type, value: String(v.value),
      minOrderValue: String(v.minOrderValue), maxDiscount: String(v.maxDiscount ?? ""),
      validUntil: v.validUntil.slice(0, 10), maxUses: String(v.maxUses),
      description: v.description, active: v.active, categories: v.categories ?? [],
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.code || !form.value || !form.validUntil || !form.maxUses) {
      toast.error("Fill all required fields"); return;
    }
    const payload = {
      code: form.code.toUpperCase().replace(/\s+/g, ""),
      type: form.type,
      value: parseFloat(form.value),
      minOrderValue: parseFloat(form.minOrderValue) || 0,
      maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
      validUntil: new Date(form.validUntil).toISOString(),
      maxUses: parseInt(form.maxUses),
      description: form.description,
      active: form.active,
      categories: form.categories,
    };
    if (editingId) {
      updateVoucher(editingId, payload);
      toast.success("Voucher updated");
    } else {
      addVoucher(payload);
      toast.success("Voucher created");
    }
    setOpen(false);
  };

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(`Delete voucher "${code}"?`)) {
      deleteVoucher(id);
      toast.success("Voucher deleted");
    }
  };

  const total = vouchers.length;
  const active = vouchers.filter((v) => v.active && new Date(v.validUntil) >= new Date()).length;
  const used = vouchers.reduce((s, v) => s + v.usedCount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#0d9488]" /> Voucher Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage discount codes for customers</p>
        </div>
        <Button onClick={openAdd} className="bg-[#0d9488] hover:bg-[#0f766e] text-white gap-2">
          <Plus className="w-4 h-4" /> Create Voucher
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Vouchers", value: total, color: "text-gray-800" },
          { label: "Active", value: active, color: "text-green-600" },
          { label: "Total Uses", value: used.toLocaleString(), color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Value</th>
                <th className="text-left px-4 py-3">Min Order</th>
                <th className="text-left px-4 py-3">Uses</th>
                <th className="text-left px-4 py-3">Valid Until</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vouchers.map((v) => {
                const expired = new Date(v.validUntil) < new Date();
                const full = v.usedCount >= v.maxUses;
                const statusLabel = !v.active ? "Inactive" : expired ? "Expired" : full ? "Exhausted" : "Active";
                const statusColor = !v.active || expired || full ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700";
                return (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-800">{v.code}</td>
                    <td className="px-4 py-3 capitalize">{v.type.replace("_", " ")}</td>
                    <td className="px-4 py-3 font-medium">
                      {v.type === "percentage" ? `${v.value}%` : v.type === "flat" ? `₹${v.value}` : "Free"}
                      {v.maxDiscount ? <span className="text-xs text-gray-400 ml-1">(cap ₹{v.maxDiscount})</span> : null}
                    </td>
                    <td className="px-4 py-3">₹{v.minOrderValue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span>{v.usedCount}/{v.maxUses}</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0d9488] rounded-full" style={{ width: `${Math.min(100, (v.usedCount / v.maxUses) * 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(v.validUntil).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusColor} text-xs`}>{statusLabel}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500" title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => updateVoucher(v.id, { active: !v.active })} className={`p-1.5 rounded ${v.active ? "hover:bg-red-50 text-red-400" : "hover:bg-green-50 text-green-500"}`} title={v.active ? "Deactivate" : "Activate"}>
                          {v.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(v.id, v.code)} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {vouchers.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400">No vouchers yet. Create one!</p>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{editingId ? "Edit Voucher" : "Create Voucher"}</span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Code *</Label>
                <Input className="mt-1 font-mono uppercase tracking-widest" placeholder="SAVE200" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <Label>Type *</Label>
                <select className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as VoucherType })}>
                  <option value="flat">Flat (₹ off)</option>
                  <option value="percentage">Percentage (% off)</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </div>
              <div>
                <Label>Value * {form.type === "percentage" ? "(%)" : "(₹)"}</Label>
                <Input className="mt-1" type="number" min="0" placeholder={form.type === "percentage" ? "10" : "200"} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div>
                <Label>Min Order (₹)</Label>
                <Input className="mt-1" type="number" min="0" placeholder="0" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} />
              </div>
              {form.type === "percentage" && (
                <div>
                  <Label>Max Discount (₹)</Label>
                  <Input className="mt-1" type="number" min="0" placeholder="500" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
                </div>
              )}
              <div>
                <Label>Valid Until *</Label>
                <Input className="mt-1" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
              <div>
                <Label>Max Uses *</Label>
                <Input className="mt-1" type="number" min="1" placeholder="1000" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Input className="mt-1" placeholder="₹200 off on first order above ₹999" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-teal-600" />
                <label htmlFor="active" className="text-sm text-gray-700">Active (visible to customers)</label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white" onClick={handleSave}>
                {editingId ? "Save Changes" : "Create Voucher"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
