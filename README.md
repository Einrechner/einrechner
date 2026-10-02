# Einrechner

Deutsche Alltagsrechner für Finanzen, Verbraucherfragen, Energiesparen, Heimwerken und Shopping. Jeder Rechner zeigt ein Sofortergebnis, die Formel in Klartext und einen Praxistipp.

## Lokal starten

```bash
npm install
npm run dev
```

Die App läuft danach auf [http://127.0.0.1:38471](http://127.0.0.1:38471).

```bash
npm test
npm run lint
```

## Annahmen

- **CO₂:** 353 g CO₂ je kWh. Vorläufiger direkter CO₂-Emissionsfaktor des deutschen Stromverbrauchs 2024 laut Umweltbundesamt, ohne Vorketten.
- **Beton:** Voreingestellt 12 Liter fertiger Beton je 25-kg-Sack. Das Feld lässt sich ändern.
- **Rundung:** Geldbeträge kaufmännisch auf den Cent (bei genau 5 von der Null weg). Kaufmengen (Gebinde, Rollen, Fliesen, Pakete, Säcke) werden aufgerundet.
- **Sparplan:** Einzahlung am Monatsende (nachschüssig).
- **Kreditrate:** Die angezeigte Rate ist auf den Cent gerundet, die Gesamtsumme ist diese Rate mal die Anzahl der Monate.
- **Mehrwertsteuer:** nur 19 % und 7 %, keine Lohnsteuer.

## Rechner

Die Liste steht in `lib/catalog.ts`. Neue Rechner kommen dort dazu, die Formeln als reine Funktionen unter `lib/formulas/`.
