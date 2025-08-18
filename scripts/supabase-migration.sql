  -- Mulai dengan transaction untuk memastikan semua operasi berhasil atau tidak sama sekali
  BEGIN;

  -- Pertama, buat schema jika belum ada
  CREATE SCHEMA IF NOT EXISTS public;

  -- Create Tables dalam schema public

  -- Roles table
  CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
  );

  -- Users table
  CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES public.roles(id)
  );

  -- Ref items table (tambahkan UNIQUE constraint untuk name)
  CREATE TABLE IF NOT EXISTS public.ref_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    weight DECIMAL(10, 2) NOT NULL
  );

  -- Weight records table  CREATE TABLE IF NOT EXISTS public.weight_records (
    record_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    total_weight DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER NULL,
    approved_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES public.users(id),
    FOREIGN KEY (item_id) REFERENCES public.ref_items(id),
    FOREIGN KEY (approved_by) REFERENCES public.users(id)
  );

  -- Sessions table
  CREATE TABLE IF NOT EXISTS public.sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
  );

  -- Samples item table (tambahkan UNIQUE constraint untuk category+item)
  CREATE TABLE IF NOT EXISTS public.samples_item (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    item VARCHAR(100) NOT NULL,
    sample_weight DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, item)
  );

  -- Add trigger for updated_at on users table
  CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
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
          AND n.nspname = 'public'
      ) THEN
          DROP TRIGGER set_timestamp_users ON public.users;
      END IF;
      
      IF EXISTS (
          SELECT 1 FROM pg_trigger t 
          JOIN pg_class c ON t.tgrelid = c.oid 
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE t.tgname = 'set_timestamp_samples_item' 
          AND c.relname = 'samples_item'
          AND n.nspname = 'public'
      ) THEN
          DROP TRIGGER set_timestamp_samples_item ON public.samples_item;
      END IF;
      
      IF EXISTS (
          SELECT 1 FROM pg_trigger t 
          JOIN pg_class c ON t.tgrelid = c.oid 
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE t.tgname = 'set_timestamp_suppliers' 
          AND c.relname = 'suppliers'
          AND n.nspname = 'public'
      ) THEN
          DROP TRIGGER set_timestamp_suppliers ON public.suppliers;
      END IF;
      
      IF EXISTS (
          SELECT 1 FROM pg_trigger t 
          JOIN pg_class c ON t.tgrelid = c.oid 
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE t.tgname = 'set_timestamp_supplier_deliveries' 
          AND c.relname = 'supplier_deliveries'
          AND n.nspname = 'public'
      ) THEN
          DROP TRIGGER set_timestamp_supplier_deliveries ON public.supplier_deliveries;
      END IF;
  END
  $$;

  -- Create the triggers
  CREATE TRIGGER set_timestamp_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_set_timestamp();

  CREATE TRIGGER set_timestamp_samples_item
  BEFORE UPDATE ON public.samples_item
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_set_timestamp();

  CREATE TRIGGER set_timestamp_suppliers
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_set_timestamp();

  CREATE TRIGGER set_timestamp_supplier_deliveries
  BEFORE UPDATE ON public.supplier_deliveries
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_set_timestamp();

  -- Insert default roles
  INSERT INTO public.roles (name) VALUES 
  ('admin'), 
  ('manager'), 
  ('operator'),
  ('marketing')
  ON CONFLICT (name) DO NOTHING;

  -- Suppliers table
  CREATE TABLE IF NOT EXISTS public.suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Supplier deliveries table
  CREATE TABLE IF NOT EXISTS public.supplier_deliveries (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL,
    marketing_user_id INTEGER NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    expected_quantity DECIMAL(10, 2) NOT NULL,
    expected_weight DECIMAL(10, 2),
    scheduled_date DATE NOT NULL,
    delivery_status VARCHAR(20) DEFAULT 'scheduled' CHECK (delivery_status IN ('scheduled', 'in_transit', 'delivered', 'delayed', 'cancelled')),
    actual_delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
    FOREIGN KEY (marketing_user_id) REFERENCES public.users(id)
  );

  -- Insert sample data if needed
  INSERT INTO public.ref_items (name, weight) 
  VALUES
    ('Steel Bar', 5.75),
    ('Aluminum Sheet', 2.3),
    ('Copper Wire', 1.25),
    ('Iron Pipe', 8.5),
    ('Plastic Granules', 0.85)
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO public.samples_item (category, item, sample_weight) 
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
  INSERT INTO public.users (name, email, password, role_id)
  VALUES 
    ('Admin User', 'admin@example.com', '$2a$10$6KxuB6pAQsxS4CffTDcnHOJ8m3SvPPELGYCCdD.ZFQbOGciiK3mwK', 
    (SELECT id FROM public.roles WHERE name = 'admin')),
    ('Test Manager', 'manager@example.com', '$2a$10$6KxuB6pAQsxS4CffTDcnHOJ8m3SvPPELGYCCdD.ZFQbOGciiK3mwK',
    (SELECT id FROM public.roles WHERE name = 'manager')),
    ('Test Operator', 'operator@example.com', '$2a$10$6KxuB6pAQsxS4CffTDcnHOJ8m3SvPPELGYCCdD.ZFQbOGciiK3mwK',
    (SELECT id FROM public.roles WHERE name = 'operator')),
    ('Marketing User', 'marketing@example.com', '$2a$10$6KxuB6pAQsxS4CffTDcnHOJ8m3SvPPELGYCCdD.ZFQbOGciiK3mwK',
    (SELECT id FROM public.roles WHERE name = 'marketing'))
  ON CONFLICT (email) DO NOTHING;

  -- Insert sample suppliers
  INSERT INTO public.suppliers (name, contact_person, email, phone, address, status)
  VALUES
    ('PT Steel Indonesia', 'John Doe', 'john@steelindonesia.com', '+62-21-1234567', 'Jl. Industri No. 123, Jakarta', 'active'),
    ('CV Aluminium Jaya', 'Jane Smith', 'jane@aluminiumjaya.com', '+62-21-2345678', 'Jl. Logam No. 456, Bekasi', 'active'),
    ('UD Plastik Mandiri', 'Bob Wilson', 'bob@plastikmandiri.com', '+62-21-3456789', 'Jl. Polymer No. 789, Tangerang', 'active'),
    ('PT Kayu Tropis', 'Alice Brown', 'alice@kayutropis.com', '+62-21-4567890', 'Jl. Hutan No. 321, Bogor', 'active'),
    ('CV Besi Kuat', 'Charlie Davis', 'charlie@besikuat.com', '+62-21-5678901', 'Jl. Baja No. 654, Depok', 'active')
  ON CONFLICT DO NOTHING;

  -- Insert sample supplier deliveries
  INSERT INTO public.supplier_deliveries (supplier_id, marketing_user_id, item_name, expected_quantity, expected_weight, scheduled_date, delivery_status, notes)
  VALUES
    ((SELECT id FROM public.suppliers WHERE name = 'PT Steel Indonesia'), 
     (SELECT id FROM public.users WHERE email = 'marketing@example.com'),
     'Steel Bars Grade A', 100, 575.0, CURRENT_DATE + INTERVAL '3 days', 'scheduled', 'High priority delivery'),
    ((SELECT id FROM public.suppliers WHERE name = 'CV Aluminium Jaya'),
     (SELECT id FROM public.users WHERE email = 'marketing@example.com'),
     'Aluminum Sheets 2mm', 50, 115.0, CURRENT_DATE + INTERVAL '5 days', 'scheduled', 'Standard delivery'),
    ((SELECT id FROM public.suppliers WHERE name = 'UD Plastik Mandiri'),
     (SELECT id FROM public.users WHERE email = 'marketing@example.com'),
     'Plastic Granules HDPE', 200, 170.0, CURRENT_DATE + INTERVAL '7 days', 'in_transit', 'Already shipped'),
    ((SELECT id FROM public.suppliers WHERE name = 'PT Kayu Tropis'),
     (SELECT id FROM public.users WHERE email = 'marketing@example.com'),
     'Oak Wood Planks', 30, 21.0, CURRENT_DATE + INTERVAL '10 days', 'scheduled', 'Quality check required'),
    ((SELECT id FROM public.suppliers WHERE name = 'CV Besi Kuat'),
     (SELECT id FROM public.users WHERE email = 'marketing@example.com'),
     'Iron Pipes 4 inch', 25, 212.5, CURRENT_DATE + INTERVAL '2 days', 'delivered', 'Delivered on time')
  ON CONFLICT DO NOTHING;

  -- Insert additional reference items
  INSERT INTO public.ref_items (name, weight)
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
  INSERT INTO public.samples_item (category, item, sample_weight)
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
    SELECT id FROM public.users
  ),
  item_ids AS (
    SELECT id FROM public.ref_items
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
  INSERT INTO public.weight_records (user_id, item_id, total_weight, timestamp, status)
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
  INSERT INTO public.sessions (user_id, start_time, status)
  SELECT 
    id, 
    NOW() - (RANDOM() * INTERVAL '10 hours'), 
    'active'
  FROM 
    public.users;

  -- Insert some completed sessions
  INSERT INTO public.sessions (user_id, start_time, end_time, status)
  SELECT 
    id, 
    NOW() - (RANDOM() * INTERVAL '30 days'), 
    NOW() - (RANDOM() * INTERVAL '29 days'),
    'inactive'
  FROM 
    public.users
  CROSS JOIN 
    generate_series(1, 5) -- 5 past sessions per user
  ORDER BY 
    RANDOM();

  -- Commit all changes
  COMMIT;
