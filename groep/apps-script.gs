/**
 * Zaaihulp – groepsopslag in een Google Sheet.
 * Plak dit in de sheet via Uitbreidingen (of Extensies) > Apps Script (vervang wat er staat) en volg groep/HANDLEIDING.md.
 * Het script kan alleen bij deze ene sheet (zie @OnlyCurrentDoc), niet bij de rest van het account.
 *
 * Blad "data", één regel per gedeelde proef of logboekregel:
 *   id | soort | omschrijving | van | apparaat | bijgewerkt | weg | data
 * Klopt een regel niet? Zet in kolom "weg" iets (bv. "ja"): dan verdwijnt hij bij iedereen bij het volgende bijwerken.
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
  } finally { lock.releaseLock(); }
  return antwoord_({ ok: true });
}
