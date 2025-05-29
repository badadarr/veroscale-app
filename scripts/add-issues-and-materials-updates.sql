-- Add price_per_kg column to materials table (ref_items)
ALTER TABLE ref_items ADD COLUMN price_per_kg DECIMAL(10,2) DEFAULT 0.00;

-- Update existing materials with sample pricing
UPDATE ref_items SET price_per_kg = 12.50 WHERE name = 'Metal Sheet';
UPDATE ref_items SET price_per_kg = 18.75 WHERE name = 'Steel Rod Bundle';
UPDATE ref_items SET price_per_kg = 8.25 WHERE name = 'Concrete Block';
UPDATE ref_items SET price_per_kg = 5.50 WHERE name = 'Gravel Container';
UPDATE ref_items SET price_per_kg = 3.75 WHERE name = 'Sand Bag';

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    issue_type ENUM('data_correction', 'system_error', 'feature_request', 'other') NOT NULL DEFAULT 'other',
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    status ENUM('pending', 'in_review', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
    reporter_id INT NOT NULL,
    resolution TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_reporter (reporter_id),
    INDEX idx_created_at (created_at)
);

-- Insert sample issues data
INSERT INTO issues (title, description, issue_type, priority, status, reporter_id) VALUES
('Weight Scale Calibration Issue', 'The main weight scale seems to be off by 0.5kg consistently. All readings are higher than expected.', 'system_error', 'high', 'pending', 1),
('Material Name Correction', 'Steel Rod Bundle should be renamed to Steel Rod Set for consistency with inventory.', 'data_correction', 'medium', 'pending', 2),
('Add Export Feature', 'Need ability to export weight records to CSV format for monthly reports.', 'feature_request', 'low', 'in_review', 1),
('Database Connection Timeout', 'Experiencing intermittent database connection timeouts during peak hours.', 'system_error', 'critical', 'resolved', 3),
('Batch Number Validation', 'Batch numbers should follow a specific format but system allows any input.', 'data_correction', 'medium', 'pending', 2);

-- Add notes column to weight_records if it doesn't exist
ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS notes TEXT;
