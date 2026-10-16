// Doppelkopf Liste – Service Worker
const CACHE = "doko-v13";
const ASSETS = ["/dokliste/manifest.json", "/dokliste/config.js", "/dokliste/icon-192.png", "/dokliste/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // Schreibzugriffe dürfen weder gecacht noch aus dem Cache beantwortet werden.
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // API und HTML: Network-first, Cache-Fallback
  if (url.pathname.startsWith("/api/") || e.request.mode === "navigate") {
    const networkResponse = fetch(e.request);
    e.waitUntil(
      networkResponse.then(res => {
        if (!res.ok) return;
        // Vor jeder asynchronen Cache-Arbeit kopieren: Die App liest parallel.
        const copy = res.clone();
        return caches.open(CACHE).then(c => c.put(e.request, copy));
      }).catch(() => {
        // Ein Cache-Fehler darf die erfolgreiche Netzwerkantwort nicht stören.
      })
    );
    e.respondWith(networkResponse.catch(() => caches.match(e.request)));
    return;
  }

  // Statische Assets: Cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
