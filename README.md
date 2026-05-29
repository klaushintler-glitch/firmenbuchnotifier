# Walkthrough: Firmenbuch Notifier

We have successfully built and verified the **Firmenbuch Notifier** application, featuring a premium Pinterest-style layout, secure server-side authentication proxy, and a fully automated registry update detector.

---

## What was Built

1. **SOAP API Client (`src/services/firmenbuchService.ts`)**
   - Implements XML generation for `SUCHEFIRMAREQUEST`, `SUCHEURKUNDEREQUEST`, and `URKUNDEREQUEST`.
   - Parses responses using `fast-xml-parser` with regex-based XML namespace stripping for robustness.
   - Automatically falls back to a **Demo/Mock Mode** with rich simulated Austrian company data and files if no API key is present, making the application fully testable out-of-the-box.
2. **Secure Proxy API Routes (`src/app/api/...`)**
   - `/api/search`: Proxies searches to protect the Firmenbuch API key.
   - `/api/documents`: Returns list of files for a company FNR.
   - `/api/download`: Decodes base64 file payloads from SOAP response and serves them as direct binary downloads.
   - `/api/favorites`: Syncs favorites with Supabase. Automatically queries and seeds existing documents of a newly favorited company to prevent notification spam.
   - `/api/auth/login` & `/api/auth/signup`: Proxies auth requests to keep Supabase credentials secure on the server.
3. **Pinterest-Style Responsive UI (`src/app/globals.css`, `src/app/page.tsx`)**
   - Implements a responsive Masonry Grid in Vanilla CSS using CSS columns.
   - Designed a premium dark/light Facebook Blue color palette.
   - **Logo Icon**: Styled with a bold lowercase `fn` text badge mimicking the Facebook logo.
   - **`AuthModal`**: Renders glassmorphic auth cards for registration and login.
   - **`DocDrawer`**: A custom slide-in sidebar showing documents and trigger downloads.
   - **`AboutCard`**: Sidebar displaying project information and a support Ko-fi button.
4. **Automated Cron Update Worker (`src/bin/cron-check.ts`)**
   - Gathers all tracked FNRs, checks for new uploads via the SOAP service, updates the tracking DB, and dispatches email notifications via Resend.

---

## Database Migration Setup

To configure your Supabase database:
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** in the left menu.
3. Create a new query, paste the contents of [**`schema.sql`**](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/services/schema.sql) and click **Run**.
4. This will set up the `profiles`, `favorites`, and `tracked_documents` tables, activate Row Level Security (RLS) policies, and install the trigger enforcing the **10-favorites-limit**.

---

## Local Development & Setup

### 1. Environment Configuration
Ensure your [**`.env`**](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/.env) file is configured. By default, it contains the Supabase and Resend keys you provided.
- If you have an active Firmenbuch API key, add it to `FIRMENBUCH_API_KEY`.
- If `FIRMENBUCH_API_KEY` is left blank, the app will run in **Demo/Mock Mode** using simulated data.

### 2. Install dependencies & Run Development Server
Run the following commands in the directory:
```bash
# Run local Next.js dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Test Verification Results

All tests have been fully compiled and verified against type-resolution constraints. They can be executed locally using the following commands:

```bash
# Run all tests (API parser tests + Cron worker flow tests)
npm run test
```

### Output of Test Suite:
```
Running XML Namespace Stripping Test...
✔ XML Namespace Stripping Test passed!

Running Mock Service Integration Tests...
[Firmenbuch API] Running search in Mock Mode for: "mayer"
Found 3 companies matching "mayer".
[Firmenbuch API] Running getCompanyDocuments in Mock Mode for FNR: 123456a
Found 3 documents for company '123456a'.
[Firmenbuch API] Running downloadDocument in Mock Mode for Key: 123456a_doc_1_jahresabschluss_2024
Downloaded document name: "Jahresabschluss_2024.pdf" with length 680 (base64).
✔ Mock Service Integration Tests passed!

All API Client Tests Passed Successfully!

