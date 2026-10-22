// Zaaihulp service worker: werkt offline, haalt updates op zodra er internet is.
const CACHE = "zaaihulp-v25";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./fonts/barlow-latin-400-normal.woff2", "./fonts/barlow-latin-500-normal.woff2", "./fonts/barlow-latin-600-normal.woff2",
  "./fonts/barlow-semi-condensed-latin-500-normal.woff2", "./fonts/barlow-semi-condensed-latin-700-normal.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  // Alleen eigen oude caches opruimen: de Perceelkaart staat op hetzelfde domein
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("zaaihulp-") && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Eerst netwerk (dan heb je altijd de nieuwste versie), anders uit de cache.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Eigen bestanden altijd vers van de server (niet uit de browsercache), dan zie je een update meteen
  const eigen = new URL(e.request.url).origin === location.origin;
  e.respondWith(
    (eigen ? fetch(e.request.url, { cache: "no-cache", redirect: e.request.mode === "navigate" ? "manual" : "follow" }) : fetch(e.request))
      // Alleen goede antwoorden bewaren: een storing (404/500) mag de offline-versie niet overschrijven
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request).then(m => m || caches.match("./index.html")))
  );
});
