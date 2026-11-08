/**
 * Zaaihulp – groepsopslag in een Google Sheet.
 * Plak dit in de sheet via Uitbreidingen (of Extensies) > Apps Script (vervang wat er staat) en volg groep/HANDLEIDING.md.
 * Het script kan alleen bij deze ene sheet (zie @OnlyCurrentDoc), niet bij de rest van het account.
 *
 * Blad "data", één regel per gedeelde proef of logboekregel:
 *   id | soort | omschrijving | van | apparaat | bijgewerkt | weg | data
 * Klopt een regel niet? Zet in kolom "weg" iets (bv. "ja"): dan verdwijnt hij bij iedereen bij het volgende bijwerken.
 *
 * Bladen "goed" en "twijfel": overzicht om te lezen, wordt na elke keer bijwerken opnieuw gemaakt (wijzigen heeft geen zin).
 *   goed    = alle actieve regels zonder open melding "klopt niet"
 *   twijfel = regels met een open melding (tot de eigenaar hem goedkeurt of aanpast, of de melder "Toch goed" tikt)
 * Eerste keer meteen zien: kies hierboven de functie overzichtNu en klik op Uitvoeren.
 * Pas je zelf iets aan in blad "data", dan worden ze meteen bijgewerkt (onEdit).
 *
 * @OnlyCurrentDoc
 */
const BLAD = 'data';
const KOP = ['id', 'soort', 'omschrijving', 'van', 'apparaat', 'bijgewerkt', 'weg', 'data'];

function blad_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(BLAD);
  if (!sh) { sh = ss.insertSheet(BLAD); sh.appendRow(KOP); sh.setFrozenRows(1); }
  return sh;
}
function codeOk_(c) {
  const g = PropertiesService.getScriptProperties().getProperty('GROEPSCODE');
  return !!g && String(c || '').trim() === g.trim();
}
function antwoord_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Ophalen: alle regels die niet "weg" zijn
function doGet(e) {
  if (!codeOk_(e && e.parameter && e.parameter.code)) return antwoord_({ ok: false, fout: 'code' });
  if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName('goed')) overzicht_();
  const v = blad_().getDataRange().getValues(), rijen = [];
  for (let i = 1; i < v.length; i++) {
    const r = v[i];
    if (!r[0] || String(r[6]).trim()) continue;
    rijen.push({ id: String(r[0]), soort: String(r[1]), van: String(r[3]), apparaat: String(r[4]),
      bijgewerkt: r[5] instanceof Date ? r[5].getTime() : 0, data: String(r[7]) });
  }
  return antwoord_({ ok: true, rijen: rijen });
}

// Versturen: nieuwe regels erbij, bestaande bijwerken, door de telefoon weggehaalde regels op "verwijderd".
// Zette jij zelf iets in "weg", dan blijft hij weg, ook als de telefoon hem later opnieuw stuurt.
function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (x) { return antwoord_({ ok: false, fout: 'json' }); }
  if (!codeOk_(b && b.code)) return antwoord_({ ok: false, fout: 'code' });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = blad_(), v = sh.getDataRange().getValues(), waar = {};
    for (let i = 1; i < v.length; i++) if (v[i][0]) waar[String(v[i][0])] = i + 1;
    (Array.isArray(b.rijen) ? b.rijen : []).slice(0, 500).forEach(function (r) {
      if (!r || !r.id) return;
      const id = String(r.id).slice(0, 200), n = waar[id];
      const oudWeg = n ? String(v[n - 1][6]).trim() : '';
      if (r.weg) {
        if (n && !oudWeg) sh.getRange(n, 6, 1, 2).setValues([[new Date(), 'verwijderd']]);
        return;
      }
      const weg = oudWeg && oudWeg !== 'verwijderd' ? oudWeg : '';
      const rij = [id, String(r.soort || '').slice(0, 20), String(r.omschrijving || '').slice(0, 300), String(r.van || '').slice(0, 40),
        String(r.apparaat || '').slice(0, 40), new Date(), weg, JSON.stringify(r.data || {}).slice(0, 40000)];
      if (n) sh.getRange(n, 1, 1, KOP.length).setValues([rij]);
      else { sh.appendRow(rij); waar[id] = sh.getLastRow(); }
    });
    overzicht_();
  } finally { lock.releaseLock(); }
  return antwoord_({ ok: true });
}

