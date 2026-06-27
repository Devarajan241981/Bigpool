"use client";

import { useEffect, useState } from "react";

const LETTERS = ["B", "i", "g", "p", "o", "o", "l"];

export default function SplashScreen() {
  const [phase, setPhase] = useState<"hidden" | "in" | "hold" | "out">("hidden");

  useEffect(() => {
    if (sessionStorage.getItem("splashed")) return;
    sessionStorage.setItem("splashed", "1");

    // Phase timeline: in → hold → out
    setPhase("in");
    const t1 = setTimeout(() => setPhase("hold"), 700);
    const t2 = setTimeout(() => setPhase("out"), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "hidden") return null;

  return (
    <>
      <style>{`
        @keyframes logo-pop {
          0%   { opacity:0; transform:scale(0.7) translateY(8px); }
          60%  { opacity:1; transform:scale(1.06) translateY(-2px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes letter-drop {
          0%   { opacity:0; transform:translateY(-18px) scale(0.7); }
          70%  { opacity:1; transform:translateY(2px) scale(1.05); }
          100% { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes tagline-up {
          0%   { opacity:0; transform:translateY(10px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes sp-fade-in {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes sp-fade-out {
          from { opacity:1; }
          to   { opacity:0; }
        }
        .sp-in  { animation: sp-fade-in  0.2s ease forwards; }
        .sp-out { animation: sp-fade-out 0.4s ease forwards; }
      `}</style>

      <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f172a] ${phase === "out" ? "sp-out" : "sp-in"}`}
        style={{ pointerEvents: phase === "out" ? "none" : "all" }}
      >
        {/* Logo */}
        <div
          style={{
            animation: "logo-pop 0.5s 0.05s cubic-bezier(0.34,1.56,0.64,1) both",
            width: 96,
            height: 96,
            marginBottom: 28,
          }}
        >
          <img
            src="/logo.png"
            alt="Bigpool"
            width={96}
            height={96}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        {/* Brand name — letter-by-letter reveal */}
        <div className="flex items-baseline gap-[2px] mb-3">
          {LETTERS.map((l, i) => (
            <span
              key={i}
              style={{
                animation: `letter-drop 0.4s ${0.18 + i * 0.06}s cubic-bezier(0.34,1.3,0.64,1) both`,
                fontSize: 36,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: -0.5,
                lineHeight: 1,
                display: "inline-block",
              }}
            >
              {l}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <p
          style={{
            animation: "tagline-up 0.5s 0.75s ease both",
            color: "#94a3b8",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          India&apos;s Favourite Marketplace
        </p>

        {/* Teal accent line */}
        <div
          style={{
            animation: "tagline-up 0.5s 0.9s ease both",
            width: 40,
            height: 3,
            borderRadius: 99,
            background: "#0d9488",
            marginTop: 16,
          }}
        />
      </div>
    </>
  );
}
