import { NextRequest } from "next/server";
import { verifyAccessToken, type JWTPayload } from "./jwt";

function unauthorized(msg = "Unauthorized") {
  return Response.json({ error: msg }, { status: 401 });
}
function forbidden(msg = "Forbidden") {
  return Response.json({ error: msg }, { status: 403 });
}

export function getAuthToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/** Returns the JWT payload or a 401 Response if unauthenticated. */
export function requireAuth(req: NextRequest): JWTPayload | Response {
  const token = getAuthToken(req);
  if (!token) return unauthorized();
  const payload = verifyAccessToken(token);
  if (!payload) return unauthorized("Session expired. Please log in again.");
  return payload;
}

/** Returns the JWT payload or a 403 Response if not admin. */
export function requireAdmin(req: NextRequest): JWTPayload | Response {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (auth.role !== "admin") return forbidden("Admin access required.");
  return auth;
}

/** Returns the JWT payload or a 403 Response if not seller/admin. */
export function requireSeller(req: NextRequest): JWTPayload | Response {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (auth.role !== "seller" && auth.role !== "admin")
    return forbidden("Seller access required.");
  return auth;
}

export { unauthorized, forbidden };
