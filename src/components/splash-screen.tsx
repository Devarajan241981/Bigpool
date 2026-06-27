"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [phase, setPhase] = useState<"show" | "fade" | "done">("show");

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("splashed")) {
      setPhase("done");
      return;
    }
    sessionStorage.setItem("splashed", "1");

    // After 1.3s start fading out
    const t1 = setTimeout(() => setPhase("fade"), 1300);
    // After fade completes (300ms) remove from DOM
    const t2 = setTimeout(() => setPhase("done"), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1e293b]"
      style={{
        transition: "opacity 300ms ease-out",
        opacity: phase === "fade" ? 0 : 1,
        pointerEvents: phase === "fade" ? "none" : "all",
      }}
    >
      {/* Ripple rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className="absolute rounded-full border border-[#0d9488]/30"
            style={{
              width: `${i * 100}px`,
              height: `${i * 100}px`,
              animation: `splash-ring 1.4s ${i * 0.18}s ease-out both`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div
        className="relative z-10 text-5xl font-extrabold tracking-tight select-none"
        style={{ animation: "splash-logo 0.6s 0.1s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <span className="text-white">Big</span>
        <span className="text-[#0d9488]">pool</span>
      </div>

      {/* Tagline */}
      <p
        className="text-gray-400 text-sm mt-3 tracking-widest uppercase"
        style={{ animation: "splash-tag 0.5s 0.55s ease both" }}
      >
        India&apos;s Favourite Marketplace
      </p>

      {/* Loading bar */}
      <div className="absolute bottom-16 w-32 h-0.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0d9488] rounded-full"
          style={{ animation: "splash-bar 1.3s 0.1s ease-in-out both" }}
        />
      </div>

      <style>{`
        @keyframes splash-logo {
          0%   { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes splash-tag {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-ring {
          0%   { opacity: 0.6; transform: scale(0.3); }
          100% { opacity: 0;   transform: scale(1); }
        }
        @keyframes splash-bar {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
