const CACHE_NAME = "sellers-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal service worker to allow "Add to Home Screen"
self.addEventListener("fetch", (event) => {
  // Network first, no aggressive caching
  event.respondWith(fetch(event.request).catch(() => new Response("Offline")));
});
