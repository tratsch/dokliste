# Runden korrigieren und löschen

Vom Benutzer am 16.10.2026 bestätigt: Aktionen direkt im Tab RUNDEN,
PIN-Schutz, vorausgefülltes Eingabeformular, Speichern und Abbrechen,
Löschen mit Bestätigung samt Ergebnissen und anschließender Aktualisierung.

## Verhalten

- Jede Rundenkarte erhält Bearbeiten und Löschen. Gesperrte Aktionen führen
  zur bestehenden PIN-Eingabe und werden nach erfolgreicher Eingabe fortgesetzt.
- Bearbeiten verwendet die bestehende Eingabeansicht für Saison, Rundennummer,
  Datum, Teilnehmer, Punkte und Spiele. Vorhandene inaktive Teilnehmer bleiben
  verfügbar. Abbrechen schreibt nichts und kehrt zur Rundenansicht zurück.
- Änderungen aktualisieren dieselbe Runde; bestehende Ergebnisse behalten ihre
  IDs. Hinzugefügte Teilnehmer erhalten neue Ergebnisse, abgewählte werden entfernt.
- Eine Runde mit identischer Saison und Nummer ist unzulässig. Ausgewählte
  Teilnehmer benötigen endliche Punkte und eine positive ganze Spielezahl.
  Negative Punkte sind zulässig; die Spielesumme muss durch vier teilbar sein.
- Löschen bestätigt Runde, Saison und Datum und entfernt Ergebnisse und Runde.
  Andere Runden werden nicht verändert und nicht umnummeriert.
- Speichern/Löschen sperrt weitere Verwaltungsaktionen bis zum Abschluss.
  Ranglisten und Verlauf werden anschließend aus frisch geladenen Daten aufgebaut.

## API und Fehler

Die bestehende Instanz beantwortet eine leere Batch-Anfrage mit 403
"Batch requests are not allowed." Es werden normale POST/PATCH/DELETE-Anfragen
verwendet, ohne Backend-Konfiguration zu ändern. Abgeschlossene Teilschritte
erhalten inverse Operationen, die bei Fehlern in umgekehrter Reihenfolge laufen.
Gelöschte Ergebnisse werden mit ihren bisherigen IDs wiederhergestellt.
Dies ist keine Datenbanktransaktion: Bei Verbindungsabbruch oder fehlgeschlagener
Rücknahme kann der Zustand unklar sein. Die Fehlermeldung fordert dann zur
Synchronisierung und Prüfung auf, statt vollständige Rücknahme zu behaupten.
Keine echten Runden werden bei der Entwicklung verändert.

## Prüfung

Node-Regressionstests für Vorausfüllen, PIN, Validierung, Änderungsoperationen,
Löschen/Abbrechen, Rücknahme, Fehler und Doppelklickschutz. Browserprüfung mit
abgefangener API für den vollständigen Ablauf einschließlich neuer Runde,
inaktivem Teilnehmer, Teilnehmerwechsel, Änderungen und Löschen.
