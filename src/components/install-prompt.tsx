"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa-dismissed")) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) { setIsInstalled(true); return; }

    setIsIOS(ios);
    if (ios) {
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-dismissed", "1");
  };

  if (!show || isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 md:left-auto md:right-4 md:bottom-4 md:w-80 z-50 bg-[#1e293b] text-white rounded-2xl shadow-2xl p-4 flex gap-3 items-start animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#0d9488] rounded-xl p-2 flex-shrink-0">
        <Smartphone className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install Bigpool App</p>
        {isIOS ? (
          <p className="text-xs text-gray-300 mt-0.5">
            Tap <span className="font-bold">Share</span> → <span className="font-bold">Add to Home Screen</span> to install
          </p>
        ) : (
          <p className="text-xs text-gray-300 mt-0.5">Get faster access, offline support & app-like experience</p>
        )}
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="mt-2 flex items-center gap-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Install Now
          </button>
        )}
      </div>
      <button onClick={handleDismiss} className="text-gray-400 hover:text-white flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
