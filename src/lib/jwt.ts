import jwt from "jsonwebtoken";

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  ?? "bp_access_dev_fallback";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "bp_refresh_dev_fallback";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload & JWTPayload;
    return { userId: decoded.userId, email: decoded.email, role: decoded.role, name: decoded.name };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload & JWTPayload;
    return { userId: decoded.userId, email: decoded.email, role: decoded.role, name: decoded.name };
  } catch {
    return null;
  }
}
