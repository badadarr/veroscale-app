  -- Mulai dengan transaction untuk memastikan semua operasi berhasil atau tidak sama sekali
  BEGIN;

  -- Pertama, buat schema jika belum ada
  CREATE SCHEMA IF NOT EXISTS weightmanagementdb;

  -- Create Tables dalam schema weightmanagementdb

  -- Roles table
  CREATE TABLE IF NOT EXISTS weightmanagementdb.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
  );

  -- Users table
  CREATE TABLE IF NOT EXISTS weightmanagementdb.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES weightmanagementdb.roles(id)
  );

  -- Ref items table (tambahkan UNIQUE constraint untuk name)
  CREATE TABLE IF NOT EXISTS weightmanagementdb.ref_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    weight DECIMAL(10, 2) NOT NULL
  );

  -- Weight records table
  CREATE TABLE IF NOT EXISTS weightmanagementdb.weight_records (
    record_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    total_weight DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    FOREIGN KEY (user_id) REFERENCES weightmanagementdb.users(id),
    FOREIGN KEY (item_id) REFERENCES weightmanagementdb.ref_items(id)
  );

  -- Sessions table
  CREATE TABLE IF NOT EXISTS weightmanagementdb.sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    FOREIGN KEY (user_id) REFERENCES weightmanagementdb.users(id)
  );

  -- Samples item table (tambahkan UNIQUE constraint untuk category+item)
  CREATE TABLE IF NOT EXISTS weightmanagementdb.samples_item (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    item VARCHAR(100) NOT NULL,
    sample_weight DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, item)
  );

  -- Add trigger for updated_at on users table
  CREATE OR REPLACE FUNCTION weightmanagementdb.trigger_set_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Drop and recreate triggers to avoid errors
  DO $$
  BEGIN
      -- Drop the triggers if they exist
      IF EXISTS (
          SELECT 1 FROM pg_trigger t 
          JOIN pg_class c ON t.tgrelid = c.oid 
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE t.tgname = 'set_timestamp_users' 
          AND c.relname = 'users'
          AND n.nspname = 'weightmanagementdb'
      ) THEN
          DROP TRIGGER set_timestamp_users ON weightmanagementdb.users;
      END IF;
      
      IF EXISTS (
          SELECT 1 FROM pg_trigger t 
          JOIN pg_class c ON t.tgrelid = c.oid 
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE t.tgname = 'set_timestamp_samples_item' 
          AND c.relname = 'samples_item'
          AND n.nspname = 'weightmanagementdb'
      ) THEN
          DROP TRIGGER set_timestamp_samples_item ON weightmanagementdb.samples_item;
      END IF;
  END
  $$;

  -- Create the triggers
  CREATE TRIGGER set_timestamp_users
  BEFORE UPDATE ON weightmanagementdb.users
  FOR EACH ROW
  EXECUTE PROCEDURE weightmanagementdb.trigger_set_timestamp();

  CREATE TRIGGER set_timestamp_samples_item
  BEFORE UPDATE ON weightmanagementdb.samples_item
  FOR EACH ROW
  EXECUTE PROCEDURE weightmanagementdb.trigger_set_timestamp();

  -- Insert default roles
  INSERT INTO weightmanagementdb.roles (name) VALUES 
  ('admin'), 
  ('manager'), 
  ('operator')
  ON CONFLICT (name) DO NOTHING;

  -- Insert sample data if needed
  INSERT INTO weightmanagementdb.ref_items (name, weight) 
  VALUES
    ('Steel Bar', 5.75),
    ('Aluminum Sheet', 2.3),
    ('Copper Wire', 1.25),
    ('Iron Pipe', 8.5),
    ('Plastic Granules', 0.85)
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO weightmanagementdb.samples_item (category, item, sample_weight) 
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
  ON CONFLICT (category, item) DO NOTHING;

  -- Insert admin user with hashed password (hashed 'password123')
  INSERT INTO weightmanagementdb.users (name, email, password, role_id)
  VALUES 
    ('Admin User', 'admin@example.com', '$2a$10$6KxuB6pAQsxS4CffTDcnHOJ8m3SvPPELGYCCdD.ZFQbOGciiK3mwK', 
    (SELECT id FROM weightmanagementdb.roles WHERE name = 'admin')),
    ('Test Manager', 'manager@example.com', '$2a$10$6KxuB6pAQsxS4CffTDcnHOJ8m3SvPPELGYCCdD.ZFQbOGciiK3mwK',
    (SELECT id FROM weightmanagementdb.roles WHERE name = 'manager')),
    ('Test Operator', 'operator@example.com', '$2a$10$6KxuB6pAQsxS4CffTDcnHOJ8m3SvPPELGYCCdD.ZFQbOGciiK3mwK',
    (SELECT id FROM weightmanagementdb.roles WHERE name = 'operator'))
  ON CONFLICT (email) DO NOTHING;

  -- Insert additional reference items
  INSERT INTO weightmanagementdb.ref_items (name, weight)
  VALUES
    ('Metal Sheet', 12.5),
    ('Stone Aggregate', 25.0),
    ('Cement Bag', 50.0),
    ('Wood Plank', 7.2),
    ('Steel Rod Bundle', 35.5),
    ('Concrete Block', 22.7),
    ('Gravel Container', 18.3),
    ('Sand Bag', 30.0)
  ON CONFLICT (name) DO NOTHING;

  -- Insert additional sample items
  INSERT INTO weightmanagementdb.samples_item (category, item, sample_weight)
  VALUES
    ('Metal', 'Iron', 7.87),
    ('Metal', 'Zinc', 7.13),
    ('Metal', 'Lead', 11.34),
    ('Plastic', 'HDPE', 0.95),
    ('Plastic', 'ABS', 1.07),
    ('Wood', 'Mahogany', 0.85),
    ('Composite', 'Carbon Fiber', 1.55),
    ('Ceramic', 'Stoneware', 2.3),
    ('Glass', 'Borosilicate', 2.23)
  ON CONFLICT (category, item) DO NOTHING;

  -- Insert weight records for the past month with different statuses
  WITH user_ids AS (
    SELECT id FROM weightmanagementdb.users
  ),
  item_ids AS (
    SELECT id FROM weightmanagementdb.ref_items
  ),
  date_series AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE,
      '1 day'::interval
    ) AS record_date
  ),
  statuses AS (
    SELECT unnest(ARRAY['pending', 'approved', 'rejected']) AS status
  )
  INSERT INTO weightmanagementdb.weight_records (user_id, item_id, total_weight, timestamp, status)
  SELECT
    user_ids.id,
    item_ids.id,
    (RANDOM() * 100 + 1)::DECIMAL(10,2), -- Random weight between 1 and 101
    record_date + (RANDOM() * INTERVAL '24 hours'), -- Random time during the day
    statuses.status
  FROM
    user_ids
  CROSS JOIN
    item_ids
  CROSS JOIN
    date_series
  CROSS JOIN
    statuses
  ORDER BY RANDOM()
  LIMIT 300; -- Adjust this number for more or fewer records

  -- Insert active sessions for users
  INSERT INTO weightmanagementdb.sessions (user_id, start_time, status)
  SELECT 
    id, 
    NOW() - (RANDOM() * INTERVAL '10 hours'), 
    'active'
  FROM 
    weightmanagementdb.users;

  -- Insert some completed sessions
  INSERT INTO weightmanagementdb.sessions (user_id, start_time, end_time, status)
  SELECT 
    id, 
    NOW() - (RANDOM() * INTERVAL '30 days'), 
    NOW() - (RANDOM() * INTERVAL '29 days'),
    'inactive'
  FROM 
    weightmanagementdb.users
  CROSS JOIN 
    generate_series(1, 5) -- 5 past sessions per user
  ORDER BY 
    RANDOM();

  -- Commit all changes
  COMMIT;