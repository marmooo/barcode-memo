var CACHE_NAME = "2023-07-12 10:10";
var urlsToCache = [
  "/barcode-memo/",
  "/barcode-memo/index.js",
  "/barcode-memo/favicon/favicon.svg",
  "/barcode-memo/koder.js",
  "/barcode-memo/koder/zbar.js",
  "/barcode-memo/koder/zbar.wasm",
  "/barcode-memo/koder/browser.js",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      }),
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }),
  );
});

self.addEventListener("activate", function (event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
