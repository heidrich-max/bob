<?php
/**
 * REST API für Namensgenerator
 * 
 * Endpunkte:
 * - GET  ?action=getNames     - Alle Namen abrufen
 * - POST ?action=addNames     - Namen hinzufügen (Array von Namen)
 * - POST ?action=markUsed     - Name als verwendet markieren
 * - POST ?action=resetUsed    - Alle verwendeten Namen zurücksetzen (optional)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

/**
 * Sendet JSON-Response
 */
function sendResponse($success, $data = null, $message = '', $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Sendet Fehler-Response
 */
function sendError($message, $statusCode = 400)
{
    sendResponse(false, null, $message, $statusCode);
}

// Datenbankverbindung herstellen
$db = getDBConnection();
if (!$db) {
    sendError('Datenbankverbindung fehlgeschlagen', 500);
}

// Action-Parameter prüfen
$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        // ===== Namen abrufen =====
        case 'getNames':
            $stmt = $db->query("SELECT id, name, is_used FROM names ORDER BY name ASC");
            $names = $stmt->fetchAll();

            sendResponse(true, [
                'names' => $names,
                'total' => count($names),
                'available' => count(array_filter($names, fn($n) => !$n['is_used'])),
                'used' => count(array_filter($names, fn($n) => $n['is_used']))
            ]);
            break;

        // ===== Namen hinzufügen =====
        case 'addNames':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                sendError('POST-Methode erforderlich', 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $namesToAdd = $input['names'] ?? [];

            if (!is_array($namesToAdd) || empty($namesToAdd)) {
                sendError('Keine Namen zum Hinzufügen angegeben');
            }

            $addedCount = 0;
            $skippedCount = 0;
            $defaultStatus = $input['is_used'] ?? 0; // Globaler Status für Liste oder 0

            $stmt = $db->prepare("INSERT IGNORE INTO names (name, is_used) VALUES (:name, :is_used)");

            foreach ($namesToAdd as $item) {
                $name = "";
                $is_used = $defaultStatus;

                if (is_array($item)) {
                    $name = trim($item['name'] ?? '');
                    $is_used = $item['is_used'] ?? $defaultStatus;
                } else {
                    $name = trim($item);
                }

                if (empty($name))
                    continue;

                $stmt->execute([
                    ':name' => $name,
                    ':is_used' => $is_used ? 1 : 0
                ]);

                if ($stmt->rowCount() > 0) {
                    $addedCount++;
                } else {
                    $skippedCount++;
                }
            }

            sendResponse(true, [
                'added' => $addedCount,
                'skipped' => $skippedCount,
                'total' => count($namesToAdd)
            ], "$addedCount Namen hinzugefügt, $skippedCount übersprungen");
            break;

        // ===== Name als verwendet markieren =====
        case 'markUsed':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                sendError('POST-Methode erforderlich', 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $nameToMark = $input['name'] ?? '';

            if (empty($nameToMark)) {
                sendError('Kein Name angegeben');
            }

            $stmt = $db->prepare("UPDATE names SET is_used = 1 WHERE name = ?");
            $stmt->execute([$nameToMark]);

            if ($stmt->rowCount() > 0) {
                sendResponse(true, null, 'Name als verwendet markiert');
            } else {
                sendError('Name nicht gefunden', 404);
            }
            break;

        // ===== Alle verwendeten Namen zurücksetzen =====
        case 'resetUsed':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                sendError('POST-Methode erforderlich', 405);
            }

            $stmt = $db->exec("UPDATE names SET is_used = 0 WHERE is_used = 1");

            sendResponse(true, ['reset_count' => $stmt], 'Alle Namen wurden zurückgesetzt');
            break;

        // ===== Name aktualisieren (Umbenennen) =====
        case 'updateName':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                sendError('POST-Methode erforderlich', 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $oldName = $input['oldName'] ?? '';
            $newName = trim($input['newName'] ?? '');

            if (empty($oldName) || empty($newName)) {
                sendError('Alter und neuer Name müssen angegeben werden');
            }

            // Prüfen, ob neuer Name bereits existiert
            $checkStmt = $db->prepare("SELECT id FROM names WHERE name = ? AND name != ?");
            $checkStmt->execute([$newName, $oldName]);
            if ($checkStmt->fetch()) {
                sendError('Der Name existiert bereits', 409);
            }

            $stmt = $db->prepare("UPDATE names SET name = ? WHERE name = ?");
            $stmt->execute([$newName, $oldName]);

            if ($stmt->rowCount() > 0) {
                sendResponse(true, ['newName' => $newName], 'Name erfolgreich aktualisiert');
            } else {
                sendError('Name nicht gefunden oder keine Änderung', 404);
            }
            break;

        // ===== Status umschalten (Verfügbar/Verwendet) =====
        case 'toggleStatus':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                sendError('POST-Methode erforderlich', 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $name = $input['name'] ?? '';

            if (empty($name)) {
                sendError('Name muss angegeben werden');
            }

            // Aktuellen Status abrufen und umschalten
            $stmt = $db->prepare("UPDATE names SET is_used = NOT is_used WHERE name = ?");
            $stmt->execute([$name]);

            if ($stmt->rowCount() > 0) {
                // Neuen Status abrufen
                $statusStmt = $db->prepare("SELECT is_used FROM names WHERE name = ?");
                $statusStmt->execute([$name]);
                $result = $statusStmt->fetch();
                
                sendResponse(true, ['is_used' => (bool)$result['is_used']], 'Status erfolgreich geändert');
            } else {
                sendError('Name nicht gefunden', 404);
            }
            break;

        // ===== Name löschen =====
        case 'deleteName':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                sendError('POST-Methode erforderlich', 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $name = $input['name'] ?? '';

            if (empty($name)) {
                sendError('Name muss angegeben werden');
            }

            $stmt = $db->prepare("DELETE FROM names WHERE name = ?");
            $stmt->execute([$name]);

            if ($stmt->rowCount() > 0) {
                sendResponse(true, null, 'Name erfolgreich gelöscht');
            } else {
                sendError('Name nicht gefunden', 404);
            }
            break;

        // ===== Alle Namen löschen (Datenbank leeren) =====
        case 'deleteAll':
            $db->exec("TRUNCATE TABLE names");
            sendResponse(true, null, 'Die Datenbank wurde komplett geleert.');
            break;

        default:
            sendError('Ungültige Action: ' . $action, 400);
    }

} catch (PDOException $e) {
    if (DISPLAY_ERRORS) {
        sendError('Datenbankfehler: ' . $e->getMessage(), 500);
    } else {
        sendError('Ein Fehler ist aufgetreten', 500);
    }
}
