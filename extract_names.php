<?php
$file = 'wp_posts.csv';
$handle = fopen($file, 'r');
if (!$handle) die("File not found");

$header = fgetcsv($handle); // Header

$results = [];
while (($row = fgetcsv($handle)) !== false) {
    if (empty($row[0])) continue;
    $title = $row[0];
    
    // Improved regex to handle various quote types
    // Matches content between any kind of double quotes
    // (") or escaped CSV quotes ("") or curly quotes (“...”)
    $name = "";
    if (preg_match('/["“„]([^"“”„]+)["”]/u', $title, $matches)) {
        $name = trim($matches[1]);
    } else {
        // Fallback: search for uppercase words at the end if no quotes
        $parts = explode(' ', $title);
        $name = end($parts);
    }
    
    // Skip names that are too long or contain generic words if possible
    // But for now, let's keep it simple.
    if (!empty($name)) {
        $results[] = [
            'original' => $title,
            'extracted' => $name
        ];
    }
}
fclose($handle);

echo json_encode(array_slice($results, 0, 100), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
