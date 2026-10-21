// Perceel: zoek het BRP-gewasperceel (PDOK, RVO) op een GPS-positie en bereken de oppervlakte.
// Losse module zonder afhankelijkheden. In de browser: window.Perceel, in Node: require("./perceel.js").
//
//   Perceel.zoekOpMijnLocatie().then(r => r.perceel.ha)        // GPS + PDOK, valt terug op opgeslagen percelen
//   Perceel.zoekOpPunt(lon, lat)                                // zelfde, met een bekende positie
//   Perceel.oppervlakteHa(geometry), Perceel.bevatPunt(geometry, lon, lat)
//
// Fouten zijn Error-objecten met .code: "geen-gps", "gps-geweigerd", "gps-timeout", "gps-onbekend",
// "offline" (geen verbinding en niks opgeslagen op deze plek), "server", "geen-perceel". De .message is Nederlands.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Perceel = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const API = "https://api.pdok.nl/rvo/gewaspercelen/ogc/v1/collections/brpgewas/items";
  const R = 6378137; // WGS84-straal, zelfde als turf.area
  const DEF = {
    cacheKey: "perceelCache",
    cacheMax: 300,        // max aantal opgeslagen percelen
    marge: 0.002,         // bbox rond het punt in graden (± ca. 150-220 m), haalt ook buurpercelen op voor offline
    limit: 200,
    timeout: 12000,       // ms voor de PDOK-aanvraag
    gpsTimeout: 20000,
    storage: null,        // standaard localStorage
    fetch: null           // standaard globale fetch
  };
  const opts = o => Object.assign({}, DEF, o || {});
  const fout = (code, msg) => { const e = new Error(msg); e.code = code; return e; };

  /* ---------- Geometrie ---------- */
  // Polygon -> [ringen], MultiPolygon -> [[ringen], ...]
  const polygonen = g => !g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];

  // Sferische ringoppervlakte in m² (Chamberlain & Duquette, zoals turf.area)
  function ringM2(ring) {
    const n = ring.length;
    if (n < 3) return 0;
    const rad = d => d * Math.PI / 180;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const p1 = ring[i], p2 = ring[(i + 1) % n], p3 = ring[(i + 2) % n];
      s += (rad(p3[0]) - rad(p1[0])) * Math.sin(rad(p2[1]));
    }
    return Math.abs(s * R * R / 2);
  }
  function oppervlakteM2(geometry) {
    return polygonen(geometry).reduce((t, rings) =>
      t + rings.reduce((a, ring, i) => i === 0 ? a + ringM2(ring) : a - ringM2(ring), 0), 0);
  }
  const oppervlakteHa = geometry => Math.round(oppervlakteM2(geometry) / 100) / 100;

  // Ray casting; buitenring wel, gaten niet
  function inRing(ring, x, y) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const bevatPunt = (geometry, lon, lat) =>
    polygonen(geometry).some(rings => rings.length && inRing(rings[0], lon, lat) && !rings.slice(1).some(h => inRing(h, lon, lat)));

  const isLandschap = f => String((f.properties || {}).category || "").toLowerCase() === "landschapselement";

  // Vertaal een feature naar wat de app nodig heeft
  function perceelVan(f, bron) {
    const p = f.properties || {};
    return {
      id: f.id != null ? f.id : null,
      gewas: p.gewas || "", gewascode: p.gewascode != null ? p.gewascode : null,
      category: p.category || "", jaar: p.jaar != null ? p.jaar : null, status: p.status || "",
      ha: oppervlakteHa(f.geometry), bron: bron, opgehaald: f._ts || Date.now(),
      geometry: f.geometry
    };
  }

  // Perceel onder het punt; bij overlap (meerdere jaren) het nieuwste jaar
  function kies(features, lon, lat) {
    const hits = features.filter(f => f && f.geometry && !isLandschap(f) && bevatPunt(f.geometry, lon, lat));
    hits.sort((a, b) => (Number((b.properties || {}).jaar) || 0) - (Number((a.properties || {}).jaar) || 0));
    return hits[0] || null;
  }

  /* ---------- Opslag (laatst opgehaalde percelen) ---------- */
  function opslag(o) {
    if (o.storage) return o.storage;
    try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; }
  }
  function leesCache(o) {
    const st = opslag(o); if (!st) return [];
    try { const v = JSON.parse(st.getItem(o.cacheKey) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  // Rondt coördinaten af op 7 decimalen (~1 cm) om ruimte te sparen
  const rond = c => typeof c[0] === "number" ? [Math.round(c[0] * 1e7) / 1e7, Math.round(c[1] * 1e7) / 1e7] : c.map(rond);
  const sleutel = f => f.id != null ? "id:" + f.id : "g:" + JSON.stringify(f.geometry.coordinates).slice(0, 200);
  function schrijfCache(o, nieuw) {
    const st = opslag(o); if (!st || !nieuw.length) return;
    const ts = Date.now();
    const mp = new Map();
    // nieuwste eerst, oude daarachter; dubbele eruit
    nieuw.map(f => ({ id: f.id, properties: f.properties, geometry: { type: f.geometry.type, coordinates: rond(f.geometry.coordinates) }, _ts: ts }))
      .concat(leesCache(o)).forEach(f => { const k = sleutel(f); if (!mp.has(k)) mp.set(k, f); });
    let lijst = [...mp.values()].slice(0, o.cacheMax);
    // Past het niet, dan steeds de oudste helft weggooien
    while (lijst.length) {
      try { st.setItem(o.cacheKey, JSON.stringify(lijst)); return; } catch (e) { lijst = lijst.slice(0, Math.floor(lijst.length / 2)); }
    }
  }
  const wisCache = o => { o = opts(o); const st = opslag(o); try { if (st) st.removeItem(o.cacheKey); } catch (e) {} };
  const aantalOpgeslagen = o => leesCache(opts(o)).length;

  /* ---------- PDOK ---------- */
  async function haalOp(lon, lat, o) {
    const f = o.fetch || (typeof fetch !== "undefined" ? fetch : null);
    if (!f) throw fout("offline", "Geen internet beschikbaar in deze omgeving.");
    const d = o.marge;
    const url = API + "?f=json&limit=" + o.limit + "&bbox=" + [lon - d, lat - d, lon + d, lat + d].map(v => v.toFixed(6)).join(",");
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    const t = ac ? setTimeout(() => ac.abort(), o.timeout) : null;
    let res;
    try { res = await f(url, { signal: ac ? ac.signal : undefined, headers: { Accept: "application/geo+json, application/json" } }); }
    catch (e) { throw fout("offline", "Geen verbinding met PDOK."); }
    finally { if (t) clearTimeout(t); }
    if (!res.ok) throw fout("server", "PDOK gaf een fout (" + res.status + "). Probeer het later nog eens.");
    let data;
    try { data = await res.json(); } catch (e) { throw fout("server", "Onverwacht antwoord van PDOK."); }
    return Array.isArray(data && data.features) ? data.features.filter(x => x && x.geometry) : [];
  }

  // Zoek het perceel op een punt: eerst online, bij geen verbinding uit de opgeslagen percelen
  async function zoekOpPunt(lon, lat, o) {
    o = opts(o);
    let features = null, netFout = null;
    try { features = await haalOp(lon, lat, o); } catch (e) { netFout = e; }
    if (features) {
      schrijfCache(o, features.filter(f => !isLandschap(f)));
      let hit = kies(features, lon, lat);
      // Volle pagina zonder treffer: het perceel kan op een volgende pagina staan, dan alleen het punt zelf
      if (!hit && features.length >= o.limit) {
        try { const klein = await haalOp(lon, lat, Object.assign({}, o, { marge: 0.0002 })); schrijfCache(o, klein.filter(f => !isLandschap(f))); hit = kies(klein, lon, lat); } catch (e) {}
      }
      if (!hit) throw fout("geen-perceel", "Op deze plek ligt geen landbouwperceel in de BRP. Sta je op de kavel? Vul anders de oppervlakte zelf in.");
      return { perceel: perceelVan(hit, "online"), lon, lat };
    }
    const hit = kies(leesCache(o), lon, lat);
    if (hit) return { perceel: perceelVan(hit, "opgeslagen"), lon, lat, waarschuwing: netFout && netFout.message };
    if (netFout && netFout.code === "offline")
      throw fout("offline", "Geen verbinding, en dit perceel is nog niet eerder opgehaald. Vul de oppervlakte zelf in, of probeer het als je bereik hebt.");
    throw netFout;
  }

  /* ---------- GPS ---------- */
  function positie(o) {
    o = opts(o);
    return new Promise((resolve, reject) => {
      const geo = typeof navigator !== "undefined" && navigator.geolocation;
      if (!geo) { reject(fout("geen-gps", "Dit toestel of deze browser geeft geen locatie.")); return; }
      geo.getCurrentPosition(
        p => resolve({ lon: p.coords.longitude, lat: p.coords.latitude, nauwkeurigheid: p.coords.accuracy }),
        e => reject(e && e.code === 1 ? fout("gps-geweigerd", "Locatie geweigerd. Sta locatie toe voor deze app in je instellingen.")
          : e && e.code === 3 ? fout("gps-timeout", "Geen GPS-positie gevonden binnen de tijd. Probeer het buiten nog eens.")
          : fout("gps-onbekend", "Locatie niet beschikbaar. Staat GPS aan?")),
        { enableHighAccuracy: true, timeout: o.gpsTimeout, maximumAge: 5000 }
      );
    });
  }

  async function zoekOpMijnLocatie(o) {
    const p = await positie(o);
    const r = await zoekOpPunt(p.lon, p.lat, o);
    r.nauwkeurigheid = p.nauwkeurigheid;
    return r;
  }

  return { zoekOpMijnLocatie, zoekOpPunt, positie, oppervlakteHa, oppervlakteM2, bevatPunt, wisCache, aantalOpgeslagen, API };
});
