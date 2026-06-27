"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, setAccessToken, logout } = useAuthStore();

  useEffect(() => {
    // If user is marked authenticated (from localStorage) but no access token in memory
    // → try to get a new access token using the httpOnly refresh token cookie
    if (isAuthenticated && !accessToken) {
      fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
        .then((res) => {
          if (!res.ok) {
            // Refresh token is invalid/revoked/expired → force logout on this device
            logout();
            return;
          }
          return res.json();
        })
        .then((data) => {
          if (data?.accessToken) {
            setAccessToken(data.accessToken);
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
