-- Migrasi Database dari MySQL ke PostgreSQL untuk Supabase
-- Jalankan ini di SQL Editor Supabase

-- Create Tables

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Ref items table
CREATE TABLE IF NOT EXISTS ref_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  weight DECIMAL(10, 2) NOT NULL
);

-- Weight records table
-- Note: PostgreSQL doesn't use ENUM the same way MySQL does
CREATE TABLE IF NOT EXISTS weight_records (
  record_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  total_weight DECIMAL(10, 2) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES ref_items(id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  session_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NULL,
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Samples item table
CREATE TABLE IF NOT EXISTS samples_item (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  item VARCHAR(100) NOT NULL,
  sample_weight DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for updated_at on users table
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_samples_item
BEFORE UPDATE ON samples_item
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Insert default roles
INSERT INTO roles (name) VALUES 
('admin'), 
('manager'), 
('operator')
ON CONFLICT (name) DO NOTHING;

-- Insert sample data if needed
INSERT INTO ref_items (name, weight) 
VALUES
  ('Steel Bar', 5.75),
  ('Aluminum Sheet', 2.3),
  ('Copper Wire', 1.25),
  ('Iron Pipe', 8.5),
  ('Plastic Granules', 0.85)
ON CONFLICT DO NOTHING;

INSERT INTO samples_item (category, item, sample_weight) 
VALUES
  ('Metal', 'Steel', 7.8),
  ('Metal', 'Aluminum', 2.7),
  ('Metal', 'Copper', 8.96),
  ('Plastic', 'PVC', 1.3),
  ('Plastic', 'Polypropylene', 0.9),
  ('Wood', 'Oak', 0.7),
  ('Wood', 'Pine', 0.5),
  ('Rubber', 'Natural Rubber', 0.92),
  ('Glass', 'Soda-lime Glass', 2.5),
  ('Ceramic', 'Porcelain', 2.4)
ON CONFLICT DO NOTHING;
