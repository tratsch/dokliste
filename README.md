# DokoListe

PWA zur Punkteerfassung und Rangliste für eine Doppelkopf-Spielgruppe ("Gladiatoren").

**Stack:** Vanilla JS · HTML/CSS · Supabase (PostgreSQL) · Service Worker (offline-fähig)

---

## Dateien

| Datei | Zweck |
|-------|-------|
| `index.html` | Einzel-Datei-App (~45 KB): gesamte UI + JS-Logik |
| `config.js` | Supabase-Credentials, PIN, aktuelles Saisonjahr |
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
- **PIN:** Nur UI-seitig in `config.js` — kein Backend-Auth
- **Offline:** Statische Assets → cache-first; API-Aufrufe → network-first mit Cache-Fallback
- **Inaktive Spieler:** Werden mit † markiert; optional ausblendbar (Filter: mind. 10% Teilnahme)

## Datenbankschema (Supabase / PostgreSQL)

**Tabellen:** `players` · `seasons` · `rounds` · `round_scores`

**Views:**
- `v_season_summary` — Saisonrangliste mit Ø Punkte/Spiel und Rang
- `v_alltime_ranking` — Allzeit-Statistiken über alle Saisons
- `v_rank_history` — Platziierungsverlauf für den VERLAUF-Tab

## Deployment

Einfachste Option: Ordner per Drag & Drop auf Netlify hochladen. Details: `DEPLOY.md`

Vor dem Deployment `config.js` befüllen:
```js
const SUPABASE_URL = '...';
const SUPABASE_ANON_KEY = '...';
const CURRENT_YEAR = 2025;
const PIN = '...';
```
