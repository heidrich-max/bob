<?php
/**
 * Migration Script: WordPress WooCommerce Products to BOB Names
 * 
 * This script:
 * 1. Reads wp_posts.csv
 * 2. Extracts product names (content within quotes or last word)
 * 3. Connects to the BOB database (using api/config.php)
 * 4. Clears the 'names' table
 * 5. Inserts the extracted names
 */

require_once 'api/config.php';

$file = 'wp_posts.csv';
if (!file_exists($file)) {
    die("Fehler: $file nicht gefunden. Bitte lade die Datei in das Hauptverzeichnis hoch.");
}

$handle = fopen($file, 'r');
$header = fgetcsv($handle); // Skip header

$names = [];
while (($row = fgetcsv($handle)) !== false) {
    if (empty($row[0])) continue;
    $title = $row[0];
    
    // Extraction logic
    if (preg_match('/["“„]([^"“”„]+)["”]/u', $title, $matches)) {
        $name = trim($matches[1]);
    } else {
        $parts = explode(' ', $title);
        $name = end($parts);
    }
    
    if (!empty($name)) {
        $names[] = $name;
    }
}
fclose($handle);

// Remove duplicates
$names = array_unique($names);

echo "Gefundene Namen: " . count($names) . "\n";

$pdo = getDBConnection();
if (!$pdo) {
    die("Fehler: Keine Datenbankverbindung möglich. Prüfe api/config.php");
}

try {
    $pdo->beginTransaction();
    
    // 1. Clear table
    echo "Leere Tabelle 'names'...\n";
    $pdo->exec("TRUNCATE TABLE names");
    
    // 2. Insert names
    echo "Importiere Namen...\n";
    $stmt = $pdo->prepare("INSERT INTO names (name, is_used) VALUES (?, 1)");
    
    foreach ($names as $name) {
        try {
            $stmt->execute([$name]);
        } catch (PDOException $e) {
            // Skip duplicates if any unique constraint issues remain
            echo "Überspringe Duplikat oder Fehler: $name\n";
        }
    }
    
    $pdo->commit();
    echo "Erfolgreich abgeschlossen! " . count($names) . " Namen wurden importiert.\n";
    
} catch (Exception $e) {
    $pdo->rollBack();
    die("Fehler während der Migration: " . $e->getMessage());
}
