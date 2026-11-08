# Groep instellen (Google Sheet)

De Zaaihulp kan proeven, logboekregels, soorten en mengselrecepten delen met een groep. Alles komt in één Google Sheet; de app stuurt en haalt
op via een klein script in die sheet. Eenmalig instellen, daarna gaat het vanzelf.

## 1. Sheet maken
1. Log in bij Google, het liefst met een apart account voor de groep (bv. `zaaihulp.groep@gmail.com`).
2. Ga naar [sheets.new](https://sheets.new). Geef de sheet een naam, bv. **Zaaihulp groep**.

## 2. Script erin zetten
1. In de sheet: **Uitbreidingen → Apps Script** (in sommige versies heet het menu **Extensies**).
2. Haal de voorbeeldtekst weg en plak de inhoud van [`apps-script.gs`](apps-script.gs). Klik op opslaan (schijfje).
3. Links: **Projectinstellingen** (tandwiel) → onderaan **Scripteigenschappen** → **Scripteigenschap toevoegen**:
   - Eigenschap: `GROEPSCODE`
   - Waarde: een code die je zelf verzint, bv. `akkerbouw-zeeland-26`. Niet te kort: wie de code kent, kan schrijven.

## 3. Publiceren als web-app
1. Rechtsboven **Implementeren → Nieuwe implementatie**.
2. Type (tandwiel): **Web-app**.
3. Uitvoeren als: **Ik**. Wie heeft toegang: **Iedereen**.
4. **Implementeren**. Google vraagt toestemming: kies je account → *Geavanceerd* → *Ga naar … (onveilig)* → *Toestaan*.
   (Google waarschuwt omdat het een eigen script is; het script kan alleen bij deze ene sheet.)
5. Kopieer de **URL van de web-app** (eindigt op `/exec`) en stuur die naar de ontwikkelaar van de app. Die zet hem
   vast in de app; daarna hoeft niemand meer iets met die URL te doen.

## 4. Meedoen
- In de app, startscherm → **Groep** → *Meedoen met de groep*, naam en groepscode invullen.
- Of: één persoon tikt op **Stuur groepslink** en stuurt die naar de rest. Wie de link opent, doet meteen mee.

## Beheer
- Alles staat in het blad **data**. Kolom *omschrijving* is leesbaar, kolom *data* is voor de app.
- **Overzicht: bladen `goed` en `twijfel`.** Het script maakt die na elke keer bijwerken opnieuw. In **goed** staan alle
  actieve regels (zonder `verwijderd`/`ja` en zonder open melding), op soort en naam. In **twijfel** staan de regels die
  iemand als *Klopt niet* meldde, met wie dat deed. Keurt de eigenaar hem goed (*Klopt wel*), past hij hem aan of tikt de
  melder *Toch goed*, dan staat hij bij het volgende bijwerken weer in **goed**. Deze twee bladen zijn alleen om te lezen:
  wat je erin verandert wordt overschreven. Beheren (kolom *weg*) doe je in **data**. Ze verschijnen zodra iemand iets
  verstuurt; meteen zien kan in de Apps Script-editor: kies bovenaan de functie `overzichtNu` en klik op *Uitvoeren*.
- **Klopt een regel niet?** Zet in kolom **weg** bijvoorbeeld `ja`. Bij het volgende bijwerken is hij bij iedereen weg,
  ook als die telefoon hem later opnieuw stuurt. (Zo'n regel liever niet helemaal verwijderen: staat hij nog op
  die telefoon, dan kan hij terugkomen zodra hij daar verandert.)
- **Klopt niet vanuit de app:** iedereen kan bij een regel van een ander op **Klopt niet** tikken (Instellingen → Groep →
  *Regels van anderen*, of in de lijsten bij APV, kopeg en recepten). Dan komt er in de sheet een regel met soort
  `melding` bij, met in *omschrijving* welke regel en in *van* wie hem meldde. Bij iedereen wordt die regel grijs en telt
  hij niet meer mee; de eigenaar ziet bij Instellingen → Groep welke regels van hem gemeld zijn. Past de eigenaar de regel
  aan of haalt hij hem weg, dan vervalt de melding vanzelf (die komt op `verwijderd`). Vergist? *Toch goed* in de app,
  of zet bij de melding iets in kolom **weg**. Klopt de regel volgens de eigenaar wél, dan tikt hij op **Klopt wel**
  (Instellingen → Groep): er komt een regel met soort `klopt` bij en de melding telt niet meer. Alleen het apparaat van
  de eigenaar kan dat. Meldt iemand hem daarna opnieuw, dan geldt die nieuwe melding weer.
- Haalt iemand op zijn telefoon iets weg, dan zet de app zelf `verwijderd` in kolom *weg*.
- **Definitief opruimen:** een regel met `verwijderd` mag je helemaal weghalen (rechtsklik op het rijnummer → *Rij
  verwijderen*). Hij staat op die telefoon al niet meer, dus hij komt niet terug. Alleen een oude back-up terugzetten
  kan hem nog terugbrengen.
- **Terugzetten:** maak kolom *weg* weer leeg (haal `verwijderd` of `ja` weg). Bij het volgende bijwerken staat de regel
  weer in de groep én weer op de telefoon van degene van wie hij is (alleen daar komt hij terug in de eigen lijst; bij de
  anderen staat hij als groepsgegeven). De app werkt vanzelf bij als je hem opent of terughaalt van de achtergrond, en elke
  5 minuten zolang hij openstaat; meteen zien kan met *Nu bijwerken*.
- **Script aangepast?** Implementeren → *Implementaties beheren* → potloodje → Versie: *Nieuwe versie* → Implementeren.
  Zo blijft de URL hetzelfde.
- **Code veranderen:** pas `GROEPSCODE` aan bij de scripteigenschappen. Iedereen moet dan de nieuwe code invullen
  (of een nieuwe groepslink krijgen).

## Overstappen naar een ander account
1. Maak met het nieuwe account een nieuwe sheet met hetzelfde script en dezelfde `GROEPSCODE` (of laat de oude sheet
   overdragen: Delen → eigenaar maken, en publiceer het script daarna opnieuw als web-app).
2. Stuur de nieuwe web-app-URL naar de ontwikkelaar; die zet hem in de app.
3. Na de update stuurt elke telefoon al zijn gedeelde proeven opnieuw, dus ook een lege nieuwe sheet vult zich weer
   vanzelf. Wel opnieuw: regels die jij in de oude sheet op "weg" had gezet, moet je in de nieuwe ook weer wegzetten.
