# 🚀 Schnellstart-Anleitung: Deployment auf Plesk

## Übersicht

Diese Anleitung hilft Ihnen, die Datenbank-Version des Namensgenerators schnell auf Ihrem Plesk-Server zu deployen.

## ✅ Checkliste vor dem Deployment

- [x] Plesk-Zugang vorhanden
- [x] MySQL-Datenbank erstellt: `bob_v2`
- [x] Datenbank-Benutzer: `bob.frank.group`
- [x] Datenbank-Passwort: `QmRQepjjzcj5%0#3`
- [ ] FTP/SSH-Zugang zum Server
- [ ] Dateien bereit zum Upload

## 📦 Dateien zum Upload

Alle Dateien aus dem Ordner `Bob v2`:

```
✓ index.html
✓ styles.css  
✓ script.js
✓ beispiel_namen.csv (optional)
✓ api/api.php
✓ api/config.php
✓ api/.htaccess
✓ database.sql (für Import)
```

**Dokumentation (optional):**
- README_DATABASE.md
- API_DOCUMENTATION.md
- config.example.php

## 🔧 Installation in 5 Schritten

### Schritt 1: Datenbank-Schema importieren

**In Plesk:**
1. Datenbanken → bob_v2 → phpMyAdmin öffnen
2. Tab "SQL" auswählen
3. Inhalt von `database.sql` kopieren und einfügen
4. "OK" klicken

**Oder per Kommandozeile:**
```bash
mysql -u bob.frank.group -p bob_v2 < database.sql
```

### Schritt 2: Dateien hochladen

Per FTP alle Dateien in Ihr Webroot hochladen:
```
/httpdocs/
├── index.html
├── styles.css
├── script.js
└── api/
    ├── api.php
    ├── config.php
    └── .htaccess
```

### Schritt 3: Berechtigungen prüfen

Alle Dateien sollten `644` Berechtigungen haben.

### Schritt 4: Testen

1. Browser öffnen: `https://ihre-domain.de/`
2. `beispiel_namen.csv` importieren
3. Namen auswählen und als verwendet markieren
4. In phpMyAdmin prüfen, ob Daten gespeichert wurden

### Schritt 5: Fertig! 🎉

Die Anwendung ist jetzt einsatzbereit!

## 🧪 Schnelltest der API

Öffnen Sie im Browser:
```
https://ihre-domain.de/api/api.php?action=getNames
```

Erwartete Antwort:
```json
{
  "success": true,
  "data": {
    "names": [],
    "total": 0,
    "available": 0,
    "used": 0
  }
}
```

## ⚙️ Konfiguration

### API-URL anpassen (falls nötig)

In `script.js` Zeile 2:
```javascript
const API_URL = 'api/api.php'; // Pfad anpassen falls nötig
```

### Offline-Modus (ohne Datenbank)

In `script.js` Zeile 3:
```javascript
const USE_API = false; // Nutzt LocalStorage statt Datenbank
```

## 🔍 Troubleshooting

### Problem: Weiße Seite / Keine Daten

**Lösung:**
1. F12 drücken → Konsole öffnen
2. Fehler prüfen
3. Network-Tab → API-Aufrufe prüfen

### Problem: "Datenbankverbindung fehlgeschlagen"

**Lösung:**
1. `api/config.php` öffnen
2. Zugangsdaten überprüfen:
   - DB_HOST: `localhost`
   - DB_NAME: `bob_v2`
   - DB_USER: `bob.frank.group`
   - DB_PASS: `QmRQepjjzcj5%0#3`

### Problem: CORS-Fehler

**Lösung:**
1. Prüfen ob `api/.htaccess` hochgeladen wurde
2. In Plesk: Apache-Module → `mod_headers` aktivieren

## 📚 Weitere Dokumentation

- **Vollständige Installation:** `README_DATABASE.md`
- **API-Referenz:** `API_DOCUMENTATION.md`
- **Funktionsübersicht:** `walkthrough.md`

## 🔒 Sicherheitshinweise

✅ **Bereits implementiert:**
- SQL-Injection-Schutz (Prepared Statements)
- config.php durch .htaccess geschützt
- CORS-Header konfiguriert

⚠️ **Empfohlen:**
- SSL/TLS aktivieren (HTTPS)
- Regelmäßige Datenbank-Backups
- Debug-Modus deaktivieren (`DISPLAY_ERRORS = false` in config.php)

## 💡 Tipps

- **Backup vor Import:** Exportieren Sie die Datenbank vor größeren Änderungen
- **Test-Umgebung:** Testen Sie Updates zuerst in einer Subdomain
- **Browser-Cache:** Bei Änderungen Strg+F5 drücken

## 🆘 Support

Bei Problemen:
1. Browser-Konsole (F12) prüfen
2. PHP-Fehlerprotokoll in Plesk ansehen
3. `DISPLAY_ERRORS = true` in `api/config.php` setzen (nur temporär!)

---

**Viel Erfolg beim Deployment! 🚀**
