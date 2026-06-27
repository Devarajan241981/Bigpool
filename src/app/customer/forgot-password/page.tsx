"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.demoOtp) setDemoOtp(data.demoOtp);
      setSent(true);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#0d9488]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-500 text-sm mb-4">
              We sent a 6-digit OTP to <strong>{email}</strong>. Enter it on the next page to reset your password.
            </p>

            {demoOtp && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-xs font-semibold text-amber-700 mb-1">Demo Mode — OTP (no email service configured):</p>
                <p className="text-2xl font-bold tracking-widest text-center text-amber-900">{demoOtp}</p>
              </div>
            )}

            <Button
              className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold h-11"
              onClick={() => router.push(`/customer/reset-password?email=${encodeURIComponent(email)}`)}
            >
              Enter OTP & Reset Password
            </Button>
            <button
              className="mt-3 text-sm text-gray-400 hover:text-gray-600"
              onClick={() => { setSent(false); setDemoOtp(null); }}
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/customer/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h1>
          <p className="text-gray-500 text-sm mb-6">Enter your email and we&apos;ll send you a reset code.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-9"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold h-11"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
