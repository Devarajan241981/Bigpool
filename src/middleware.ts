import { NextRequest, NextResponse } from "next/server";

// Edge-safe route protection: check for httpOnly refresh-token cookie.
// Full JWT role verification happens inside the page (client) and API routes (server).

const SUPERADMIN_PATHS = ["/superadmin"];
const VENDOR_PROTECTED = [
  "/vendor/dashboard",
  "/vendor/orders",
  "/vendor/products",
  "/vendor/analytics",
  "/vendor/earnings",
  "/vendor/promotions",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage =
    SUPERADMIN_PATHS.some((p) => pathname.startsWith(p)) &&
    !pathname.startsWith("/superadmin/login");

  const isVendorPage =
    VENDOR_PROTECTED.some((p) => pathname.startsWith(p)) &&
    !pathname.startsWith("/vendor/login");

  if (isAdminPage || isVendorPage) {
    const hasSession = req.cookies.has("bp_refresh");
    if (!hasSession) {
      const loginUrl = new URL(
        isAdminPage ? "/superadmin/login" : "/vendor/login",
        req.url
      );
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Security headers on all responses
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );
  return res;
}

export const config = {
  matcher: [
    // Run on all non-static routes
    "/((?!_next/static|_next/image|favicon|icon|apple-touch|logo|manifest|sw\\.js|robots\\.txt).*)",
  ],
};
