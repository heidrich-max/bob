<?php
/**
 * Spezial-Import für namensliste.csv
 * 
 * 1. Repariert Umlaute (Konvertierung Windows-1252 -> UTF-8)
 * 2. Erkennt Semikolon als Trenner
 * 3. Importiert in die Datenbank (is_used = 0)
 */

require_once 'api/config.php';

$inputFile = 'namensliste.csv';

if (!file_exists($inputFile)) {
    die("Fehler: $inputFile wurde nicht gefunden.\n");
}

echo "Starte Import von $inputFile...\n";

// Gesamte Datei einlesen um Encoding zu korrigieren
$content = file_get_contents($inputFile);

// Von Windows-1252 / ISO-8859-1 nach UTF-8 konvertieren
$contentUtf8 = mb_convert_encoding($content, 'UTF-8', 'ISO-8859-1, Windows-1252');

// In Zeilen aufteilen
$lines = explode("\n", str_replace(["\r\n", "\r"], "\n", $contentUtf8));

$pdo = getDBConnection();
if (!$pdo) {
    die("Fehler: Datenbankverbindung fehlgeschlagen.\n");
}

$addedCount = 0;
$skippedCount = 0;

try {
    $pdo->beginTransaction();
    
    // INSERT IGNORE verhindert doppelte Einträge falls UNIQUE KEY gesetzt ist
    $stmt = $pdo->prepare("INSERT IGNORE INTO names (name, is_used) VALUES (?, 0)");
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) continue;
        
        // Mit Semikolon teilen (erste Spalte ist der Name)
        $parts = str_getcsv($line, ';');
        $name = trim($parts[0] ?? '');
        
        if (!empty($name)) {
            $stmt->execute([$name]);
            if ($stmt->rowCount() > 0) {
                $addedCount++;
            } else {
                $skippedCount++;
            }
        }
    }
    
    $pdo->commit();
    echo "\nFertig!\n";
    echo "✅ Erfolgreich hinzugefügt: $addedCount Namen\n";
    echo "⏭️ Übersprungen (bereits vorhanden): $skippedCount Namen\n";
    echo "\nDie Umlaute wurden dabei automatisch repariert.\n";
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    die("Datenbank-Fehler beim Import: " . $e->getMessage() . "\n");
}
