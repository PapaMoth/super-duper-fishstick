// Minimal offline-capable service worker so the site can be installed as an
// Android (and desktop) app via the browser's "Install app" / "Add to Home
// Screen" prompt, with the app shell available even with a flaky connection.
// Live data (weather, tracker prices) is never cached — only the static
// shell — so installed usage always reflects fresh data when online.
const CACHE_NAME = "clockapp-shell-v1";
const SHELL_FILES = [
  "index.html",
  "settings.html",
  "calendar.html",
  "style.css",
  "app.js",
  "settings.js",
  "calendar.js",
  "background.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Only handle same-origin GET requests for the app shell; everything else
  // (weather/tracker APIs, cross-origin) goes straight to the network.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
