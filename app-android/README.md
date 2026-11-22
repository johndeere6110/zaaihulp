# Zaaihulp als Android-app (test)

Een kleine app-schil (Capacitor) om de Zaaihulp, net als bij de Perceelkaart. De app laadt de site
https://johndeere6110.github.io/zaaihulp/, dus updates van de site komen meteen in de app; een nieuwe APK is
alleen nodig als er aan de schil zelf iets verandert.

- Bouwen: GitHub Actions, `.github/workflows/android.yml` (bij een wijziging in deze map, of met de hand via
  Actions → Android-app → Run workflow). Het Android-project (`android/`) maakt de workflow elke keer opnieuw.
- Downloaden: de APK staat bij de release "Android-app (test)" van deze repo.
- Opslag: de app heeft eigen opslag, los van Chrome. De proeven uit Chrome komen er niet vanzelf in: maak in
  Chrome een back-up (Instellingen → Back-up) en zet die in de app terug.
- Ondertekening: nu nog een debug-sleutel die per bouw verschilt. Een nieuwe APK installeren gaat dan alleen na
  het verwijderen van de oude (en dan is de opslag van de app weg). Voor echt gebruik eerst een vaste sleutel als
  GitHub Secret instellen.
