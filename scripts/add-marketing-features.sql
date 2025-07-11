-- Add marketing role and related tables
BEGIN;

-- Add marketing role
INSERT INTO public.roles (name) VALUES ('marketing') ON CONFLICT (name) DO NOTHING;

-- Create suppliers table
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

-- Create supplier deliveries table
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

-- Add triggers for updated_at
CREATE TRIGGER set_timestamp_suppliers
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_supplier_deliveries
BEFORE UPDATE ON public.supplier_deliveries
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Insert marketing user
INSERT INTO public.users (name, email, password, role_id)
VALUES ('Marketing User', 'marketing@example.com', '$2a$10$6KxuB6pAQsxS4CffTDcnHOJ8m3SvPPELGYCCdD.ZFQbOGciiK3mwK',
(SELECT id FROM public.roles WHERE name = 'marketing'))
ON CONFLICT (email) DO NOTHING;

-- Insert sample suppliers
INSERT INTO public.suppliers (name, contact_person, email, phone, address, status)
VALUES
  ('PT Steel Indonesia', 'John Doe', 'john@steelindonesia.com', '+62-21-1234567', 'Jl. Industri No. 123, Jakarta', 'active'),
  ('CV Aluminium Jaya', 'Jane Smith', 'jane@aluminiumjaya.com', '+62-21-2345678', 'Jl. Logam No. 456, Bekasi', 'active'),
  ('UD Plastik Mandiri', 'Bob Wilson', 'bob@plastikmandiri.com', '+62-21-3456789', 'Jl. Polymer No. 789, Tangerang', 'active'),
  ('PT Kayu Tropis', 'Alice Brown', 'alice@kayutropis.com', '+62-21-4567890', 'Jl. Hutan No. 321, Bogor', 'active'),
  ('CV Besi Kuat', 'Charlie Davis', 'charlie@besikuat.com', '+62-21-5678901', 'Jl. Baja No. 654, Depok', 'active');

-- Insert sample deliveries
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
   'Iron Pipes 4 inch', 25, 212.5, CURRENT_DATE + INTERVAL '2 days', 'delivered', 'Delivered on time');

COMMIT;