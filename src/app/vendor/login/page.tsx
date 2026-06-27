"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

export default function VendorLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Invalid credentials"); return; }
      if (data.user.role !== "seller" && data.user.role !== "admin") { toast.error("This portal is for vendors only."); return; }
      login(data.user, data.accessToken ?? "");
      toast.success(`Welcome back, ${data.user.name}!`);
      const dest = data.user.role === "admin" ? "/superadmin/dashboard" : "/vendor/dashboard";
      router.push(dest);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="Bigpool" width={48} height={48} style={{ mixBlendMode: "multiply" }} />
          </Link>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Store className="w-4 h-4 text-[#0d9488]" />
            <p className="text-gray-600 text-sm font-medium">Vendor Sign In</p>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">bigpool.com/vendor/login</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Vendor Sign In</h1>
          <p className="text-gray-500 text-sm mb-6">Manage your store, products, and orders.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Vendor Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input className="pl-9" type="email" placeholder="you@business.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label>Password</Label>
                <Link href="/customer/forgot-password" className="text-xs text-[#0d9488] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input className="pl-9 pr-9" type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold h-11" disabled={loading}>
              {loading ? "Signing in..." : "Sign In to Vendor Portal"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            Not a vendor yet?{" "}
            <Link href="/vendor/application/signup" className="text-[#0d9488] hover:underline font-medium">Apply here</Link>
          </div>

        </div>
      </div>
    </div>
  );
}
