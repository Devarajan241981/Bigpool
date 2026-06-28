const CACHE = "bigpool-v6";

// Pre-cached on install so pull-to-refresh on these pages never waits for network
const PRECACHE = ["/", "/customer/products", "/customer/cart", "/customer/profile"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: serve cache instantly, update in background.
// This eliminates the dark-screen gap on pull-to-refresh that network-first causes.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || e.request.url.includes("/api/")) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);

      // Always kick off a network fetch to keep the cache fresh
      const networkFetch = fetch(e.request)
        .then((res) => {
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => null);

      // Serve cached immediately; if nothing cached yet, wait for network
      return cached ?? networkFetch;
    })
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
