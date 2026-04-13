<?php
/**
 * Import-Skript für Produktnamen
 * 
 * 1. Liest wp_posts.csv
 * 2. Extrahiert Namen zwischen ""
 * 3. Erstellt produkte_namen.csv
 * 4. Importiert in die Datenbank (is_used = 1)
 */

require_once 'api/config.php';

$inputFile = 'wp_posts.csv';
$outputFile = 'produkte_namen.csv';

if (!file_exists($inputFile)) {
    die("Fehler: $inputFile wurde nicht gefunden.\n");
}

$handle = fopen($inputFile, 'r');
if (!$handle) {
    die("Fehler beim Öffnen von $inputFile.\n");
}

$csvOutput = fopen($outputFile, 'w');
fputcsv($csvOutput, ['Produktname']);

$extractedNames = [];
$headerSkipped = false;

while (($row = fgetcsv($handle)) !== false) {
    if (!$headerSkipped) {
        $headerSkipped = true;
        continue;
    }
    
    if (empty($row[0])) continue;
    $title = $row[0];
    
    // Extrahiere Text zwischen den inneren Anführungszeichen
    // CSV-Format: ""Name"" -> fgetcsv macht "Name" daraus
    if (preg_match('/"([^"]+)"/', $title, $matches)) {
        $name = trim($matches[1]);
        if (!empty($name)) {
            $extractedNames[] = $name;
            fputcsv($csvOutput, [$name]);
        }
    }
}

fclose($handle);
fclose($csvOutput);

echo "Extraktion abgeschlossen. " . count($extractedNames) . " Namen gefunden.\n";
echo "Datei '$outputFile' wurde erstellt.\n";

// Datenbank-Integration
$pdo = getDBConnection();
if (!$pdo) {
    echo "HINWEIS: Datenbankverbindung fehlgeschlagen. Nur CSV wurde erstellt.\n";
    exit;
}

try {
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("INSERT INTO names (name, is_used) VALUES (?, 1) ON DUPLICATE KEY UPDATE is_used = 1");
    
    foreach ($extractedNames as $name) {
        $stmt->execute([$name]);
    }
    
    $pdo->commit();
    echo "Datenbank wurde erfolgreich aktualisiert (" . count($extractedNames) . " Einträge).\n";
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Datenbank-Fehler: " . $e->getMessage() . "\n";
}
