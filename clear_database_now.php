<?php
/**
 * Einmaliges Skript zum Leeren der Datenbank
 */
require_once 'api/config.php';

$db = getDBConnection();

if (!$db) {
    die("Datenbankverbindung fehlgeschlagen.\n");
}

try {
    $db->exec("TRUNCATE TABLE names");
    echo "Datenbank 'names' wurde erfolgreich geleert.\n";
} catch (PDOException $e) {
    echo "Fehler beim Leeren der Datenbank: " . $e->getMessage() . "\n";
}
