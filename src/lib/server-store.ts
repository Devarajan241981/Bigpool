// Shared in-memory store — persists for the lifetime of the server process.
// When Supabase is connected, these will be replaced by DB calls.

export interface ServerUser {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "customer" | "seller" | "admin";
  businessName?: string;
  createdAt: string;
}

// Module-level array — shared across all API routes in the same process
export const serverUsers: ServerUser[] = [];

export function findUser(email: string): ServerUser | undefined {
  return serverUsers.find((u) => u.email === email.toLowerCase().trim());
}

export function upgradeToSeller(email: string, businessName: string): boolean {
  const user = findUser(email);
  if (!user) return false;
  user.role = "seller";
  user.businessName = businessName;
  return true;
}
