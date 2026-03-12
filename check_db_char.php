<?php
require_once 'api/config.php';
$pdo = getDBConnection();
$stmt = $pdo->query("SELECT name FROM names WHERE name LIKE '%J%rgen%'");
while ($row = $stmt->fetch()) {
    echo "Name: " . $row['name'] . "\n";
    echo "Hex: " . bin2hex($row['name']) . "\n";
}
