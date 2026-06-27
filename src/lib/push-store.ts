// Shared in-memory push subscription store
// Works on persistent Node.js servers (Render). For production scale, swap for a database.
import type { PushSubscription } from "web-push";

const store = new Map<string, PushSubscription>();

export const pushStore = {
  set: (userId: string, sub: PushSubscription) => store.set(userId, sub),
  delete: (userId: string) => store.delete(userId),
  get: (userId: string) => store.get(userId),
  all: () => Array.from(store.values()),
};
