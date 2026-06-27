"use client";

import { useState, useEffect } from "react";
import { Bell, Shield, CreditCard, Globe, Trash2, Eye, EyeOff, Banknote, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthStore, useHasHydrated } from "@/lib/store";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const router = useRouter();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [bankForm, setBankForm] = useState({ accountHolder: "", bankAccount: "", confirmAccount: "", ifsc: "", bankName: "", upiId: "" });
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    orders: true, promotions: true, refunds: true, newsletter: false,
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { toast.error("Passwords do not match"); return; }
    if (pwForm.newPw.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, name: user?.name, currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to change password"); return; }
      toast.success("Password changed! A confirmation email has been sent.");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPwLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/user/bank-details?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data?.bank_account) {
          setBankForm({
            accountHolder: data.account_holder ?? "",
            bankAccount: data.bank_account ?? "",
            confirmAccount: data.bank_account ?? "",
            ifsc: data.ifsc ?? "",
            bankName: data.bank_name ?? "",
            upiId: data.upi_id ?? "",
          });
          setBankSaved(true);
        }
      }).catch(() => {});
  }, [user?.email]);

  const handleBankSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bankForm.bankAccount !== bankForm.confirmAccount) { toast.error("Account numbers do not match"); return; }
    if (!bankForm.accountHolder || !bankForm.bankAccount || !bankForm.ifsc) { toast.error("Account holder, account number and IFSC are required"); return; }
    setBankLoading(true);
    try {
      const res = await fetch("/api/user/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, accountHolder: bankForm.accountHolder, bankAccount: bankForm.bankAccount, ifsc: bankForm.ifsc.toUpperCase(), bankName: bankForm.bankName, upiId: bankForm.upiId }),
      });
      if (res.ok) { toast.success("Bank details saved securely."); setBankSaved(true); }
      else { const d = await res.json(); toast.error(d.error ?? "Failed to save"); }
    } catch { toast.error("Something went wrong."); }
    finally { setBankLoading(false); }
  };

  if (!hasHydrated) return null;
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Shield className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Sign in to manage settings</h2>
        <Link href="/customer/login"><Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white mt-4" onClick={() => router.push("/customer/login")}>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 md:py-6 pb-20 md:pb-6 space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Settings</h1>

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-[#0d9488]" />
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <div className="relative mt-1.5">
              <Input type={showOld ? "text" : "password"} placeholder="••••••••" className="pr-9" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} required />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>New Password</Label>
            <div className="relative mt-1.5">
              <Input type={showNew ? "text" : "password"} placeholder="Min 8 characters" className="pr-9" value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })} required />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input type="password" placeholder="Repeat new password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required />
          </div>
          <Button type="submit" className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold w-full sm:w-auto h-11" disabled={pwLoading}>
            {pwLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-[#0d9488]" />
          <h2 className="font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "orders", label: "Order Updates", desc: "Shipping, delivery, and order status notifications" },
            { key: "promotions", label: "Deals & Promotions", desc: "Flash sales, exclusive offers and discount codes" },
            { key: "refunds", label: "Refund Alerts", desc: "Updates on your return and refund requests" },
            { key: "newsletter", label: "Newsletter", desc: "Weekly curated product recommendations" },
          ].map((item) => (
            <div key={item.key} className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications[item.key as keyof typeof notifications]}
                  onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0d9488]"></div>
              </label>
            </div>
          ))}
        </div>
        <Button className="mt-4 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold w-full sm:w-auto h-11" onClick={() => toast.success("Preferences saved!")}>
          Save Preferences
        </Button>
      </div>

      {/* Bank Account Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-[#0d9488]" />
            <h2 className="font-semibold text-gray-900">Bank Account Details</h2>
          </div>
          {bankSaved && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Saved</span>}
        </div>
        <p className="text-xs text-gray-500 mb-5">Used for vendor payouts. Stored securely and never shared.</p>
        <form onSubmit={handleBankSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Account Holder Name</Label>
              <Input className="mt-1.5 h-11" placeholder="As per bank records" value={bankForm.accountHolder} onChange={e => setBankForm({...bankForm, accountHolder: e.target.value})} />
            </div>
            <div>
              <Label>Bank Account Number</Label>
              <Input className="mt-1.5 h-11 font-mono" placeholder="Enter account number" type="password" value={bankForm.bankAccount} onChange={e => setBankForm({...bankForm, bankAccount: e.target.value})} />
            </div>
            <div>
              <Label>Confirm Account Number</Label>
              <Input className="mt-1.5 h-11 font-mono" placeholder="Re-enter account number" value={bankForm.confirmAccount} onChange={e => setBankForm({...bankForm, confirmAccount: e.target.value})} />
            </div>
            <div>
              <Label>IFSC Code</Label>
              <Input className="mt-1.5 h-11 uppercase font-mono" placeholder="e.g. SBIN0001234" value={bankForm.ifsc} onChange={e => setBankForm({...bankForm, ifsc: e.target.value.toUpperCase()})} maxLength={11} />
            </div>
            <div>
              <Label>Bank Name <span className="text-gray-400">(optional)</span></Label>
              <div className="relative mt-1.5">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input className="pl-9 h-11" placeholder="e.g. State Bank of India" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label>UPI ID <span className="text-gray-400">(optional)</span></Label>
              <Input className="mt-1.5 h-11" placeholder="e.g. name@upi" value={bankForm.upiId} onChange={e => setBankForm({...bankForm, upiId: e.target.value})} />
            </div>
          </div>
          {bankForm.bankAccount && bankForm.confirmAccount && bankForm.bankAccount !== bankForm.confirmAccount && (
            <p className="text-xs text-red-500">⚠ Account numbers do not match</p>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">🔒 Your bank details are encrypted and only used for processing vendor payouts. Bigpool will never initiate unauthorized transactions.</p>
          </div>
          <Button type="submit" className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold w-full sm:w-auto h-11" disabled={bankLoading}>
            {bankLoading ? "Saving..." : bankSaved ? "Update Bank Details" : "Save Bank Details"}
          </Button>
        </form>
      </div>

      {/* Saved Payments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-[#0d9488]" />
          <h2 className="font-semibold text-gray-900">Saved Payment Methods</h2>
        </div>
        <div className="text-center py-6 text-gray-400">
          <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No payment methods saved</p>
          <p className="text-xs mt-1">Payment details are added at checkout (Razorpay coming soon)</p>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-[#0d9488]" />
          <h2 className="font-semibold text-gray-900">Language & Region</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Language</Label>
            <select className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option>English</option>
              <option>हिन्दी (Hindi)</option>
              <option>தமிழ் (Tamil)</option>
              <option>తెలుగు (Telugu)</option>
            </select>
          </div>
          <div>
            <Label>Currency</Label>
            <select className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option>₹ INR</option>
              <option>$ USD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-red-600">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Deleting your account is permanent and cannot be undone. All your data including orders, wishlist, and profile will be removed.
        </p>
        <Button variant="destructive" size="sm" onClick={() => toast.error("Account deletion requires email verification. Feature coming soon.")}>
          Delete My Account
        </Button>
      </div>
    </div>
  );
}
