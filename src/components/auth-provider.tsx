"use client";

import { useEffect } from "react";
import { useAuthStore, useHasHydrated } from "@/lib/store";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, setAccessToken, markSessionReady } = useAuthStore();
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    if (!hasHydrated) return;

    // Already has token, or not logged in — nothing to do
    if (!isAuthenticated || accessToken) {
      markSessionReady();
      return;
    }

    // Authenticated but no token in memory (page refresh) — try the cookie
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.accessToken) setAccessToken(data.accessToken);
        // If refresh failed: keep user logged in with local data (role/name
        // from localStorage still correct). API calls that need auth will
        // fail gracefully. Don't logout — that would kick vendor/customer
        // users out of pages that only need local state.
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout);
        markSessionReady();
      });
  }, [hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