[Cron Job] Starting Firmenbuch update check...
Starting test for Cron Notification flow...
[Cron Job] Checking 1 unique companies...
[Cron Job] New document detected! Key: 123456a_doc_3_gesellschaftsvertrag, Type: Gesellschaftsvertrag
[Cron Job] Successfully tracked 1 new documents in DB.
[Cron Job] Sending 1 email notifications...
[Cron Job] Notification sent successfully to klaus@test.com
✔ Cron update detection logic verified successfully!

All Cron Worker Tests Passed Successfully!
```

---

## Running the Notifier (Cron Job)

To schedule the periodic Firmenbuch update check, run:
```bash
npm run cron-check
```
This script queries the SOAP API for all currently favorited FNRs, checks if there are new documents, tracks them, and dispatches Resend notification emails.
In production, schedule this script (e.g. hourly) using **Windows Task Scheduler** or **cron**:
```bash
# Example crontab entry for hourly checks (Linux/Mac style)
0 * * * * cd /path/to/project && npm run cron-check
```

---

## Release v1.1.0: Direktlinks zu Dokumenten aus E-Mails

Wir haben ein System integriert, mit dem Benutzer durch Klicken auf einen Link in der Resend-E-Mail-Benachrichtigung direkt zum neuen Dokument in der Web-App weitergeleitet werden.

### Technische Umsetzung:
1. **Link-Generierung im Backend ([`cron-check.ts`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/bin/cron-check.ts)):**
   - Baut automatisch eine URL mit den Parametern `?fnr=<FNR>&doc=<DOKUMENT_KEY>`.
   - Die Basis-URL wird über die Umgebungsvariable `APP_URL` gesteuert (Standard-Fallback ist `https://firmenbuchnotifier.vercel.app`).
   - Fügt einen ansprechenden Button im Benachrichtigungs-HTML ein (gestylt im Marken-Blau `#1877F2`).
2. **Frontend-Erkennung & Auto-Drawer ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx)):**
   - Liest die Parameter clientseitig in einem `useEffect`-Hook über `window.location.search` aus. Dies verhindert, dass Next.js die statische Seitenoptimierung (SSG) der Startseite deaktiviert.
   - Sucht im Hintergrund nach der Firma und öffnet direkt die Dokumenten-Seitenleiste (`DocDrawer`).
3. **Dokumenten-Hervorhebung ([`DocDrawer.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/components/DocDrawer.tsx) & [`globals.css`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/globals.css)):**
   - Das verlinkte Dokument erhält die CSS-Klasse `.highlighted`, was zu einem blauen Rahmen, einer leichten Hintergrundtönung und einer sanften Puls-Animation führt.

---

## Release v1.2.0: Automatisierte Frontend-Tests (Playwright E2E)

Wir haben **Playwright** integriert, um die wichtigsten Abläufe auf der Benutzeroberfläche vollautomatisch zu testen.

### Technische Umsetzung:
1. **Playwright-Konfiguration ([`playwright.config.ts`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/playwright.config.ts)):**
   - Legt den Test-Ordner auf `src/tests/e2e` fest.
   - Setzt die Basis-URL auf `http://localhost:3000`.
   - Bootet bei Bedarf den lokalen Dev-Server (`npm run dev`) automatisch im Hintergrund.
   - Nutzt einen Chromium-Testbrowser im Headless-Modus.
2. **Erstellte Testfälle (`src/tests/e2e/`):**
   - [**`search-and-drawer.spec.ts`**](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/tests/e2e/search-and-drawer.spec.ts): Testet das Laden der Startseite, die Suche nach FNR `123456a`, das Anklicken der Ergebnis-Karte, das erfolgreiche Laden der Dokumentenliste im Drawer und das anschließende Schließen.
   - [**`direct-links.spec.ts`**](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/tests/e2e/direct-links.spec.ts): Öffnet direkt den Link `/?fnr=123456a&doc=123456a_doc_3_gesellschaftsvertrag` und prüft, ob sich der Drawer sofort für "Mayer Bau GmbH" öffnet und der "Gesellschaftsvertrag" blinkend blau hervorgehoben wird.
3. **Ausführung:**
   - E2E-Tests können jederzeit lokal mit folgendem Befehl gestartet werden:
     ```bash
     npm run test:e2e
     ```

---

## Release v1.3.0: UI-Tuning für Hauptüberschrift und Login-Button

Wir haben die Hauptüberschrift auf der Startseite optimiert und den Anmelde-Button im Header präzisiert.

### Technische Umsetzung:
1. **Hauptüberschrift ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx)):**
   - Der statische Text "Firmenbuch-Einträge" wurde entfernt.
   - Der Beschreibungstext *"Österreichische Firmenbucheinträge suchen und sich bei Änderungen benachrichtigen lassen"* fungiert nun direkt als Haupttitel (`h2.content-title`). Dadurch wird er in einer größeren Schriftgröße (`24px`) und fett (`font-weight: 700`) dargestellt.
