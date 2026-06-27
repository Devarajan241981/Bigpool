"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function PushPermission() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!VAPID_PUBLIC) return;
    // Already granted — just re-subscribe silently
    if (Notification.permission === "granted") {
      subscribe(user.id);
      return;
    }
    // Ask after 4 seconds (don't interrupt immediately)
    if (Notification.permission === "default") {
      const t = setTimeout(() => requestAndSubscribe(user.id), 4000);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

async function requestAndSubscribe(userId: string) {
  const perm = await Notification.requestPermission();
  if (perm === "granted") await subscribe(userId);
}

async function subscribe(userId: string) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), userId }),
    });
  } catch {
    // Silently fail — push is optional
  }
}
