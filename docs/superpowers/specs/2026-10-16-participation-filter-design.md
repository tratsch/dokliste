# Gemeinsamer Teilnahmefilter

Am 16.10.2026 bestätigt: Die Quote bezieht sich auf alle Runden einer Saison.
Der Schalter ist auf allen Seiten verfügbar. Eingabe und Bearbeitung bleiben
vollständig; der Filter darf keine gespeicherten Teilnehmer oder Formulareingaben
entfernen.

- Ein gemeinsamer Schalter „>10 % Runden“ oberhalb aller Ansichten.
- Ein Spieler qualifiziert sich je Saison, wenn seine Zahl unterschiedlicher
  Runden multipliziert mit zehn größer als die Zahl aller Saisonrunden ist.
  Genau 10 % reichen entsprechend der gewünschten Beschriftung „>10 %“ nicht.
  Eine Saison ohne Runden qualifiziert keinen Spieler.
- Alle Runden zählen zur Bezugsgröße, auch ohne gespeicherte Ergebnisse.
  Die Bezugsgröße darf sich durch den Filter nicht verändern.
- Saison, Runden-Ergebniszeilen, Verlauf inklusive Legende und alle Bestenlisten
  verwenden dieselbe Auswahl. Saisonplatzierungen werden nach dem Filtern neu
  berechnet; Jahressieger, Pokale und saisonübergreifende Werte verwenden nur
  qualifizierte Spielersaisons. Die Mindestanzahl von drei Saisons bleibt bestehen.
- Rundenkarten und Verwaltungsaktionen bleiben verfügbar, auch wenn keine ihrer
  Ergebniszeilen den Filter besteht; dann erscheint ein erklärender Leerzustand.
- Rohdaten und Eingabe bleiben vollständig. Umschalten im Eingabeformular erhält
  ungespeicherte Werte. Während Speichern/Löschen ist der Schalter gesperrt.
- Ausgeschlossene Daten werden nie als Ersatz für eine leere Auswahl verwendet.
  Kein NaN und kein dauerhafter Ladespinner bei einer leeren Filterauswahl.

2015: 12 Saisonrunden, bisher fälschlich maximal 10 Spieler-Teilnahmen als Nenner.
Eine Teilnahme muss ausgeschlossen werden, zwei bestehen. Live-Daten enthalten
„Pete“ mit drei Teilnahmen und keinen „Peter“ für 2015. Es werden keine Datensätze
geändert, um einen bestimmten Namen auszublenden.

Prüfung: Node-Tests für Bezugsgröße, Grenzfälle und einheitliche Ansichten; Browser
mit isolierten Testdaten für alle Tabs, Formularerhalt, Bearbeitung und mobiles Layout.
