# Round Management Implementation Plan

> **For agentic workers:** Execute in this existing branch; no worktrees. Review the spec and this plan before implementation.

**Goal:** PIN-geschütztes Bearbeiten und Löschen vorhandener Runden.

**Architecture:** Bestehende Einzeldatei-App erweitern. Gemeinsame Schreib-API
und kompensierbare Operationen; vorhandenes Formular als Bearbeitungsansicht.
Keine Backend-Konfiguration ändern. Tests arbeiten ausschließlich mit Testdaten.

**Tech Stack:** HTML, Vanilla JavaScript, PocketBase REST, node:test, Playwright.

## Task 1: Fehlende Verhaltensweisen durch Tests belegen

**Files:** `tests/round-management.test.cjs`, bestehendes `tests/round-entry.test.cjs`.

- [x] VM-Testharness für DOM, Zustandsdaten und abgefangene Fetch-Aufrufe erstellen.
- [x] Tests für PIN-Fortsetzung, vorausgefüllte inaktive Spieler, Abbruch,
  Validierungsfehler, PATCH statt neuer Runde, Teilnehmerwechsel,
  Löschen mit Bestätigung, Rücknahme und Schreibsperre hinzufügen.
- [x] `node --test tests/*.test.cjs` ausführen; neue Tests müssen wegen fehlender
  Funktionalität fehlschlagen, bestehende Auswahltests weiter bestehen.

## Task 2: Verwaltung implementieren

**Files:** `index.html`.

- [x] `pbWrite(method, collection, id, body)` für POST/PATCH/DELETE ergänzen;
  vorhandenes `pbCreate` darauf aufbauen, HTTP-Fehlerstatus erhalten.
- [x] `applyRoundChanges(operations)` mit inversen Operationen und deutlicher
  Fehlerdiagnose bei unklarem Zustand implementieren.
- [x] Zustände für bearbeitete Runde, vorgemerkte PIN-Aktion und laufenden
  Schreibvorgang ergänzen. Bearbeiten/Löschen auf den Rundenkarten anbieten.
- [x] Formular aus Runde und Ergebnissen befüllen, inaktive bisherige Spieler
  erhalten, Abbrechen/Sperren ergänzen und PIN-Aktion fortsetzen.
- [x] Validierung vor Schreibzugriff; vorhandene Runde und Ergebnis-IDs mit
  PATCH erhalten, Ergebnisse nach Teilnehmerauswahl hinzufügen/entfernen.
- [x] Löschen: Ergebnisse zuerst, Runde zuletzt; Bestätigung vor jedem Zugriff.
- [x] Mehrfachaktionen während Speichern/Löschen blockieren; nach Erfolg neu laden.

## Task 3: Verifikation und Dokumentation

**Files:** `README.md`, `sw.js`, Testdateien.

- [x] `node --test tests/*.test.cjs` vollständig erfolgreich ausführen.
- [x] Im lokalen Headless-Browser mit abgefangener API PIN, Bearbeiten,
  Abbrechen, negative Punkte, Teilnehmerwechsel und Löschen prüfen.
- [x] README um Bedienung, Testkommando und Grenzen der Fehler-Rücknahme ergänzen.
- [x] Service-Worker-Version erhöhen; `git diff --check` und abschließende
  Prüfung der Änderungen ausführen. Keine echten Backend-Daten verändern.

## Ergebnis

31 Node-Tests erfolgreich; mobiler Chromium-Test mit abgefangener API erfolgreich
(PIN, Bearbeiten/Abbrechen, Teilnehmerwechsel, Rücknahme bei Schreibfehlern,
Löschen und neue Runde). Spezifikation/Plan und Code unabhängig geprüft.
`git diff --check` ohne Befund. Keine echten Rundendaten verändert.
