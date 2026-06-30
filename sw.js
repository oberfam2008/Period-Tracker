/* HerRhythm service worker — offline app shell + notification clicks.
 * Bump CACHE when shipping changes so clients pick them up on next load.
 */
var CACHE = "herrhythm-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/astro.js",
  "./js/cycle.js",
  "./js/learn.js",
  "./js/storage.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Network-first for our own files so updates apply on reload, with cache as
// the offline fallback. Cross-origin (e.g. Google Fonts) is cache-first and
// falls back to system fonts offline.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var sameOrigin = new URL(req.url).origin === self.location.origin;
  if (sameOrigin) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match(req); })
    );
  } else {
    e.respondWith(caches.match(req).then(function (c) { return c || fetch(req); }));
  }
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./");
    })
  );
});
