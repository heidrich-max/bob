<?php
$file = 'wp_posts.csv';
$handle = fopen($file, 'r');
if (!$handle) die("File not found");

$header = fgetcsv($handle); // Skip header

$extracted = [];
$count = 0;
while (($row = fgetcsv($handle)) !== false && $count < 50) {
    $title = $row[0];
    
    // Regex matches content between "" or “” or "
    // We look for the last pair or the most likely name
    if (preg_match('/["“]([^"“”]+)["”]/u', $title, $matches)) {
        $name = trim($matches[1]);
    } else {
        // Fallback: take the last word if no quotes
        $parts = explode(' ', $title);
        $name = end($parts);
    }
    
    echo "Original: $title => Extracted: $name\n";
    $count++;
}
fclose($handle);
