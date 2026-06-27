"use client";

import { useEffect } from "react";
import { useAuthStore, useHasHydrated } from "@/lib/store";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, setAccessToken, logout } = useAuthStore();
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    // Wait until Zustand has hydrated from localStorage before checking auth
    // state. Without this, isAuthenticated reads as false (initial value) and
    // the refresh is skipped — leaving accessToken null forever.
    if (!hasHydrated) return;
    if (!isAuthenticated || accessToken) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => { if (data?.accessToken) setAccessToken(data.accessToken); })
      .catch(() => logout())
      .finally(() => clearTimeout(timeout));
  }, [hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
