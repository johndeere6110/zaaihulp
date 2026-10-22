# Zaaihulp

Hulp-app voor het afdraaien, wegen en mengen bij de zaaimachine. Werkt op je telefoon, ook zonder internet.

**Openen:** https://johndeere6110.github.io/zaaihulp/
**Installeren of doorsturen naar iemand anders:** https://johndeere6110.github.io/zaaihulp/installeren.html

## Machines

| Machine | Wat de app doet |
|---|---|
| **APV 5.2** (MDP 100 M1) | Afdraaien met de emmer, mengsel samenstellen, vakken uitrekenen en de kast bijstellen in stappen van 5 %. Tab **Zaaias**: welke zaaias (Flex 20 geel/grof, ff alles fijn, f-fb fijn + blind, of een eigen genummerde rol met per uitgang enkel of dubbel) en welke zaai-as % bij jouw norm, snelheid en werkbreedte, uit de zaaitabellen van APV en je eigen logboek (zaaien of afdraaiproef). Standaard en eigen rollen kunnen een eigen foto hebben; de standaard zaaiassen hebben een getekend icoon. |
| **Zocon Z300** (BASIC-kastje, gele rol) | Afdraaiproef met timer, zaaistand 1–24 bij jouw rijsnelheid, borstelstand −1 t/m 3. Bewaarde proeven op meerdere standen maken de berekening steeds nauwkeuriger. Rekent ook het aantal vullingen van de bak (300 L) uit. |
| **Kopeg-zaaier** | Afdraaien met de slinger (1/40, 1/10 of eigen deel van een hectare) en de nieuwe variatorstand. Eigen proeven bewaar je in de ervaringstabel. |

Voor alle machines:

- **Wegen:** emmergewicht wordt onthouden, je ziet meteen het netto gewicht. Bij Zocon en kopeg stuur je het netto met één tik naar Afdraaien, bij de APV naar de afdraaiproef op Zaaias.
- **Mengen:** samenstelling in procenten of kg/ha, totaal op oppervlakte, vakken of gewicht, extra in % of in kg, wat er in de machine achterblijft (per machine onthouden), en wat je moet doen als je beperkt zaad hebt (dan telt de extra niet mee).

## Gebruik

1. Open de link en installeer de app (zie de installatiepagina hierboven).
2. Kies je machine.
3. Vul de tabbladen **Afdraaien**, **Wegen** en **Mengen** in. Alles wordt onthouden.

Getallen met een komma (`2,5`), zoals je gewend bent.

## Je gegevens

- Alles blijft **op je eigen telefoon**. Er is geen account, geen server en de app stuurt niks door.
- **Delen en overzetten** (startscherm): deel je bewaarde proeven, tabelregels en soorten met iemand anders via een code. Wegingen en mengsels blijven privé.
- **Stuur installatielink** (bij Delen en overzetten): stuurt iemand de link naar de installatiepagina.
- **Back-up** (startscherm, onderaan): alles in één bestand, ook wegingen, mengsels en instellingen. Bewaar hem buiten je telefoon, bijvoorbeeld in een WhatsApp-bericht aan jezelf. Telefoon kapot of nieuw? Daar zet je hem ook terug. De app laat zien wanneer je de laatste back-up maakte.

## Offline en updates

De app werkt zonder bereik zodra je hem één keer met internet hebt geopend. Een nieuwe versie haalt hij vanzelf op als je hem met bereik opent; soms zie je hem pas de keer daarna.

Gebruik op een iPhone altijd het icoon op het beginscherm, niet los Safari: dan bewaart iOS je gegevens het betrouwbaarst.

## Zie ook

**[Perceelkaart](https://github.com/johndeere6110/perceelkaart):** percelen kiezen op de kaart, totaal ha, bufferstroken langs water en spuitsporen. Een aparte app, op termijn de basis voor een kunstmest-app.

---

## Voor wie eraan werkt

- **Alles in `index.html`:** HTML, CSS en JavaScript in één bestand. Geen build-stap, geen frameworks.
- **`sw.js`:** de service worker voor offline gebruik. **Verhoog bij elke wijziging het versienummer** (`zaaihulp-v37` → `v38`), anders krijgen telefoons de update niet.
- **`installeren.html`:** de installatiepagina. Herkent Android, iPhone of computer.
- **`fonts/`:** het lettertype Barlow, zelf gehost, zodat er geen verzoeken naar Google gaan. **`vendor/`:** externe bibliotheken als eigen kopie (QR-code), niets van een CDN.
- **Opslag:** `localStorage`. **Verander bestaande sleutels niet**, anders zijn gebruikers hun proeven kwijt. De Perceelkaart staat op hetzelfde domein en deelt de opslag; de back-up neemt daarom alleen de sleutels van de Zaaihulp mee.
- **Geen `alert()` of `confirm()`:** die worden in sommige weergaven geblokkeerd. Gebruik `armed()` (eerste tik vraagt "zeker?", tweede tik voert uit) en `flash()`.
- **Taal:** Nederlands, komma als decimaalteken.
- **Publiceren:** push naar `main`; GitHub Pages zet hem binnen een paar minuten online.

De afspraken staan ook in [`CLAUDE.md`](CLAUDE.md).

### Licenties van onderdelen

- Lettertype Barlow: SIL Open Font License 1.1 (`fonts/OFL.txt`)
- QRCode.js: MIT (`vendor/qrcodejs/LICENSE`)
