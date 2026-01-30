-- =============================================
-- Datenbank-Schema für Namensgenerator
-- =============================================

-- Tabelle für Namen
CREATE TABLE IF NOT EXISTS names (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_name (name),
    INDEX idx_is_used (is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Beispiel-Daten (optional, können entfernt werden)
-- INSERT INTO names (name, is_used) VALUES 
-- ('Anna Schmidt', 0),
-- ('Max Müller', 0),
-- ('Sophie Weber', 0);
