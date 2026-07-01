"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});

    // When a new service worker activates it sends SW_UPDATED.
    // Reload immediately so this tab gets fresh HTML with the correct JS chunk hashes.
    // Without this, old HTML + new chunks = React never hydrates = buttons do nothing.
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data?.type === "SW_UPDATED") {
        window.location.reload();
      }
    });
  }, []);
  return null;
}
