# Namensgenerator - Datenbank-Installation

## Übersicht

Diese Anleitung führt Sie durch die Installation der Datenbank-basierten Version des Namensgenerators auf Ihrem Plesk-Server.

## Voraussetzungen

- Plesk-Webhosting mit PHP und MySQL
- FTP- oder SSH-Zugang zum Server
- MySQL-Datenbank bereits erstellt (bob_v2)

## Installation

### Schritt 1: Datenbank-Schema importieren

1. Melden Sie sich in Plesk an
2. Navigieren Sie zu **Datenbanken** → **bob_v2**
3. Klicken Sie auf **phpMyAdmin**
4. Wählen Sie die Datenbank `bob_v2` aus
5. Klicken Sie auf den Tab **SQL**
6. Öffnen Sie die Datei `database.sql` und kopieren Sie den Inhalt
7. Fügen Sie den SQL-Code ein und klicken Sie auf **OK**

**Alternativ per Kommandozeile:**
```bash
mysql -u bob.frank.group -p bob_v2 < database.sql
```

### Schritt 2: Dateien hochladen

Laden Sie alle Dateien auf Ihren Webserver hoch:

```
/ihr-webroot/
├── index.html
├── styles.css
├── script.js
├── beispiel_namen.csv
├── database.sql (optional, nur für Backup)
└── api/
    ├── api.php
    ├── config.php
    ├── .htaccess
    └── config.example.php (optional)
```

**Wichtig:** Die Datei `api/config.php` enthält Ihre Datenbank-Zugangsdaten und sollte **nicht** öffentlich zugänglich sein. Die `.htaccess`-Datei schützt diese bereits.

### Schritt 3: Berechtigungen prüfen

Stellen Sie sicher, dass die PHP-Dateien ausführbar sind:
- `api/api.php` sollte 644 Berechtigungen haben
- `api/config.php` sollte 644 Berechtigungen haben

### Schritt 4: Testen

1. Öffnen Sie Ihre Website im Browser: `https://ihre-domain.de/`
2. Die Anwendung sollte leer starten (keine Namen)
3. Importieren Sie die `beispiel_namen.csv` zum Testen
4. Überprüfen Sie, ob die Namen in der Datenbank gespeichert werden:
   - Öffnen Sie phpMyAdmin
   - Wählen Sie die Tabelle `names`
   - Sie sollten die importierten Namen sehen

### Schritt 5: API-Test (optional)

Testen Sie die API-Endpunkte direkt:

**Namen abrufen:**
```
https://ihre-domain.de/api/api.php?action=getNames
```

Sie sollten eine JSON-Response erhalten:
```json
{
  "success": true,
  "data": {
    "names": [...],
    "total": 0,
    "available": 0,
    "used": 0
  },
  "message": ""
}
```

## Konfiguration

### API-URL anpassen

Falls Ihre Verzeichnisstruktur anders ist, passen Sie in `script.js` die API-URL an:

```javascript
const API_URL = 'api/api.php'; // Passen Sie den Pfad an
```

### Offline-Modus aktivieren

Um die Anwendung ohne Datenbank zu nutzen (nur LocalStorage):

```javascript
const USE_API = false; // In script.js ändern
```

### Debug-Modus aktivieren

Für Fehlersuche können Sie in `api/config.php` den Debug-Modus aktivieren:

```php
define('DISPLAY_ERRORS', true); // Nur für Entwicklung!
```

**Wichtig:** Setzen Sie dies auf `false` für die Produktion!

## Troubleshooting

### Problem: "Datenbankverbindung fehlgeschlagen"

**Lösung:**
1. Überprüfen Sie die Zugangsdaten in `api/config.php`
2. Stellen Sie sicher, dass die Datenbank existiert
3. Prüfen Sie, ob der Datenbankbenutzer die richtigen Rechte hat

### Problem: "CORS-Fehler" in der Browser-Konsole

**Lösung:**
1. Überprüfen Sie, ob die `.htaccess` im `api/`-Verzeichnis vorhanden ist
2. Stellen Sie sicher, dass `mod_headers` in Apache aktiviert ist
3. Falls Sie eine andere Domain verwenden, passen Sie die CORS-Header in `api/api.php` an

### Problem: Namen werden nicht gespeichert

**Lösung:**
1. Öffnen Sie die Browser-Entwicklertools (F12)
2. Prüfen Sie die Konsole auf Fehler
3. Prüfen Sie den Network-Tab für API-Aufrufe
4. Überprüfen Sie die Datenbank-Berechtigungen (INSERT, UPDATE)

### Problem: "INSERT IGNORE" funktioniert nicht

**Lösung:**
- Stellen Sie sicher, dass die Tabelle `names` einen UNIQUE-Index auf der Spalte `name` hat
- Führen Sie das SQL-Schema erneut aus

## Sicherheit

### Empfohlene Maßnahmen:

1. **config.php schützen:** Die `.htaccess` verhindert bereits den direkten Zugriff
2. **SQL-Injection:** Die API verwendet Prepared Statements (bereits implementiert)
3. **HTTPS verwenden:** Aktivieren Sie SSL/TLS in Plesk
4. **Regelmäßige Backups:** Sichern Sie die Datenbank regelmäßig

### Zusätzlicher Schutz (optional):

Fügen Sie in der Haupt-`.htaccess` (im Webroot) hinzu:

```apache
# Schütze sensible Dateien
<FilesMatch "^(config\.php|database\.sql)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

## Datenbank-Wartung

### Backup erstellen

In phpMyAdmin:
1. Wählen Sie die Datenbank `bob_v2`
2. Klicken Sie auf **Exportieren**
3. Wählen Sie **Schnell** und **SQL**
4. Klicken Sie auf **OK**

### Alle Namen löschen

```sql
TRUNCATE TABLE names;
```

### Nur verwendete Namen zurücksetzen

```sql
UPDATE names SET is_used = 0 WHERE is_used = 1;
```

## Support

Bei Problemen:
1. Überprüfen Sie die Browser-Konsole (F12)
2. Prüfen Sie die PHP-Fehlerprotokolle in Plesk
3. Aktivieren Sie temporär `DISPLAY_ERRORS` in `config.php`

## Nächste Schritte

Nach erfolgreicher Installation können Sie:
- Eigene Namen importieren
- Die Anwendung an Ihr Design anpassen
- Weitere Features hinzufügen (z.B. Benutzer-Authentifizierung)
