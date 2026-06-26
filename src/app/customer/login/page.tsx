"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

export default function CustomerLoginPage() {
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
      if (!res.ok) {
        toast.error(data.error ?? "Invalid email or password");
        return;
      }
      login(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push(data.user.role === "seller" ? "/vendor/dashboard" : data.user.role === "admin" ? "/superadmin/dashboard" : "/");
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
            <div className="text-3xl font-extrabold">
              <span className="text-gray-900">Shop</span>
              <span className="text-[#0d9488]">Hub</span>
            </div>
          </Link>
          <p className="text-gray-500 text-sm mt-1">Customer Sign In</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h1>
          <p className="text-gray-500 text-sm mb-6">Welcome back! Shop millions of products.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-9" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-[#0d9488] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="password" type={showPass ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-9" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold h-11" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/customer/signup" className="text-[#0d9488] hover:underline font-medium">Create one</Link>
          </div>

          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-gray-500 mb-2">Want to sell on Bigpool?</p>
            <Link href="/vendor/application/signup">
              <Button variant="outline" className="w-full text-sm border-[#0d9488] text-[#0d9488] hover:bg-teal-50">
                Apply as a Vendor
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
