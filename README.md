# DokoListe

PWA zur Punkteerfassung und Rangliste für eine Doppelkopf-Spielgruppe ("Gladiatoren").

**Stack:** Vanilla JS · HTML/CSS · PocketBase · Service Worker (offline-fähig)

---

## Dateien

| Datei | Zweck |
|-------|-------|
| `index.html` | Einzel-Datei-App: gesamte UI + JS-Logik |
| `config.js` | PocketBase-URL, PIN, aktuelles Saisonjahr |
| `sw.js` | Service Worker (Cache-Strategie für Offline-Betrieb) |
| `manifest.json` | PWA-Metadaten (Name, Icons, Scope) |
| `DEPLOY.md` | Deployment-Anleitung (Netlify / GitHub Pages) |

## App-Bereiche (Tabs in `index.html`)

| Tab | Funktion |
|-----|----------|
| SAISON | Aktuelle Saisonrangliste (Ø Punkte/Spiel, niedriger = besser) |
| RUNDEN | Ergebnisse einzelner Spielrunden |
| VERLAUF | Liniendiagramm (Canvas): Ø Punkte/Spiel über alle Jahre |
| BESTENLISTE | Allzeit-Rangliste (mind. 3 Saisons nötig) |
| EINTRAGEN | PIN-geschütztes Formular für neue Ergebnisse |

## Wichtige Implementierungsdetails

- **Scoring:** Niedrigere Punkte sind besser (negatives Doppelkopf-System)
- **Spielvalidierung:** Gesamtanzahl gespielter Spiele muss durch 4 teilbar sein
- **Spielerfarben:** Im JS hartcodiert in `index.html` (z.B. Lutz=gold, Anja=pink, Rolo=purple)
- **PIN:** Nur UI-seitig in `config.js` — kein Backend-Auth; PocketBase-Rules sind public read/write
- **Sync-Modell:** Ein Aufruf lädt alle 4 Collections komplett; die Rangliste-Views werden clientseitig in `buildViews()` aggregiert (PocketBase hat keine SQL-Views)
- **Offline:** Statische Assets → cache-first; `/api/*` → network-first mit Cache-Fallback
- **Atomarität beim Eintragen:** Fehlschlagender Score-Insert löscht die eben angelegte Runde wieder
- **Inaktive Spieler:** Werden mit † markiert; optional ausblendbar (Filter: mind. 10% Teilnahme)

## Datenmodell (PocketBase)

Collections: `players` · `seasons` · `rounds` · `round_scores`

Relations: `rounds.season → seasons`, `round_scores.round → rounds`, `round_scores.player → players`.
Unique-Indexes: `players.name`, `seasons.year`, `(rounds.season, round_number)`, `(round_scores.round, player)`.

Setup der Collections + einmalige Datenmigration aus Supabase liegen im Root-Repo (`pb_setup.py`, `pb_migrate.py`).

## Deployment

Läuft aktuell auf **GitHub Pages** unter <https://tratsch.github.io/dokliste/> — jeder Push auf `main` löst automatisch den `pages-build-deployment`-Workflow aus. Alternativ: Ordner per Drag & Drop auf Netlify hochladen. Details: `DEPLOY.md`

Vor dem Deployment `config.js` befüllen:
```js
window.DOKO_CONFIG = {
  pocketbaseUrl: "https://pb.example.com",
  entryPin: "1234",
  currentSeason: 2025,
  appTitle: "Doppelkopf Liste",
};
```

Beim Deploy die Cache-Version in `sw.js` (`const CACHE = "doko-v…"`) hochzählen, damit bestehende Clients den Update-Zyklus des Service Workers durchlaufen.
