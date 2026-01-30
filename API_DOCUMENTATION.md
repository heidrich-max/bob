# API-Dokumentation - Namensgenerator

## Basis-URL

```
/api/api.php
```

## Authentifizierung

Keine Authentifizierung erforderlich (Single-User-Anwendung).

## Response-Format

Alle Endpunkte geben JSON zurück:

```json
{
  "success": true|false,
  "data": {...},
  "message": "Optionale Nachricht"
}
```

## Endpunkte

### 1. Namen abrufen

Ruft alle Namen mit ihrem Status ab.

**Request:**
```
GET /api/api.php?action=getNames
```

**Response:**
```json
{
  "success": true,
  "data": {
    "names": [
      {
        "id": 1,
        "name": "Anna Schmidt",
        "is_used": 0
      },
      {
        "id": 2,
        "name": "Max Müller",
        "is_used": 1
      }
    ],
    "total": 2,
    "available": 1,
    "used": 1
  },
  "message": ""
}
```

---

### 2. Namen hinzufügen

Fügt neue Namen zur Datenbank hinzu. Duplikate werden automatisch übersprungen.

**Request:**
```
POST /api/api.php?action=addNames
Content-Type: application/json

{
  "names": ["Name 1", "Name 2", "Name 3"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "added": 2,
    "skipped": 1,
    "total": 3
  },
  "message": "2 Namen hinzugefügt, 1 übersprungen"
}
```

**Fehler:**
```json
{
  "success": false,
  "data": null,
  "message": "Keine Namen zum Hinzufügen angegeben"
}
```

---

### 3. Name als verwendet markieren

Markiert einen bestimmten Namen als verwendet.

**Request:**
```
POST /api/api.php?action=markUsed
Content-Type: application/json

{
  "name": "Anna Schmidt"
}
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Name als verwendet markiert"
}
```

**Fehler (Name nicht gefunden):**
```json
{
  "success": false,
  "data": null,
  "message": "Name nicht gefunden"
}
```

---

### 4. Verwendete Namen zurücksetzen (Optional)

Setzt alle Namen auf "nicht verwendet" zurück.

**Request:**
```
POST /api/api.php?action=resetUsed
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reset_count": 5
  },
  "message": "Alle Namen wurden zurückgesetzt"
}
```

---

## Fehlerbehandlung

### HTTP-Statuscodes

- `200` - Erfolg
- `400` - Ungültige Anfrage
- `404` - Ressource nicht gefunden
- `405` - Methode nicht erlaubt
- `500` - Serverfehler

### Beispiel-Fehler

```json
{
  "success": false,
  "data": null,
  "message": "Datenbankverbindung fehlgeschlagen"
}
```

## Beispiele

### JavaScript (Fetch API)

**Namen abrufen:**
```javascript
const response = await fetch('api/api.php?action=getNames');
const data = await response.json();
console.log(data.data.names);
```

**Namen hinzufügen:**
```javascript
const response = await fetch('api/api.php?action=addNames', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    names: ['Test Name 1', 'Test Name 2']
  })
});
const data = await response.json();
console.log(data.message);
```

**Name als verwendet markieren:**
```javascript
const response = await fetch('api/api.php?action=markUsed', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Anna Schmidt'
  })
});
const data = await response.json();
```

### cURL

**Namen abrufen:**
```bash
curl "https://ihre-domain.de/api/api.php?action=getNames"
```

**Namen hinzufügen:**
```bash
curl -X POST "https://ihre-domain.de/api/api.php?action=addNames" \
  -H "Content-Type: application/json" \
  -d '{"names":["Name 1","Name 2"]}'
```

**Name als verwendet markieren:**
```bash
curl -X POST "https://ihre-domain.de/api/api.php?action=markUsed" \
  -H "Content-Type: application/json" \
  -d '{"name":"Anna Schmidt"}'
```

## Sicherheit

- **SQL-Injection:** Alle Queries verwenden Prepared Statements
- **XSS:** JSON-Encoding verhindert Script-Injection
- **CORS:** Konfigurierbar in `api.php` und `.htaccess`
- **config.php:** Geschützt durch `.htaccess`

## Datenbank-Schema

```sql
CREATE TABLE names (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_name (name),
    INDEX idx_is_used (is_used)
);
```

## Erweiterungsmöglichkeiten

Zukünftige Features könnten umfassen:

1. **Benutzer-Authentifizierung**
   - JWT-Token-basierte Authentifizierung
   - Mehrere Benutzer mit eigenen Namenslisten

2. **Kategorien**
   - Namen in Kategorien gruppieren
   - Filter nach Kategorien

3. **Export-Funktion**
   - Namen als CSV exportieren
   - Verwendungshistorie exportieren

4. **Statistiken**
   - Verwendungshäufigkeit
   - Zeitstempel der Verwendung
   - Nutzungsberichte
