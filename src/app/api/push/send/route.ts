import { NextResponse } from "next/server";
import webpush from "web-push";
import { pushStore } from "@/lib/push-store";

function initVapid() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "admin@bigpool.in";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(`mailto:${email}`, pub, priv);
  return true;
}

export async function POST(req: Request) {
  if (!initVapid()) {
    return NextResponse.json({ error: "Push not configured" }, { status: 500 });
  }

  const { userId, title, body, url } = await req.json();
  const payload = JSON.stringify({ title, body, url: url || "/", tag: `bp-${Date.now()}` });

  const targets = userId ? [pushStore.get(userId)].filter(Boolean) : pushStore.all();

  const results = await Promise.allSettled(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (targets as any[]).map((sub) => webpush.sendNotification(sub, payload))
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent, total: targets.length });
}
