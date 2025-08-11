// sw.js – service worker for offline caching
const CACHE_NAME = "scs-cache-v1";
const urlsToCache = ["/scs/index.html", "/scs/scs.min.js"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(resp => resp || fetch(event.request))
  );
});
