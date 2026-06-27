"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const emailParam = params.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam, otp, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Reset failed"); return; }
      setDone(true);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
        <p className="text-gray-500 text-sm mb-6">Your password has been updated. You can now sign in.</p>
        <Button
          className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold h-11"
          onClick={() => router.push("/customer/login")}
        >
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h1>
      <p className="text-gray-500 text-sm mb-6">
        Enter the 6-digit code sent to <strong>{emailParam || "your email"}</strong> and choose a new password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>OTP Code</Label>
          <Input
            className="mt-1.5 text-center text-2xl font-bold tracking-widest h-12"
            placeholder="------"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            autoFocus
          />
        </div>
        <div>
          <Label>New Password</Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9 pr-9"
              type={showPass ? "text" : "password"}
              placeholder="Min 8 characters"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <Label>Confirm Password</Label>
          <Input
            className="mt-1.5"
            type="password"
            placeholder="Repeat password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold h-11"
          disabled={loading || otp.length < 6}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/customer/forgot-password" className="text-sm text-[#0d9488] hover:underline">
          Didn&apos;t get a code? Resend
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/customer/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
