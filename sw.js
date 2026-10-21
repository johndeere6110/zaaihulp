// Zaaihulp service worker: werkt offline, haalt updates op zodra er internet is.
const CACHE = "zaaihulp-v11";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./perceel.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Eerst netwerk (dan heb je altijd de nieuwste versie), anders uit de cache.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // PDOK-percelen niet via de cache: perceel.js bewaart die zelf en geeft een nette fout zonder bereik
  if (new URL(e.request.url).hostname === "api.pdok.nl") return;
  // Eigen bestanden altijd vers van de server (niet uit de browsercache), dan zie je een update meteen
  const eigen = new URL(e.request.url).origin === location.origin;
  e.respondWith(
    (eigen ? fetch(e.request.url, { cache: "no-cache", redirect: e.request.mode === "navigate" ? "manual" : "follow" }) : fetch(e.request))
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then(m => m || caches.match("./index.html")))
  );
});
