const CACHE = "bigpool-v7";

self.addEventListener("install", (e) => {
  // No pre-caching — let the cache fill naturally on first use
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // API calls: always go to network, never cache
  if (url.pathname.startsWith("/api/")) return;

  // Next.js JS/CSS chunks are content-hashed — safe to cache forever (cache-first)
  // This makes React hydrate instantly on pull-to-refresh
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      })
    );
    return;
  }

  // HTML pages: network-first so we never serve stale HTML that references
  // old JS chunk filenames (which would break React hydration and freeze the skeleton)
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r ?? caches.match("/")))
  );
});

/* ── Web Push ── */
self.addEventListener("push", (e) => {
  let data = {};
  try { if (e.data) data = e.data.json(); } catch {}

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const appIsOpen = list.some((c) => c.visibilityState === "visible");

      if (appIsOpen) {
        list.forEach((c) => c.postMessage({ type: "push", data }));
        return self.registration.showNotification("", {
          silent: true,
          tag: "bp-silent-foreground",
          requireInteraction: false,
        });
      }

      return self.registration.showNotification(data.title || "Bigpool", {
        body: data.body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: data.tag || "bigpool",
        data: { url: data.url || "/" },
        vibrate: [200, 100, 200],
        requireInteraction: false,
      });
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus().then((c) => c.navigate(url));
      return clients.openWindow(url);
    })
  );
});
