<?php
$file = 'wp_posts.csv';
$data = file_get_contents($file, false, null, 0, 100);
echo "Raw Hex: " . bin2hex($data) . "\n";

// Check for BOM
if (substr($data, 0, 2) === "\xff\xfe") {
    echo "Detected: UTF-16LE BOM\n";
} elseif (substr($data, 0, 2) === "\xfe\xff") {
    echo "Detected: UTF-16BE BOM\n";
} elseif (substr($data, 0, 3) === "\xef\xbb\xbf") {
    echo "Detected: UTF-8 BOM\n";
} else {
    echo "No BOM detected.\n";
}

// Try reading with conversion
$content = file_get_contents($file);
$utf8_content = mb_convert_encoding($content, 'UTF-8', 'UTF-16LE');
echo "First 100 chars (converted): " . substr($utf8_content, 0, 100) . "\n";
