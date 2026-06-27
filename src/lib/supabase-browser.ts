import { createClient, SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getBrowserDb(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!_client) _client = createClient(url, key);
  return _client;
}

/**
 * Subscribe to INSERT/UPDATE/DELETE events on a Supabase table.
 * Returns a cleanup function.
 */
export function subscribeToTable(
  table: string,
  filter: string | undefined,
  onChange: () => void
): (() => void) {
  const db = getBrowserDb();
  if (!db) return () => {};

  let channel: RealtimeChannel;
  try {
    const channelName = `realtime:${table}:${filter ?? "all"}:${Date.now()}`;
    channel = db.channel(channelName);

    const postgres = channel.on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
      () => onChange()
    );
    postgres.subscribe();
  } catch {
    // Realtime not available — caller's polling fallback will handle it
    return () => {};
  }

  return () => {
    try { db.removeChannel(channel); } catch { /* ignore */ }
  };
}
