"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gift, Copy, Share2, CheckCircle, Users, Wallet, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore, useWalletStore } from "@/lib/store";
import { toast } from "sonner";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bigpool.in";

export default function ReferPage() {
  const { user } = useAuthStore();
  const { credit } = useWalletStore();
  const [copied, setCopied] = useState(false);
  const [pendingCredits, setPendingCredits] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [claiming, setClaiming] = useState(false);

  const referralCode = user?.id ?? "";
  const referralLink = `${BASE}/customer/signup?ref=${referralCode}`;

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/referral/pending?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.credits > 0) {
          setPendingCredits(d.credits);
          setPendingCount(d.count);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const claimCredits = () => {
    if (pendingCredits <= 0) return;
    setClaiming(true);
    credit(pendingCredits, `Referral reward — ${pendingCount} friend${pendingCount > 1 ? "s" : ""} joined Bigpool`, undefined, "cashback");
    toast.success(`₹${pendingCredits} added to your wallet! 🎉`);
    setPendingCredits(0);
    setPendingCount(0);
    setClaiming(false);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    const text = `🛍️ Hey! I'm shopping on Bigpool — India's marketplace. Sign up with my link and get ₹100 FREE in your wallet! 🎉\n\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join Bigpool & get ₹100 free!",
        text: `Sign up on Bigpool with my referral link and get ₹100 free in your wallet!`,
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Gift className="w-12 h-12 text-[#0d9488] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Login to Refer & Earn</h2>
        <Link href="/customer/login"><Button className="bg-[#0d9488] text-white">Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
      <Link href="/customer/profile" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0d9488] mb-4">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Profile
      </Link>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f172a] to-[#0d9488] rounded-2xl p-6 text-white text-center mb-6">
        <div className="text-4xl mb-2">🎁</div>
        <h1 className="text-2xl font-bold mb-1">Refer & Earn</h1>
        <p className="text-teal-100 text-sm">Share Bigpool with friends. They get <strong>₹100</strong> free, and so do you!</p>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-800 mb-4">How it works</h2>
        <div className="space-y-4">
          {[
            { icon: Share2, title: "Share your link", desc: "Send your unique referral link to friends via WhatsApp or any app" },
            { icon: Users, title: "Friend signs up", desc: "Your friend creates a Bigpool account using your link" },
            { icon: Wallet, title: "Both get ₹100", desc: "Your friend gets ₹100 in wallet instantly. You earn ₹100 too!" },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-[#0d9488]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending claim */}
      {pendingCredits > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">₹{pendingCredits} reward waiting!</p>
              <p className="text-xs text-green-700">{pendingCount} friend{pendingCount > 1 ? "s" : ""} joined using your link</p>
            </div>
          </div>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs flex-shrink-0" onClick={claimCredits} disabled={claiming}>
            Claim ₹{pendingCredits}
          </Button>
        </div>
      )}

      {/* Referral link */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Your referral link</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-600 break-all mb-3 font-mono">
          {referralLink}
        </div>
        <div className="flex gap-2">
          <Button onClick={copyLink} variant="outline" className="flex-1 border-[#0d9488] text-[#0d9488] hover:bg-teal-50 text-sm h-10">
            {copied ? <CheckCircle className="w-4 h-4 mr-1.5 text-green-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button onClick={shareNative} className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm h-10">
            <Share2 className="w-4 h-4 mr-1.5" />
            Share
          </Button>
        </div>
      </div>

      {/* WhatsApp share */}
      <Button
        onClick={shareWhatsApp}
        className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold h-12 text-sm"
      >
        <MessageCircle className="w-5 h-5 mr-2" />
        Share on WhatsApp
      </Button>

      <p className="text-xs text-gray-400 text-center mt-4">
        ₹100 wallet credit is valid for purchases on Bigpool. Terms apply.
      </p>
    </div>
  );
}