// ---------- Overzicht: bladen "goed" en "twijfel" ----------
// Zelfde controle als de app: een melding telt alleen zolang de regel nog precies zo is (zelfde hash van de data)
// en de eigenaar hem daarna niet als "klopt wel" goedkeurde (alleen geldig vanaf het apparaat van de eigenaar).
function hash_(t) { let h = 5381; for (let i = 0; i < t.length; i++) h = (h * 33 + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
const SOORT_NAAM = { apv: 'APV', zoc: 'Zocon', kop: 'Kopeg', recept: 'Recept', soort: 'Soort' };
function overzicht_() {
  try {
    const v = blad_().getDataRange().getValues(), actief = [], perId = {}, goedk = {}, meld = [];
    for (let i = 1; i < v.length; i++) {
      const r = v[i];
      if (!r[0] || String(r[6]).trim()) continue;
      let d = null; try { d = JSON.parse(String(r[7])); } catch (x) {}
      const rij = { id: String(r[0]), soort: String(r[1]), oms: String(r[2]), van: String(r[3]), app: String(r[4]), tijd: r[5], d: d, h: hash_(String(r[7])) };
      if (rij.soort === 'klopt') {
        if (d && d.over && rij.app === String(d.over).split(':')[1]) { const k = d.over + '|' + d.hash; goedk[k] = Math.max(goedk[k] || 0, +d.ts || 0); }
      } else if (rij.soort === 'melding') { if (d && d.over) meld.push(rij); }
      else { actief.push(rij); perId[rij.id] = rij; }
    }
    const twijfel = {};
    meld.forEach(function (m) {
      const doel = perId[m.d.over], k = m.d.over + '|' + m.d.hash;
      if (!doel || doel.h !== String(m.d.hash) || m.app === doel.app) return;
      if (goedk[k] !== undefined && goedk[k] >= (+m.d.ts || 0)) return;
      const t = twijfel[doel.id] || (twijfel[doel.id] = { doel: doel, wie: [], tijd: null });
      if (twijfel[doel.id].wie.indexOf(m.van) < 0) t.wie.push(m.van);
      if (!t.tijd || (m.tijd instanceof Date && m.tijd > t.tijd)) t.tijd = m.tijd;
    });
    const volg = ['apv', 'zoc', 'kop', 'recept', 'soort'], plek = s => { const n = volg.indexOf(s); return n < 0 ? 99 : n; };
    const goed = actief.filter(r => !twijfel[r.id]).sort((a, b) => plek(a.soort) - plek(b.soort) || a.van.localeCompare(b.van) || a.oms.localeCompare(b.oms));
    schrijf_('goed', ['van', 'soort', 'omschrijving', 'bijgewerkt'], goed.map(r => [r.van, SOORT_NAAM[r.soort] || r.soort, r.oms, r.tijd]));
    const tw = Object.keys(twijfel).map(id => twijfel[id]).sort((a, b) => plek(a.doel.soort) - plek(b.doel.soort) || a.doel.van.localeCompare(b.doel.van));
    schrijf_('twijfel', ['van', 'omschrijving', 'klopt niet volgens', 'gemeld'], tw.map(t => [t.doel.van, t.doel.oms, t.wie.join(', '), t.tijd || '']));
  } catch (x) { /* overzicht mag het bijwerken nooit tegenhouden */ }
}
function schrijf_(naam, kop, rijen) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(naam);
  if (!sh) { sh = ss.insertSheet(naam); sh.setFrozenRows(1); sh.setColumnWidth(1, 140); sh.setColumnWidth(2, naam === 'goed' ? 80 : 520); sh.setColumnWidth(3, naam === 'goed' ? 520 : 160); sh.setColumnWidth(4, 150); }
  sh.clearContents();
  const alles = [kop].concat(rijen.length ? rijen : [[naam === 'goed' ? '(nog niks)' : '(niks in twijfel)', '', '', '']]);
  sh.getRange(1, 1, alles.length, kop.length).setValues(alles);
}
// Met de hand starten vanuit de editor (eerste keer, of als je de bladen kwijt bent)
function overzichtNu() { overzicht_(); }
// Jij past iets aan in blad "data" (bv. kolom weg): overzicht meteen bijwerken. Werkt na opslaan, zonder nieuwe implementatie.
// (Een hele rij verwijderen telt hier niet als wijziging: dan bij het volgende bijwerken, of overzichtNu uitvoeren.)
function onEdit(e) { if (e && e.range && e.range.getSheet().getName() === BLAD) overzicht_(); }