2. **Login-Button ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx)):**
   - Der Text des Buttons in der oberen rechten Ecke der App-Kopfzeile wurde von *"Einloggen"* auf *"Einloggen/Registrieren"* geändert, um Benutzern sofort zu verdeutlichen, dass sie sich dort auch registrieren können.

---

## Release v1.3.1: Impressum und Datenschutzerklärung

Wir haben ein Impressum und eine Datenschutzerklärung auf der Webseite eingebunden.

### Technische Umsetzung:
1. **Footer-Links ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx) & [`globals.css`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/globals.css)):**
   - Am unteren Ende der Seite wurde ein dezenter Footer mit Links zum Impressum und der Datenschutzerklärung eingefügt.
   - Die Schriftfarbe verwendet die Variable `--text-secondary` und verfügt über einen harmonischen Hover-Effekt im Primärblau.
2. **Rechtstexte-Overlay ([`InfoModal.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/components/InfoModal.tsx)):**
   - Wir haben eine neue Komponente erstellt, die die Inhalte aus `impressum.txt` und `datenschutzerklaerung.rtf` strukturiert in einem schicken scrollbaren Overlay-Modal darstellt.

---

## Release v1.3.2: Über-Menüpunkt Anpassung

Der Menüpunkt für das Projekt-Info-Sidebar wurde angepasst.

### Technische Umsetzung:
1. **Button-Beschriftung ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx)):**
   - Der Menüpunkt *"About"* im Header wurde in *"Über"* umbenannt.
   - Das Informations-Icon `ℹ️` (weißes i auf blauem Grund) wurde komplett entfernt, um ein minimalistischeres Erscheinungsbild zu erzielen.

---

## Release v1.4.0: Mobile Viewport-Optimierung & Search-Fix

Wir haben die responsive Darstellung für Mobilgeräte überarbeitet, um Darstellungsfehler zu beheben und das Suchfeld voll funktionsfähig zu machen.

### Technische Umsetzung:
1. **Zweispaltiger Header auf Mobilgeräten (< 768px) ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx) & [`globals.css`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/globals.css)):**
   - Die Header-Elemente werden auf kleinen Bildschirmen zweizeilig gestapelt. 
     - **Zeile 1 (Top-Bar)**: Logo und Aktions-Schaltflächen (Über, Favoriten, Login/Logout).
     - **Zeile 2 (Full-Width)**: Die Suchleiste erstreckt sich über die gesamte Breite.
   - Dies behebt die Kollision und Überlagerung der flex-Elemente, wodurch die Suchleiste auf Mobilgeräten wieder uneingeschränkt fokussierbar und klickbar ist.
   - Der Content-Abstand nach oben (`padding-top` von `.app-container`) wurde auf Mobilgeräten auf `150px` angehoben, um Überlappungen zu verhindern.
2. **Platzoptimierung auf kleinen Bildschirmen (< 600px):**
   - Der Text *"FirmenbuchNotifier"* neben dem Logo wird ausgeblendet – es verbleibt nur das prägnante Logo-Icon.
   - Die E-Mail-Adresse des eingeloggten Benutzers wird ausgeblendet, um Platz zu sparen und Überlagerungen mit dem "Abmelden"-Button zu verhindern.
3. **Full-Width Drawer & Mobile Modals:**
   - Die Seiten-Drawer (*Über* und *Dokumenten-Details*) erstrecken sich auf Mobilgeräten über die gesamte Bildschirmbreite (`width: 100%`) für maximale Lesbarkeit.
   - Die Modals (*Einloggen*, *Impressum*, *Datenschutzerklärung*) skalieren nun sauber auf `92%` der Bildschirmbreite mit zentriertem Layout und optimierten Innenabständen.

---

## Release v1.4.1: Desktop-Layout-Reihenfolge & Blaues Herz für Favoriten

Wir haben die horizontale Reihenfolge der Kopfzeilen-Elemente auf Desktop-Bildschirmen korrigiert und das rote Herz des Favoriten-Buttons durch ein blaues Herz-Icon ersetzt.

### Technische Umsetzung:
1. **Header-Reihenfolge ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx) & [`globals.css`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/globals.css)):**
   - Auf Desktops ist die Anordnung nun exakt wie folgt (von links nach rechts): 
     1. Logo-Grafik
     2. Logo-Schriftzug "FirmenbuchNotifier"
     3. Suchfeld
     4. Favoriten-Button
     5. E-Mail-Adresse
     6. Login/Registrieren-Button (oder Logout-Button)
     7. Über-Button
   - Auf Mobilgeräten wird dies nun extrem elegant über ein **CSS Grid** gesteuert (`grid-template-areas`), sodass auf Desktops die natürliche DOM-Reihenfolge greift und auf Mobilgeräten die Top-Row (Logo + Aktionen) über der Bottom-Row (Suchfeld) positioniert wird.
2. **Blaues SVG-Herz-Icon ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx)):**
   - Das rote Emoji-Herz (`❤️`) im Favoriten-Button wurde durch ein blaues, hochauflösendes SVG-Herz ersetzt. 
   - Das Icon leuchtet im inaktiven Zustand im Marken-Blau (`var(--primary-color)`) und wird im aktiven Zustand weiß, exakt passend zur visuellen Favoriten-Hervorhebung in den Suchergebnissen.

---

## Release v1.4.2: Anpassung des Untertitels

Der Beschreibungstext auf der Startseite wurde textlich verfeinert.

### Technische Umsetzung:
1. **Untertitel-Aktualisierung ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx)):**
   - Der bisherige Text *"Österreichische Firmenbucheinträge suchen und sich bei Änderungen benachrichtigen lassen"* wurde durch die präzisere und modernere Formulierung *"Österreichische Firmendaten recherchieren und Firmenbuchänderungen automatisch überwachen"* ersetzt.

---

## Release v1.4.3: SEO-Optimierung (Robots & Sitemap)

Wir haben technische Vorkehrungen getroffen, damit die Webseite von Suchmaschinen (wie Google) optimal indiziert werden kann.

### Technische Umsetzung:
1. **Robots-Konfiguration ([`robots.txt`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/public/robots.txt)):**
   - Weist Suchmaschinen-Bots an, dass die gesamte Webseite gecrawlt und indiziert werden darf.
   - Gibt den Pfad zur XML-Sitemap an.
2. **Sitemap ([`sitemap.xml`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/public/sitemap.xml)):**
   - Listet die Startseite der Applikation als wichtigste Einstiegsadresse für Crawler auf.

---

## Release v1.4.4: Fehlerbehebung Grammatik im Info-Panel

Eine grammatikalische Korrektur im Über-Projekt-Panel wurde vorgenommen.

### Technische Umsetzung:
1. **Rechtschreibkorrektur ([`AboutCard.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/components/AboutCard.tsx)):**
   - Der Satz im Informationsbereich *"Die Nutzung der Webseite gratis."* wurde auf *"Die Nutzung der Webseite ist gratis."* korrigiert.

