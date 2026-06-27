const CACHE = "bigpool-v5";

const STATIC = ["/", "/customer/products", "/customer/cart"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || e.request.url.includes("/api/")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("/")))
  );
});

/* ── Web Push ── */
self.addEventListener("push", (e) => {
  // Parse payload — default to empty object if missing or malformed
  let data = {};
  try { if (e.data) data = e.data.json(); } catch {}

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const appIsOpen = list.some((c) => c.visibilityState === "visible");

      if (appIsOpen) {
        // App is in foreground: tell the page to update the in-app bell instead.
        // We MUST still show a notification (userVisibleOnly:true requires it),
        // so show a silent one with no badge/sound/vibration so nothing appears.
        list.forEach((c) => c.postMessage({ type: "push", data }));
        return self.registration.showNotification("", {
          silent: true,
          tag: "bp-silent-foreground",
          requireInteraction: false,
        });
      }

      // App is in background — show full visible notification
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
