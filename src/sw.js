const CACHE_NAME = "2023-11-18 16:00";
const urlsToCache = [
  "/barcode-memo/",
  "/barcode-memo/index.js",
  "/barcode-memo/favicon/favicon.svg",
  "/barcode-memo/koder.js",
  "/barcode-memo/koder/zbar.js",
  "/barcode-memo/koder/zbar.wasm",
  "/barcode-memo/koder/browser.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