---

## Release v1.4.5: Konditionale Leersuch-Meldung

Wir haben die Meldung bei einem leeren Suchfeld verfeinert, um Benutzern beim ersten Laden der Seite eine klare Handlungsaufforderung zu präsentieren.

### Technische Umsetzung:
1. **Bedingte Anzeige ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx)):**
   - Befindet sich der Benutzer nicht in der Favoritenansicht und ist das Suchfeld komplett leer, wird statt *"Keine passenden Einträge gefunden. Versuchen Sie es mit einem anderen Begriff."* nun der Text *"Bitte Suche im Suchfeld starten"* angezeigt.
   - Sobald eine Suchanfrage eingetippt wird und diese keine Resultate liefert, erscheint wieder die ursprüngliche Fehlermeldung zum Ändern des Suchbegriffs.

---

## Release v1.4.6: Flexibles Suchverhalten bei aktiven Favoriten

Das Suchfeld wurde so optimiert, dass es auch bei eingeschaltetem Favoriten-Filter voll nutzbar bleibt.

### Technische Umsetzung:
1. **Suchfeld-Freigabe ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx)):**
   - Die Attribute `disabled={showFavoritesOnly}` und die dazugehörige Deckkraft-Reduzierung (`opacity: 0.6`) wurden vom Suchfeld entfernt. Das Suchfeld bleibt somit stets eingabebereit.
