// CourtServe Pro — minimal service worker
// Intentionally simple: this app relies on a live network connection to
// Supabase for all real data, so we do NOT cache/serve API responses or
// stale app data offline. This worker exists mainly to satisfy PWA
// "installability" requirements (home-screen icon) and to allow the
// app shell itself to load slightly faster on repeat visits.

const CACHE_NAME = "courtserve-shell-v1";
const SHELL_FILES = [
  "./index.html",
  "./manifest.json",
  "./icon.svg",
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
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache anything going to Supabase (auth, database, storage, functions) —
  // this app must always talk to the live backend, never serve stale/cached
  // legal data or stale auth state.
  if (url.hostname.endsWith("supabase.co")) {
    return; // let the browser handle it normally, no service worker involvement
  }

  // For the app shell itself: try cache first, fall back to network.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
