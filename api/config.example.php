<?php
/**
 * BEISPIEL-KONFIGURATIONSDATEI
 * 
 * Kopieren Sie diese Datei zu 'config.php' und passen Sie die Werte an.
 * 
 * WICHTIG: Löschen Sie diese Datei nach dem Setup oder stellen Sie sicher,
 * dass sie nicht öffentlich zugänglich ist!
 */

// Datenbank-Verbindungsparameter
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'IHR_DATENBANKNAME');
define('DB_USER', 'IHR_DATENBANKBENUTZER');
define('DB_PASS', 'IHR_DATENBANKPASSWORT');
define('DB_CHARSET', 'utf8mb4');

// Fehlerbehandlung
define('DISPLAY_ERRORS', false); // Auf true setzen für Debugging, false für Produktion

// Zeitzone
date_default_timezone_set('Europe/Berlin');

/**
 * Datenbankverbindung erstellen
 * 
 * @return PDO|null
 */
function getDBConnection()
{
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        if (DISPLAY_ERRORS) {
            error_log("Datenbankverbindung fehlgeschlagen: " . $e->getMessage());
        }
        return null;
    }
}