2. **Automatischer Filter-Reset bei Tastatureingabe ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx)):**
   - Tippt der Benutzer im aktiven Favoritenmodus ein Zeichen in das Suchfeld ein, wird der Favoriten-Filter (`showFavoritesOnly`) im `onChange`-Handler automatisch auf `false` gesetzt.
   - Die Anwendung wechselt dadurch nahtlos in die Suchresultate-Ansicht zurück, und zeigt sofort die zur Eingabe passenden Firmen an.

---

## Release v1.5.0: Sichere "Passwort vergessen"-Funktion (Resend & Supabase)

Wir haben eine voll funktionsfähige Passwort-Zurücksetzen-Kette integriert, die sich nahtlos in das bestehende Supabase- und Resend.com-Setup einfügt.

### Technische Umsetzung:
1. **Benutzeroberfläche ([`AuthModal.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/components/AuthModal.tsx) & [`ResetPasswordModal.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/components/ResetPasswordModal.tsx)):**
   - Im Anmelde-Tab wurde unterhalb der Notiz der Link *"Kennwort vergessen?"* ergänzt.
   - Durch Klicken auf den Link wechselt die Ansicht zu einem reinen E-Mail-Eingabefeld, um den Reset-Link anzufordern.
   - Erkennt die Startseite einen gültigen Token in der URL (`?reset_token=<TOKEN>`), öffnet sich automatisch das neue `ResetPasswordModal`, in welchem das neue Passwort vergeben und bestätigt werden kann.
2. **Sicherheits- & API-Endpunkt ([`route.ts`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/api/auth/reset-password/route.ts)):**
   - **Token-Generierung (`action: 'request'`)**: Bei einer Anfrage wird ein verschlüsselter, zeitlich begrenzter Token (gültig für 1 Stunde via AES-256-CBC) generiert, der die E-Mail-Adresse und den Ablaufzeitstempel kryptografisch signiert enthält. Aus Sicherheitsgründen wird dem Client nicht mitgeteilt, ob die E-Mail-Adresse existiert oder nicht (Schutz vor User-Enumeration).
   - **E-Mail-Versand**: Der Link wird über **Resend.com** direkt an den Benutzer in einer formatierten E-Mail gesendet.
   - **Passwort-Speicherung (`action: 'confirm'`)**: Nach der Validierung des Tokens wird das Passwort über den Supabase Service-Role-Client via Admin-API (`updateUserById`) direkt in der Benutzerdatenbank überschrieben.

---

## Release v1.5.1: Impressum-Textaktualisierung & Datenschutz-Direktverlinkung

Wir haben das Impressum anhand der Vorlage `Impressum.txt` aktualisiert und einen dynamischen Wechsel zur Datenschutzerklärung integriert.

### Technische Umsetzung:
1. **Rechtstexte-Abgleich ([`InfoModal.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/components/InfoModal.tsx)):**
   - Die Texte im Impressum wurden exakt an die Vorlage `Impressum.txt` angepasst. Insbesondere wurden die Punkte 4, 5 und 6 des Haftungsausschlusses aktualisiert (Ergänzungen bezüglich Haftungsbeschränkung bei Hinweis auf Schäden, detaillierte Erklärung zur Eigenverantwortung und Hinweis zur Aktualität).
2. **Dynamische Verlinkung ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx) & [`InfoModal.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/components/InfoModal.tsx)):**
   - Unter Punkt 3 ("Datenschutz") des Impressums wurde das Wort *"Datenschutzerklärung"* als interaktiver Link/Button implementiert.
   - Durch das Weiterreichen des State-Handlers `onSwitchType={setInfoModalType}` wechselt die Modal-Ansicht bei einem Klick direkt auf die Datenschutzerklärung, ohne das Overlay schließen und neu öffnen zu müssen.

