# Doppelkopf PWA – Deployment-Anleitung

## Was du bekommst

Eine **Progressive Web App** die:
- Auf Android und iOS vom Homescreen startbar ist (wie eine echte App)
- Offline funktioniert (gecachte Daten)
- Echtzeit-Daten aus Supabase lädt
- Neue Spielrunden eintragen kann (PIN-geschützt)

---

## Schritt 1 – Supabase für Schreibzugriff vorbereiten

Die App schreibt neue Runden direkt in Supabase. Dafür muss Row Level Security (RLS)
für die Schreib-Tabellen erlaubt werden.

Öffne den **SQL Editor** in Supabase und führe aus:

```sql
-- Lesezugriff auf Views für alle (anonym)
ALTER TABLE players      ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds       ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_scores ENABLE ROW LEVEL SECURITY;

-- Lesen: alle dürfen alles lesen
CREATE POLICY "Lesen erlaubt" ON players      FOR SELECT USING (true);
CREATE POLICY "Lesen erlaubt" ON seasons      FOR SELECT USING (true);
CREATE POLICY "Lesen erlaubt" ON rounds       FOR SELECT USING (true);
CREATE POLICY "Lesen erlaubt" ON round_scores FOR SELECT USING (true);

-- Schreiben: alle dürfen neue Runden eintragen
-- (Die PIN in der App ist der UI-seitige Schutz)
CREATE POLICY "Eintragen erlaubt" ON rounds       FOR INSERT WITH CHECK (true);
CREATE POLICY "Eintragen erlaubt" ON round_scores FOR INSERT WITH CHECK (true);
```

---

## Schritt 2 – config.js befüllen

Öffne `config.js` und trage deine Daten ein:

```javascript
window.DOKO_CONFIG = {
  supabaseUrl: "https://DEINE-ID.supabase.co",   // Project Settings → API → Project URL
  supabaseKey: "eyJ...",                           // Project Settings → API → anon public
  entryPin:    "1234",                             // Dein Wunsch-PIN
  currentSeason: 2025,
  appTitle: "Doppelkopf Liste",
};
```

**Wo findest du die Werte in Supabase?**
- Gehe zu **Project Settings** (Zahnrad-Symbol)
- Klicke auf **API**
- **Project URL** → `supabaseUrl`
- **anon public** (unter "Project API keys") → `supabaseKey`

---

## Schritt 3 – Auf Netlify deployen (kostenlos, 5 Minuten)

Netlify ist der einfachste Weg: Dateien reinziehen, fertig.

1. Gehe zu [https://app.netlify.com](https://app.netlify.com)
2. Registriere dich kostenlos (GitHub oder E-Mail)
3. Auf der Startseite siehst du ein Feld: **"Want to deploy a new site without connecting to Git?"**
4. Ziehe den gesamten PWA-Ordner in dieses Feld (drag & drop)
5. Netlify vergibt eine URL wie `https://doko-gladiatoren.netlify.app`

Fertig! Die App ist jetzt erreichbar.

> Eigene Domain möglich: Netlify → Site settings → Domain management → Add custom domain

---

## Schritt 4 – App auf dem Handy installieren

### Android (Chrome)
1. Öffne die Netlify-URL in Chrome
2. Tippe auf die drei Punkte (Menü) oben rechts
3. **"Zum Startbildschirm hinzufügen"**
4. Bestätigen → App erscheint auf dem Homescreen

### iOS (Safari)
1. Öffne die Netlify-URL in **Safari** (nicht Chrome!)
2. Tippe auf das **Teilen-Symbol** (Viereck mit Pfeil nach oben)
3. Scrolle zu **"Zum Home-Bildschirm"**
4. **Hinzufügen** → App erscheint auf dem Homescreen

> **Wichtig für iOS:** Nur Safari unterstützt PWA-Installation auf dem Homescreen.

---

## Schritt 5 – App an Mitspieler verteilen

Schicke einfach den Netlify-Link per WhatsApp. Jeder kann die App installieren –
kein App Store, keine Registrierung.

---

## Update: Neue Runde eintragen

1. App öffnen → **EINTRAGEN** (+ Symbol unten rechts)
2. PIN eingeben
3. Saison und Rundenummer prüfen (wird automatisch vorgeschlagen)
4. Datum wählen
5. Spieler die dabei waren antippen → Punkte und Spiele eingeben
6. **Runde speichern**

Die Daten sind sofort für alle sichtbar.

---

## Alternativen zu Netlify

| Anbieter | Preis | Vorteil |
|----------|-------|---------|
| **Netlify** (empfohlen) | kostenlos | Einfachstes Drag & Drop |
| GitHub Pages | kostenlos | Gut wenn du Git nutzt |
| Vercel | kostenlos | Schnell, gut für Entwickler |
| Eigener Webserver | — | Volle Kontrolle |

---

## Häufige Probleme

**App zeigt "Konfiguration fehlt"**
→ `config.js` wurde nicht gespeichert oder die Werte stimmen nicht.

**"Fehler beim Speichern" beim Eintragen**
→ RLS-Policies aus Schritt 1 nicht ausgeführt. Supabase blockiert den Schreibzugriff.

**iOS: App startet im Safari statt als eigene App**
→ App muss über Safari installiert werden (nicht über Chrome oder andere Browser).

**Daten werden nicht aktualisiert**
→ "↻ Sync" Button tippen oder App schließen und neu öffnen.
