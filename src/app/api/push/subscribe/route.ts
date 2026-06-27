import { NextResponse } from "next/server";
import { pushStore } from "@/lib/push-store";
import type { PushSubscription } from "web-push";

export async function POST(req: Request) {
  const { subscription, userId } = await req.json();
  if (!subscription?.endpoint || !userId) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  pushStore.set(userId, subscription as PushSubscription);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { userId } = await req.json();
  if (userId) pushStore.delete(userId);
  return NextResponse.json({ ok: true });
}