---

## Release v1.5.2: Optimierung des Schließverhaltens des Anmelde-Popups

Wir haben das Verhalten des Anmelde-/Registrierungs-Popups verbessert, um ein versehentliches Schließen durch Klicken außerhalb des Fensters zu verhindern.

### Technische Umsetzung:
1. **Verhinderung des Klicks-Außerhalb ([`AuthModal.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/components/AuthModal.tsx)):**
   - Der `onClick`-Handler, welcher beim Klick auf das Hintergrund-Overlay (`modal-overlay`) die `onClose`-Funktion auslöste, wurde entfernt. Ein Klick außerhalb des Modals schließt dieses nun nicht mehr.
2. **Escape-Taste-Unterstützung:**
   - Ein globaler Keydown-Event-Listener wurde mittels Reacts `useEffect`-Hook hinzugefügt. Sobald die Escape-Taste gedrückt wird, wird das Modal geschlossen.
3. **Formularabsendung (Return/Enter) & X-Schaltfläche:**
   - Das Modal schließt sich weiterhin wie gewohnt durch erfolgreiches Absenden des Formulars (Return/Enter) oder durch direktes Klicken auf die "X"-Schaltfläche rechts oben.

---

## Release v1.5.3: Ko-fi Button Aktualisierung

Wir haben den Spenden-Button auf Ko-fi im "Über"-Panel aktualisiert.

### Technische Umsetzung:
1. **Ko-fi Badge ([`AboutCard.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/components/AboutCard.tsx)):**
   - Der alte, benutzerdefinierte SVG-Button wurde durch die offizielle Ko-fi Image-Badge-Schaltfläche ersetzt.
   - Der Link führt nun zur Aktualisierungs-URL `https://ko-fi.com/V3V7202COK`.
   - Die Zentrierung im Flexbox-Layout der `kofi-section` wurde beibehalten.

---

## Release v1.6.0: E-Mail-Benachrichtigung Schalter für Suchkacheln

Wir haben den alten Link "Dokumente anzeigen" auf den Suchergebnis-Kacheln durch einen eleganten E-Mail-Benachrichtigungs-Schalter ersetzt.

### SQL-Migration erforderlich:
Bitte führen Sie den folgenden Befehl im **Supabase SQL Editor** aus, um das Schema zu aktualisieren:
```sql
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT TRUE;
```

### Technische Umsetzung:
1. **Datenbankschema ([`schema.sql`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/services/schema.sql)):**
   - Die Spalte `email_notifications` (boolean, Standard: `true`) wurde der Tabelle `favorites` hinzugefügt.
2. **Backend PATCH-Endpunkt ([`route.ts`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/api/favorites/route.ts)):**
   - Ein neuer `PATCH`-Endpunkt wurde im API-Favoriten-Router hinzugefügt, um den Schalterstatus für eine Firma in der Datenbank zu aktualisieren.
3. **Filterung im Cron-Job ([`cron-check.ts`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/bin/cron-check.ts)):**
   - Beim Prüfen von Firmenbuch-Updates liest der Cron-Check die Spalte `email_notifications` mit aus.
   - Steht der Wert auf `false`, wird die Generierung der E-Mail für diesen Benutzer übersprungen.
4. **Interaktiver Switch im Frontend ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx) & [`globals.css`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/globals.css)):**
   - Der alte, redundante Link am Fuß der Firmenkachel wurde durch ein schickes iOS-style Slider-Toggle ersetzt.
   - Ist das Unternehmen nicht favorisiert, ist der Schalter standardmäßig aus. Ein Klick darauf favorisiert das Unternehmen automatisch (Herz wird blau) und schaltet E-Mail-Benachrichtigungen ein.
   - Ist das Unternehmen bereits favorisiert, kann der Schalter beliebig umgelegt werden, um E-Mail-Updates zu aktivieren/deaktivieren.

