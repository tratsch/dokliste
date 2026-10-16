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
| RUNDEN | Ergebnisse einzelner Spielrunden; PIN-geschützt bearbeiten und löschen |
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
- **Fehler beim Schreiben:** Bereits abgeschlossene Teilschritte werden bei Fehlern rückgängig gemacht. Einzelanfragen sind keine Datenbanktransaktion; bei Verbindungsabbruch oder fehlgeschlagener Rücknahme fordert die App zur Synchronisierung und Prüfung auf.
- **Inaktive Spieler:** Werden mit † markiert. Ihr Aktivstatus ist unabhängig vom Teilnahmefilter.
- **Teilnahmefilter:** Gemeinsamer Schalter **>10 % Runden** in allen Auswertungen. Die Quote bezieht sich auf alle Runden der jeweiligen Saison, einschließlich Runden ohne Ergebnisse. Genau 10 % reichen nicht aus.

## Teilnahmefilter

Der Schalter **>10 % Runden** filtert Saisonrangliste, Ergebniszeilen der Runden,
Verlauf samt Legende und sämtliche Bestenlisten nach derselben saisonbezogenen
Teilnahmequote. Bei zwölf Saisonrunden genügt eine Teilnahme nicht; zwei genügen.
Die Zahl der Runden bleibt beim Filtern unverändert. Rundenkarten bleiben zum
Bearbeiten und Löschen erreichbar, auch wenn ihre Ergebniszeilen ausgeblendet sind.

Platzierungen, Jahressieger, Pokale und saisonübergreifende Kennzahlen werden aus
den qualifizierten Spielersaisons neu berechnet. Für die Gesamtranglisten bleiben
mindestens drei qualifizierte Saisons erforderlich.

**EINTRAGEN** und das Bearbeiten zeigen immer alle verfügbaren Teilnehmer und
keine Filterleiste. Beim Zurückwechseln zu den Auswertungen bleibt der gewählte
Filterzustand erhalten.

## Runden bearbeiten und löschen

Unter **RUNDEN** stehen an jeder Runde **Bearbeiten** und **Löschen** zur Verfügung.
Bei gesperrter Eingabe wird zuerst der bestehende PIN abgefragt.

**Bearbeiten** öffnet das vorausgefüllte Eingabeformular. Saison, Rundennummer,
Datum, Teilnehmer, Punkte und Spiele können angepasst werden. Bisherige inaktive
Teilnehmer bleiben auswählbar. **Änderungen speichern** aktualisiert dieselbe Runde;
**Abbrechen** kehrt ohne Änderung zur Rundenansicht zurück.

**Löschen** entfernt nach Bestätigung die Runde und ihre Ergebnisse. Andere Runden
behalten ihre Nummern. Nach erfolgreichem Speichern oder Löschen werden die Daten
und damit auch Ranglisten und Verlauf aktualisiert. Eine Onlineverbindung ist nötig.

## Tests

Die Regressionstests benötigen nur Node.js, keine zusätzlichen Pakete:

```sh
node --test tests/*.test.cjs
```

Sie prüfen Teilnehmerauswahl, Teilnahmefilter und Grenzfälle, Verlaufsskala,
PIN-Schutz, Bearbeiten/Löschen, Validierung, Fehler-Rücknahme und Service Worker.

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
