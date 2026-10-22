// Zaaihulp service worker: werkt offline, haalt updates op zodra er internet is.
const CACHE = "zaaihulp-v38";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./fonts/barlow-latin-400-normal.woff2", "./fonts/barlow-latin-500-normal.woff2", "./fonts/barlow-latin-600-normal.woff2",
  "./fonts/barlow-semi-condensed-latin-500-normal.woff2", "./fonts/barlow-semi-condensed-latin-700-normal.woff2"];
// Zo lang wachten op het netwerk voordat de offline-versie komt (slecht bereik op het land)
const WACHT_MS = 3000;

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
// Komt het netwerk niet binnen WACHT_MS, dan meteen de bewaarde versie; het netwerk werkt de cache op de achtergrond nog bij.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Eigen bestanden altijd vers van de server (niet uit de browsercache), dan zie je een update meteen
  const eigen = new URL(e.request.url).origin === location.origin;
  const net = (eigen ? fetch(e.request.url, { cache: "no-cache", redirect: e.request.mode === "navigate" ? "manual" : "follow" }) : fetch(e.request))
    // Alleen goede antwoorden bewaren: een storing (404/500) mag de offline-versie niet overschrijven
    .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; });
  const uitCache = () => caches.match(e.request).then(m => m || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined));
  e.waitUntil(net.catch(() => {}));
  e.respondWith(new Promise(resolve => {
    let klaar = false;
    const geef = r => { if (!klaar && r) { klaar = true; resolve(r); } };
    const t = setTimeout(() => uitCache().then(geef), WACHT_MS);
    // Serverfout (404/500): liever de bewaarde versie, als die er is
    net.then(r => { clearTimeout(t); if (r.ok || r.type === "opaqueredirect") geef(r); else uitCache().then(m => geef(m || r)); })
      // Geen netwerk: bewaarde versie; staat die er niet, dan de netwerkfout doorgeven
      .catch(() => { clearTimeout(t); uitCache().then(m => m ? geef(m) : (klaar = true, resolve(Response.error()))); });
  }));
});