---

## Release v1.6.1: Fehlerbehebung bei Direktlinks (FNR-Fallback)

Wir haben einen Bug behoben, bei dem Direktlinks aus E-Mails (mit dem URL-Parameter `?fnr=...`) zu einer leeren Suchergebnisseite führten, statt das Dokumenten-Drawer für das entsprechende Unternehmen zu öffnen.

### Technische Umsetzung:
1. **API FNR-Erkennung ([`route.ts`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/api/search/route.ts)):**
   - Die authentifizierte Firmensuche der FirmaFind-API durchsucht standardmäßig nur Firmenwortlaute (Namen), nicht jedoch Firmenbuchnummern (FNR).
   - Die Suchroute prüft nun mittels regulärem Ausdruck (`/^\d{1,6}\s*[a-zA-Z]$/`), ob die Suchanfrage eine österreichische Firmenbuchnummer darstellt.
   - Falls die reguläre API-Namenssuche keine Treffer liefert, die Anfrage aber ein FNR-Format hat, generiert das Backend automatisch einen Fallback-Eintrag für diese FNR.
2. **Globaler Favoriten-Namens-Cache:**
   - Vor der Rückgabe des Fallback-Eintrags fragt das Backend die Tabelle `favorites` ab. Wurde diese FNR bereits von irgendeinem Benutzer favorisiert, wird der korrekte Firmenname geladen. Falls nicht, wird ein Platzhaltername `Firma (FNR)` erzeugt.
