# Doppelkopf PWA – Deployment via GitHub Pages

GitHub Pages ist ein kostenloser Hosting-Dienst direkt von GitHub.
Kein separates Konto nötig, falls du GitHub bereits nutzt.

---

## Was du brauchst

- Einen kostenlosen GitHub-Account → [https://github.com](https://github.com)
- Die 7 Dateien aus dem ZIP (entpackt)
- 10 Minuten

---

## Schritt 1 – GitHub-Konto anlegen (falls noch nicht vorhanden)

1. Gehe zu [https://github.com/signup](https://github.com/signup)
2. E-Mail, Passwort und Benutzernamen wählen
3. Konto per E-Mail bestätigen

---

## Schritt 2 – Neues Repository anlegen

Ein „Repository" ist ein Ordner auf GitHub, der deine Dateien enthält.

1. Nach dem Login: klicke oben rechts auf **+** → **New repository**
2. **Repository name:** `doppelkopf` (oder beliebiger Name, wird Teil der URL)
3. **Visibility:** ✅ **Public** wählen — bei Private funktioniert GitHub Pages nur mit kostenpflichtigem Account
4. Alle anderen Einstellungen so lassen
5. Klicke auf **Create repository**

---

## Schritt 3 – Dateien hochladen

Du brauchst **kein Git**, das geht direkt im Browser:

1. Im neuen Repository siehst du den Hinweis *"uploading an existing file"* — klicke darauf
   (oder: klicke auf **Add file** → **Upload files**)
2. Entpacke das ZIP auf deinem Computer
3. Ziehe alle 7 Dateien aus dem `pwa/`-Ordner in das Upload-Feld:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `config.js` ← **vorher befüllen!**
   - `icon-192.png`
   - `icon-512.png`
   - `DEPLOY.md`
4. Scrolle nach unten → klicke **Commit changes**

> ⚠️ **Wichtig:** `config.js` muss vor dem Upload mit deinen Supabase-Zugangsdaten
> und deinem PIN befüllt sein. Danach nicht mehr öffentlich teilen.

---

## Schritt 4 – GitHub Pages aktivieren

1. Klicke im Repository oben auf **Settings** (Zahnrad)
2. Scrolle links zu **Pages**
3. Unter **Branch:** wähle `main` und `/root` → klicke **Save**
4. GitHub zeigt jetzt: *"Your site is live at https://DEIN-USERNAME.github.io/doppelkopf/"*

Die URL sieht so aus:
```
https://dein-username.github.io/doppelkopf/
```

> Es kann 1–2 Minuten dauern bis die Seite erreichbar ist.

---

## Schritt 5 – App auf dem Handy installieren

### Android (Chrome)
1. URL in Chrome öffnen
2. Drei Punkte (Menü) → **„Zum Startbildschirm hinzufügen"**

### iOS (Safari)
1. URL in **Safari** öffnen (nicht Chrome!)
2. Teilen-Symbol → **„Zum Home-Bildschirm"**

---

## Schritt 6 – Update einspielen (z.B. neue config.js)

1. Gehe zu deinem Repository auf GitHub
2. Klicke auf die Datei die du ändern möchtest (z.B. `config.js`)
3. Klicke auf das **Stift-Symbol** (Edit)
4. Änderungen vornehmen → **Commit changes**

Die App wird innerhalb von 1–2 Minuten automatisch aktualisiert.

---

## Vergleich: Netlify vs. GitHub Pages

| | Netlify | GitHub Pages |
|---|---|---|
| Konto nötig | Netlify-Account | GitHub-Account |
| Upload | Drag & Drop | Browser-Upload |
| Updates | Neu hochladen | Datei direkt bearbeiten |
| URL | `deinname.netlify.app` | `user.github.io/doppelkopf` |
| HTTPS | ✅ automatisch | ✅ automatisch |
| Kosten | kostenlos | kostenlos |
| Empfehlung | Einfacher Start | Besser für Updates |

Beide funktionieren gleich gut für die PWA. GitHub Pages hat den Vorteil,
dass du einzelne Dateien direkt im Browser bearbeiten kannst — praktisch
wenn du z.B. den PIN ändern oder die Saison aktualisieren willst.
