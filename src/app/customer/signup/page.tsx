"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, Phone, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore, useWalletStore } from "@/lib/store";
import { toast } from "sonner";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";

  const { login } = useAuthStore();
  const { credit } = useWalletStore();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    if (!agreed) { toast.error("Please accept the terms"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Registration failed"); setLoading(false); return; }

      login(data.user, data.accessToken ?? "");

      // Apply referral credit if came via a referral link
      if (refCode && refCode !== data.user.id) {
        try {
          const refRes = await fetch("/api/referral/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              referrerId: refCode,
              refereeId: data.user.id,
              refereeEmail: data.user.email,
            }),
          });
          const refData = await refRes.json();
          if (refData.ok && !refData.selfReferral) {
            credit(100, "Referral welcome bonus 🎉", undefined, "cashback");
            toast.success("Welcome to Bigpool! ₹100 added to your wallet 🎉");
            router.push("/customer/profile/wallet");
            return;
          }
        } catch {
          // Non-blocking
        }
      }

      toast.success("Welcome to Bigpool! Happy Shopping 🎉");
      router.push("/");
    } catch {
      login({ id: `c_${Date.now()}`, name: form.name, email: form.email, phone: form.phone, role: "customer", createdAt: new Date().toISOString() }, "");
      toast.success("Welcome to Bigpool! Happy Shopping 🎉");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="Bigpool" width={48} height={48} style={{ mixBlendMode: "multiply" }} />
          </Link>
          <p className="text-gray-500 text-sm mt-1">Customer Registration</p>
        </div>

        {refCode && (
          <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <Gift className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">You have a referral bonus!</p>
              <p className="text-xs text-green-700">Sign up now and get <strong>₹100 free</strong> in your Bigpool wallet.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
          <p className="text-gray-500 text-sm mb-6">Join millions of happy shoppers.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <div className="relative mt-1.5"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input className="pl-9" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="relative mt-1.5"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input className="pl-9" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            </div>
            <div>
              <Label>Phone</Label>
              <div className="relative mt-1.5"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input className="pl-9" placeholder="+91 9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative mt-1.5"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input className="pl-9 pr-9" type={showPass ? "text" : "password"} placeholder="Min 8 characters" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="Repeat password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
              <label htmlFor="terms" className="text-xs text-gray-600">I agree to Bigpool's <Link href="/terms" className="text-[#0d9488] hover:underline">Terms of Service</Link> and Privacy Policy</label>
            </div>
            <Button type="submit" className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold h-11" disabled={loading}>
              {loading ? "Creating account..." : refCode ? "Create Account & Claim ₹100 🎉" : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            Already have an account? <Link href="/customer/login" className="text-[#0d9488] hover:underline font-medium">Sign in</Link>
          </div>

          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-gray-500 mb-2">Want to sell products?</p>
            <Link href="/vendor/application/signup">
              <Button variant="outline" className="w-full text-sm border-[#0d9488] text-[#0d9488] hover:bg-teal-50">Apply as a Vendor →</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerSignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
