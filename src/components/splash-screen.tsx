"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("splashed")) { setVisible(false); return; }
    sessionStorage.setItem("splashed", "1");
    const t = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        /* ── Wrapper fades out at the end ── */
        @keyframes sp-out {
          0%,75% { opacity:1; }
          100%   { opacity:0; }
        }
        /* ── Left half slides in from left ── */
        @keyframes sp-left {
          0%   { transform: translateX(-110%); }
          55%  { transform: translateX(2%); }
          70%  { transform: translateX(-1%); }
          100% { transform: translateX(0); }
        }
        /* ── Right half slides in from right ── */
        @keyframes sp-right {
          0%   { transform: translateX(110%); }
          55%  { transform: translateX(-2%); }
          70%  { transform: translateX(1%); }
          100% { transform: translateX(0); }
        }
        /* ── Flash at collision ── */
        @keyframes sp-flash {
          0%,45% { opacity:0; transform:scale(0.5); }
          55%    { opacity:1; transform:scale(1.2); }
          75%    { opacity:0; transform:scale(1.6); }
          100%   { opacity:0; }
        }
        /* ── Logo gentle pulse after merge ── */
        @keyframes sp-pulse {
          0%,55% { filter: brightness(1); }
          65%    { filter: brightness(1.4) drop-shadow(0 0 18px #0d9488cc); }
          80%    { filter: brightness(1); }
          100%   { filter: brightness(1); }
        }
        /* ── Tagline slides up ── */
        @keyframes sp-tagline {
          0%,60%  { opacity:0; transform:translateY(12px); }
          80%     { opacity:1; transform:translateY(0); }
          100%    { opacity:1; transform:translateY(0); }
        }

        .sp-wrap   { animation: sp-out   2.4s ease forwards; }
        .sp-left   { animation: sp-left  0.9s 0.15s cubic-bezier(0.22,1,0.36,1) both; }
        .sp-right  { animation: sp-right 0.9s 0.15s cubic-bezier(0.22,1,0.36,1) both; }
        .sp-flash  { animation: sp-flash 0.9s 0.15s ease forwards; }
        .sp-pulse  { animation: sp-pulse 0.9s 0.15s ease forwards; }
        .sp-tagline{ animation: sp-tagline 2.4s ease forwards; }
      `}</style>

      <div className="sp-wrap fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f172a]">

        {/* ── Merging logo ── */}
        <div className="sp-pulse relative" style={{ width: 180, height: 180 }}>

          {/* Left half — the "b" slides in */}
          <div
            className="sp-left absolute inset-0 overflow-hidden"
            style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}
          >
            <img src="/logo.png" alt="" width={180} height={180} style={{ display:"block", mixBlendMode:"screen" }} />
          </div>

          {/* Right half — the cart slides in */}
          <div
            className="sp-right absolute inset-0 overflow-hidden"
            style={{ clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)" }}
          >
            <img src="/logo.png" alt="" width={180} height={180} style={{ display:"block", mixBlendMode:"screen" }} />
          </div>

          {/* Collision flash ring */}
          <div
            className="sp-flash absolute inset-0 m-auto rounded-full pointer-events-none"
            style={{
              width: 80,
              height: 80,
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              background: "radial-gradient(circle, #0d9488aa 0%, transparent 70%)",
            }}
          />
        </div>
      </div>
    </>
  );
}
