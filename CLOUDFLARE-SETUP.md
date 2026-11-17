# Cloudflare (Free) vor GitHub Pages schalten

Ziel: smyagency.de läuft weiter auf GitHub Pages, aber über Cloudflare. Damit lassen sich
Cache-Header (1 Jahr für statische Dateien), Brotli und HTTP/3 steuern – das kann GitHub Pages
selbst nicht (dort fest `max-age=600`).

Dauer: ca. 30 Minuten Arbeit + bis zu 24 h Wartezeit, bis die Nameserver-Umstellung greift.
Die Website bleibt währenddessen erreichbar.

---

## 0. Vorher prüfen (5 Min.)

1. Beim Domain-Anbieter (dort, wo smyagency.de registriert ist) die **aktuellen DNS-Einträge
   notieren oder als Screenshot sichern** – vor allem:
   - **MX-Einträge** (E-Mail-Empfang!)
   - **TXT-Einträge** (SPF, DKIM, DMARC, Google-/Meta-Verifizierungen)
   - A/AAAA/CNAME für `smyagency.de` und `www`
2. Prüfen, ob beim Domain-Anbieter **DNSSEC** aktiv ist. Falls ja: **vor** der
   Nameserver-Umstellung deaktivieren (sonst ist die Domain bis zu 48 h nicht erreichbar).
   Nach der Umstellung kann DNSSEC in Cloudflare neu aktiviert werden (Schritt 7).

## 1. Cloudflare-Konto und Domain anlegen

1. Auf https://dash.cloudflare.com kostenlos registrieren.
2. **„Domain hinzufügen"** → `smyagency.de` eingeben → **Free-Plan** wählen.
3. Cloudflare liest die bestehenden DNS-Einträge automatisch ein.

## 2. DNS-Einträge in Cloudflare kontrollieren

Unter **DNS → Einträge** müssen genau diese Einträge für GitHub Pages vorhanden sein
(fehlende ergänzen, abweichende alte A-Einträge für `@` löschen):

| Typ   | Name  | Inhalt                  | Proxy-Status |
|-------|-------|-------------------------|--------------|
| A     | `@`   | `185.199.108.153`       | Nur DNS (grau) – siehe Schritt 4 |
| A     | `@`   | `185.199.109.153`       | Nur DNS (grau) |
| A     | `@`   | `185.199.110.153`       | Nur DNS (grau) |
| A     | `@`   | `185.199.111.153`       | Nur DNS (grau) |
| AAAA  | `@`   | `2606:50c0:8000::153`   | Nur DNS (grau) |
| AAAA  | `@`   | `2606:50c0:8001::153`   | Nur DNS (grau) |
| AAAA  | `@`   | `2606:50c0:8002::153`   | Nur DNS (grau) |
| AAAA  | `@`   | `2606:50c0:8003::153`   | Nur DNS (grau) |
| CNAME | `www` | `sumy68.github.io`      | Nur DNS (grau) |

Zusätzlich: **alle MX- und TXT-Einträge aus Schritt 0 vergleichen** – sie müssen 1:1
übernommen sein. MX-Einträge sind immer „Nur DNS" (kein Proxy möglich).