3. **Frontend FNR-Normalisierung ([`page.tsx`](file:///c:/Users/klaus/OneDrive/Antigravity/Firmenbuchnotifier/src/app/page.tsx)):**
   - Der clientseitige URL-Parameter-Handler vergleicht die zurückgegebenen FNRs nun normalisiert (case-insensitive und ohne Leerzeichen), um sicheres Matching zu garantieren.
   - Der Drawer wird direkt für das geladene Unternehmen geöffnet und das gewünschte PDF-Dokument hervorgehoben.

---

## Release v1.6.2: Logo-Bildkomprimierung für Ladezeitoptimierung

Wir haben die Ladezeit der Startseite durch eine massive Reduzierung der Dateigröße des Logos optimiert.

### Technische Umsetzung:
1. **Bildskalierung & PNG-Optimierung (`public/logo.png`):**
   - Das Logo lag in einer Auflösung von 2048x2048 Pixeln und mit einer Dateigröße von **5,08 MB** vor, obwohl es im Header mit einer Höhe von nur 40px dargestellt wird.
   - Mittels eines PowerShell/.NET GDI+ Skripts haben wir das Logo auf eine hochauflösende Retina-Größe (80x80 Pixel) herunterskaliert.
   - Die Dateigröße konnte dadurch von **5.08 MB auf 10.87 KB** verringert werden (eine Einsparung von über **99,8%**). Die Ladezeit und der Mobilfunk-Datenverbrauch sinken dadurch drastisch.

---

## Release v1.7.0: Firmenbuchstatus, Einreichungs-Verzug & Dokumenten-Statistik

Wir haben die drei neuen Informations-Features (Punkt 1, Punkt 4 und Punkt 5) integriert.

### SQL-Migration (Optional/Empfohlen):
Um die Firmenbuch-Statuswerte und das Gericht direkt für favorisierte Unternehmen persistent in der Datenbank abzuspeichern (damit sie ohne zusätzliche API-Abfragen geladen werden), führen Sie bitte folgenden Befehl im **Supabase SQL Editor** aus:
```sql
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aktiv';
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS gericht TEXT;
```
*Hinweis:* Wenn Sie diese Migration (noch) nicht ausführen, läuft das System dank einer automatischen Fehlerbehandlung im Backend voll funktionsfähig im Fallback-Modus weiter.

### Technische Umsetzung:
1. **Firmenbuchstatus (Punkt 1):**
   - Weist jeder Firma in den Suchergebnissen und in den Favoriten ein Status-Label (z.B. `"Aktiv"` in grün oder `"Gelöscht"` in rot) zu.
   - Auf den Kacheln und im Dokumenten-Drawer wird der Status als dezentes Badge direkt neben dem Firmennamen dargestellt.
   - E2E-Tests bleiben durch Trennung von Überschriften-Klassen und Badges voll funktionsfähig.
2. **Einreichungs-Verzug für Jahresabschlüsse (Punkt 4):**
   - Berechnet im Dokumenten-Drawer dynamisch den Verzug in Monaten zwischen dem Stichtag (`stichtag`, z.B. 31.12.) und dem tatsächlichen Einreichungsdatum (`eingereicht`) bei Jahresabschlüssen.
   - Wird als orangefarbenes Badge (z.B. `"Eingereicht nach 5 Monaten"`) in der Zeile der Dokument-Metadaten angezeigt.
3. **Dokumenten-Statistik auf Favoriten-Kacheln (Punkt 5):**
   - Aggregiert die Anzahl der überwachten Dokumente einer favorisierten Firma im Backend, gruppiert nach Art und liefert diese im GET-Favorites-Endpunkt aus.
   - Zeigt direkt auf der Favoritenkachel eine Zusammenfassung an, z.B. `"3 Dokumente (2 Jahresabschlüsse, 1 Vertrag)"`, ohne zusätzliche SOAP-API-Anfragen stellen zu müssen.

---

## Release v1.7.1: Logo als Home-Button

Wir haben den Logo-Bereich im Header so umgestaltet, dass er als funktionaler "Home-Button" fungiert.

### Technische Umsetzung:
1. **Zustands-Reset (`handleGoHome`):**
   - Durch einen Klick auf das Logo oder den Schriftzug "FirmenbuchNotifier" wird die Startseite in den Anfangszustand zurückgesetzt.
   - Folgende States werden zurückgesetzt: Suchfeld (`query`), Favoriten-Filter (`showFavoritesOnly`), Detail-Seitenleiste (`isDrawerOpen`/`selectedCompany`) sowie die Dokumenten-Hervorhebung (`highlightedDocKey`).
   - Die Standardsuche (Mock-Daten im Demo-Modus) wird neu ausgeführt, um dem Benutzer wieder das gewohnte Einstiegsbild zu präsentieren.
2. **Visuelles Feedback (CSS):**
   - Der Logo-Bereich (`.logo-section`) hat nun einen Zeiger-Cursor (`cursor: pointer`) und wird beim Hovern leicht transparent (`opacity: 0.85`), um die Interaktivität deutlich zu signalisieren.
3. **E2E-Verifizierung:**
   - Alle automatisierten Playwright E2E-Tests wurden ausgeführt und sind weiterhin voll funktionsfähig und grün.

---

## Release v1.7.2: Session-Refresh-Fix & Automatische Favoritenanzeige

Wir haben die Benutzer-Authentifizierung und die Standardansicht für angemeldete Benutzer optimiert.

### Technische Umsetzung:
1. **Dauerhafter Session-Refresh:**
   - Ein neuer Endpunkt `/api/auth/refresh` ermöglicht es dem Client, abgelaufene JWT-Access-Tokens (Lebensdauer standardmäßig 1 Std.) mittels des im LocalStorage abgelegten `refresh_token` geräuschlos im Hintergrund zu erneuern.
   - Dies behebt das Problem, dass wiederkehrende Benutzer fälschlicherweise als angemeldet angezeigt wurden, aber keine Favoriten mehr laden konnten.
2. **Favoriten-Ansicht als Standard bei Einstieg/Login:**
   - Sobald die Session beim Seitenstart erfolgreich wiederhergestellt wird oder sich der Benutzer aktiv einloggt, wird die Ansicht automatisch auf den Favoritenmodus umgeschaltet (`showFavoritesOnly` = `true`).
   - Angemeldete Benutzer sehen so sofort ihre überwachten Firmen, anstatt vor einer leeren Suchmaske zu stehen.
3. **E2E-Tests:**
   - Die Playwright E2E-Tests laufen weiterhin erfolgreich durch.
