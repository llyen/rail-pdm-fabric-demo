# Rail PdM Demo

Demo predykcyjnego utrzymania fikcyjnej linii kolejowej Kaliniec–Morawin, zbudowane jako aplikacja Microsoft Fabric na Rayfin. Wszystkie dane w aplikacji są syntetyczne i powstają w przeglądarce.

Wersja angielska: [README.md](README.md).

## Co robi aplikacja

Po zalogowaniu widać cztery zakładki. Dashboard pokazuje rozkład ryzyka odcinków, stan techniczny assetów, assety z najkrótszym pozostałym czasem życia (RUL) i odcinki o najwyższym ryzyku. Mapa ryzyka to schemat trasy w SVG, na którym odcinki mają kolor zależny od poziomu ryzyka, assety są punktami, a pociągi przesuwają się po linii. W zakładce Alerty są przewidywane awarie z rekomendacją, a każdy alert można potwierdzić albo zamknąć. Zakładka Assety zawiera tory, rozjazdy, sygnalizację i mosty z oceną stanu, RUL i wykresem trendu odczytów czujnika z progiem ostrzegawczym i krytycznym.

Przycisk „Wygeneruj dane demo” zapisuje do bazy stacje, odcinki, assety, odczyty, alerty i pociągi z losowymi wartościami, a „Wyczyść” usuwa wszystko. Nazwy stacji, przebieg linii i współrzędne są zmyślone, a reszta (ryzyko, stan, odczyty, producenci przypisani do assetów, pociągi) jest losowa.

## Stos

React 19, Vite 7, Tailwind CSS 4 i TypeScript. Backend to Rayfin (pakiety `@microsoft/rayfin-*`) z usługami auth, data (dialekt MSSQL) i hostingiem statycznym na Microsoft Fabric. Model danych leży w `rayfin/data/`.

## Uruchomienie lokalne

Potrzebny jest Node.js 20+ i Docker Desktop.

```bash
npm ci
npm run rayfin:db      # schemat w lokalnym backendzie
npm run dev:local      # backend w Dockerze i Vite na http://localhost:5173
```

Przy adresie API na localhost aplikacja loguje e-mailem i hasłem. Lokalny backend zatrzymuje się przez `npm run dev:local:stop`, a usuwa przez `npm run dev:local:down` lub `npm run dev:local:purge`.

## Wdrożenie na Microsoft Fabric

```bash
npx rayfin login -t <TENANT_ID>
npm run up
```

Trzeba mieć workspace Fabric z prawem wdrażania. Poza localhost aplikacja loguje przez Fabric (Entra ID). Po pierwszym wdrożeniu adres aplikacji powinien trafić do `allowedRedirectUris` w `rayfin/rayfin.yml`, jeśli CLI nie dopisało go samo.

## Zastrzeżenie

To demo, a nie system produkcyjny. Dane są syntetyczne i nie opisują stanu żadnej rzeczywistej infrastruktury, zarządcy ani producenta. Producenci występują tylko jako umowne etykiety od „Dostawca A” do „Dostawca F”. Projekt nie jest oficjalnym produktem Microsoft.

## Licencja

MIT, szczegóły w [LICENSE](LICENSE).