Zunächst alles auf **grau („Nur DNS")** lassen – Begründung in Schritt 4.

## 3. Nameserver beim Domain-Anbieter umstellen

Cloudflare zeigt zwei Nameserver an, z. B. `anna.ns.cloudflare.com` und `bob.ns.cloudflare.com`
(bei dir stehen andere Namen – genau die angezeigten verwenden).

Beim Domain-Anbieter:

1. Im Kundenbereich die Domain `smyagency.de` öffnen → **„Nameserver"** bzw. **„DNS-Server"**.
2. Option **„eigene / externe Nameserver verwenden"** wählen
   (Bezeichnung je nach Anbieter, z. B. IONOS: „Nameserver ändern → Eigene Nameserver";
   Strato: „Domainverwaltung → DNS → NS-Record"; united-domains: „Nameserver-Einstellungen").
3. Die bisherigen Nameserver durch die **zwei Cloudflare-Nameserver** ersetzen, speichern.
4. Sonst beim Domain-Anbieter **nichts** ändern – Domain-Vertrag und E-Mail-Postfächer bleiben dort.

Danach in Cloudflare **„Nameserver erneut prüfen"** klicken. Die Umstellung dauert meist
1–4 Stunden, maximal 24 h. Cloudflare schickt eine E-Mail, wenn die Domain **„Aktiv"** ist.

## 4. HTTPS: GitHub-Zertifikat sichern, dann Proxy einschalten

GitHub Pages stellt sein eigenes Zertifikat nur aus, wenn es die Domain direkt sieht.
Darum die Reihenfolge:

1. Domain ist in Cloudflare **aktiv**, Einträge noch **grau**.
2. GitHub → Repository **SMY3** → **Settings → Pages**: Custom domain `smyagency.de` muss
   „DNS check successful" zeigen, **„Enforce HTTPS"** ist angehakt
   (falls ausgegraut: Domain kurz entfernen, speichern, wieder eintragen – dann wird das
   Zertifikat neu ausgestellt; kann bis zu 1 h dauern).
3. Erst danach in Cloudflare **DNS** alle A-, AAAA- und den `www`-CNAME-Eintrag auf
   **orange („Proxied")** stellen.

## 5. SSL/TLS-Einstellungen

**SSL/TLS → Übersicht → Verschlüsselungsmodus:**

- **„Vollständig (Full)"** einstellen. Sobald alles läuft, auf **„Vollständig (streng)"**
  wechseln – das funktioniert, weil GitHub ein gültiges Zertifikat hat (Schritt 4).
- **Niemals „Flexibel"** – das erzeugt bei GitHub Pages eine Weiterleitungsschleife.

**SSL/TLS → Edge-Zertifikate:**

- **„Immer HTTPS verwenden"**: An
- **„Automatische HTTPS-Umschreibungen"**: An
- Minimale TLS-Version: 1.2

## 6. Cache-Regeln (1 Jahr Browser-Cache für statische Dateien)

> **Wichtig, bevor du das aktivierst:** Die JS- und CSS-Dateien der Website haben keine
> Versionsnummer im Namen (z. B. `/smy-3d.js`, `/startseite.js`, `/design-system.css`).
> Bei 1 Jahr Browser-Cache würden wiederkehrende Besucher Änderungen an diesen Dateien
> **bis zu 1 Jahr lang nicht sehen**. Empfehlung:
>
> - **Variante A (empfohlen):** Vorher Versions-Parameter einbauen lassen
>   (`/smy-3d.js?v=0162bbb`, automatisch beim Build). Dann sind 1 Jahr + `immutable` sicher.
> - **Variante B:** Regel 1 sofort (Bilder, Schriften, Videos ändern sich praktisch nie),
>   JS/CSS vorerst mit **1 Tag** Browser-TTL in einer zweiten Regel.

**Caching → Cache-Regeln → „Regel erstellen":**

**Regel 1 – Statische Dateien**

- Name: `Statische Assets 1 Jahr`
- Wenn eingehende Anfragen übereinstimmen: **Benutzerdefinierter Filterausdruck** → „Ausdruck bearbeiten":

  ```
  (http.host eq "smyagency.de" and http.request.uri.path.extension in {"js" "css" "png" "jpg" "jpeg" "webp" "avif" "gif" "svg" "ico" "woff2" "woff" "mp4" "webm"})
  ```
  (Variante B: `"js" "css"` hier weglassen und eine zweite Regel nur mit `{"js" "css"}` und
  Browser-TTL 1 Tag anlegen.)
- Cache-Berechtigung: **Für Cache berechtigt**
- Edge-TTL: **Cache-Control-Header ignorieren und diese TTL verwenden** → **1 Monat**
- Browser-TTL: **Ursprüngliche TTL überschreiben** → **1 Jahr**
- Speichern / Bereitstellen.

HTML-Seiten bekommen **keine** Regel – sie bleiben bei GitHubs 10 Minuten, damit
Text-Änderungen sofort sichtbar sind.

**Optional `immutable` ergänzen** (nur mit Variante A sinnvoll):
**Regeln → Transform Rules → „Antwort-Header ändern" → Regel erstellen**, gleicher Filterausdruck
wie Regel 1, Aktion **„Festlegen"**: Header `Cache-Control`, Wert
`public, max-age=31536000, immutable`.

## 7. Brotli, HTTP/3, DNSSEC

- **Brotli:** Ist bei Cloudflare inzwischen immer aktiv (eigener Schalter existiert nicht mehr).
  Unter **Geschwindigkeit → Einstellungen** nur prüfen, dass nichts deaktiviert ist.
- **HTTP/3:** **Netzwerk → „HTTP/3 (mit QUIC)"**: An. „0-RTT-Verbindungswiederaufnahme": An.
- **Rocket Loader: AUS lassen** (verändert die Ladereihenfolge der Skripte).
- **Auto Minify** gibt es nicht mehr – nichts zu tun.
- **DNSSEC** (falls in Schritt 0 deaktiviert): **DNS → Einstellungen → DNSSEC aktivieren**,
  den angezeigten DS-Eintrag beim Domain-Anbieter eintragen.

## 8. Testen

Im Terminal:

```
curl -sI https://smyagency.de/smy-3d.js | grep -iE "cache-control|cf-cache-status|server"
curl -sI https://smyagency.de/ | grep -iE "cache-control|cf-cache-status|alt-svc"
```

Erwartet:
- `server: cloudflare`
- Bei `smy-3d.js`: `cache-control: max-age=31536000` (bzw. 1 Tag bei Variante B),
  beim zweiten Aufruf `cf-cache-status: HIT`
- Bei der Startseite: `alt-svc: h3=...` (HTTP/3 aktiv)

Zusätzlich: Kontaktformular (Formspree) einmal testen und eine Test-E-Mail an die
Firmenadresse schicken (MX-Einträge korrekt?).

## 9. Nach jedem Deploy

Nur nötig für geänderte Dateien ohne Versions-Parameter:
**Caching → Konfiguration → „Alles bereinigen"** (Purge Everything). Das leert den
Cloudflare-Cache – den Browser-Cache der Besucher aber **nicht** (daher Variante A).

## Rückweg

Falls etwas nicht funktioniert: Beim Domain-Anbieter wieder die ursprünglichen Nameserver
eintragen. Nach einigen Stunden läuft alles wie vorher direkt über GitHub Pages.
