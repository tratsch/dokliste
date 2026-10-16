# Participation Filter Implementation Plan

> **For agentic workers:** Execute in the existing branch, without worktrees. Review against the approved spec and verify each step.

**Goal:** Einheitlicher Teilnahmefilter auf allen Seiten mit korrekter Saisonquote.

**Architecture:** Unveränderte Rohdaten plus Teilnahmeindex je Saison. `buildViews`
filtert vor Rangberechnung und Aggregation. Gemeinsame Toolbar aktualisiert nur
Auswertungen; Eingabeformular und gespeicherte Daten bleiben vollständig.

**Tech Stack:** HTML/CSS, Vanilla JavaScript, node:test, Playwright.

## Tasks

- [x] `tests/participation-filter.test.cjs`: Tests für 12 Runden/1 und 2 Teilnahmen,
  exakt 10 %, leere Saison, Rangneuberechnung, saisonübergreifende Summen,
  Rundenansicht, Legende und Formularerhalt erstellen; rot ausführen.
- [x] `index.html`: Teilnahmeindex aus allen Runden und den ungefilterten
  Saisonaggregaten aufbauen; gemeinsame strikte Quote in `qualifiesForYear`.
- [x] `buildViews`: vor Saisonrängen filtern, Historie und Allzeitwerte aus derselben
  Auswahl ableiten; Umschalten baut abgeleitete Daten neu auf.
- [x] Globale Toolbar und Status ergänzen, alten Saison-Schalter entfernen;
  keine Formular-Neuerzeugung beim Umschalten in EINTRAGEN.
- [x] Ergebniszeilen in RUNDEN filtern, leere Auswertungen und Bestenlisten korrekt
  darstellen; Eingabe-/Bearbeitungsfunktionen greifen weiter auf Rohdaten zu.
- [x] `README.md` dokumentieren und `sw.js` Cacheversion erhöhen.
- [x] Node-Gesamtsuite, isolierten mobilen Browsertest und `git diff --check`
  erfolgreich ausführen; Code unabhängig prüfen lassen.

## Verifikation

63 Node-Tests erfolgreich. Isolierter Chromium-Test bei 320, 375 und 1280 px:
gemeinsamer Filter in allen Tabs, Saison 2015, Rang-/Siegerberechnung, Verlauf,
vollständige Eingabe, Erhalt von PIN und Entwurf sowie Bearbeiten/Speichern
ohne Verlust ausgeblendeter Ergebnisse. Keine Browserfehler oder Überläufe.
Spezifikation/Plan und Code unabhängig geprüft. Keine echten Datensätze verändert.
