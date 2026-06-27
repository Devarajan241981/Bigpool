"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  // Lazy initializer — runs synchronously on first client render, no flash
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (sessionStorage.getItem("splashed")) return false;
    sessionStorage.setItem("splashed", "1");
    return true;
  });

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes sp-bg-fade {
          0%    { opacity: 1; }
          80%   { opacity: 1; }
          100%  { opacity: 0; }
        }
        @keyframes sp-logo-in {
          0%   { opacity: 0; transform: scale(0.4) rotate(-8deg); }
          60%  { opacity: 1; transform: scale(1.12) rotate(2deg); }
          80%  { transform: scale(0.96) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes sp-glow {
          0%   { opacity: 0; transform: scale(0.6); }
          50%  { opacity: 1; transform: scale(1.4); }
          100% { opacity: 0; transform: scale(2); }
        }
        @keyframes sp-letter {
          0%   { opacity: 0; transform: translateY(24px) scale(0.8); }
          60%  { opacity: 1; transform: translateY(-3px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sp-tag {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp-line {
          0%   { width: 0; opacity: 0; }
          100% { width: 48px; opacity: 1; }
        }

        .sp-wrap    { animation: sp-bg-fade 2.6s ease forwards; }
        .sp-logo    { animation: sp-logo-in 0.65s 0.15s cubic-bezier(0.34,1.56,0.64,1) both; }
        .sp-glow    { animation: sp-glow   0.9s 0.25s ease forwards; }
        .sp-tag     { animation: sp-tag    0.5s 1.15s ease both; }
        .sp-line    { animation: sp-line   0.5s 1.35s ease both; }
      `}</style>

      <div
        className="sp-wrap fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f172a]"
        style={{ pointerEvents: "all" }}
      >
        {/* Glow ring behind logo */}
        <div
          className="sp-glow absolute rounded-full"
          style={{
            width: 180,
            height: 180,
            background: "radial-gradient(circle, rgba(13,148,136,0.45) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div className="sp-logo relative z-10" style={{ width: 96, height: 96 }}>
          <img
            src="/logo.png"
            alt="Bigpool"
            width={96}
            height={96}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        </div>

        {/* Brand name — staggered letters */}
        <div
          className="relative z-10 flex items-baseline mt-6"
          style={{ gap: 1 }}
          aria-label="Bigpool"
        >
          {"Bigpool".split("").map((l, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                animation: `sp-letter 0.45s ${0.45 + i * 0.07}s cubic-bezier(0.34,1.4,0.64,1) both`,
                fontSize: 38,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: -0.5,
                lineHeight: 1,
              }}
            >
              {l}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <p
          className="sp-tag relative z-10"
          style={{
            color: "#64748b",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginTop: 10,
          }}
        >
          India&apos;s Favourite Marketplace
        </p>

        {/* Teal accent bar */}
        <div
          className="sp-line relative z-10"
          style={{
            height: 3,
            borderRadius: 99,
            background: "linear-gradient(90deg, #0d9488, #14b8a6)",
            marginTop: 14,
          }}
        />
      </div>
    </>
  );
}
