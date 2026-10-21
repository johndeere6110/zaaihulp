# Zaaihulp
Web-app (PWA) voor afdraaien, wegen en mengen bij zaaimachines: APV 5.2, Zocon Z300 (BASIC, gele rol, borstel -1 t/m 3, standen 1-24) en een kopeg-zaaier (variator).
- Alles zit in index.html (HTML, CSS en JS in één bestand). Geen build-stap, geen frameworks.
- Taal in de app: Nederlands, komma als decimaalteken.
- Gegevens staan in localStorage. Verander bestaande sleutels niet, anders zijn gebruikers hun proeven kwijt.
- Gebruik geen alert() of confirm(); die worden in sommige weergaven geblokkeerd. Gebruik de bestaande armed()- en flash()-functies.
- Bij elke wijziging: verhoog het versienummer in sw.js (zaaihulp-v3 -> v4 enz.).
- Push direct naar main, zonder pull request.
