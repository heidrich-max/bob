<?php
$title = '4-Farb Kugelschreiber "EdgeWrite"';
if (preg_match('/"([^"]+)"/', $title, $matches)) {
    echo "Found: " . $matches[1] . "\n";
} else {
    echo "Not found\n";
}
