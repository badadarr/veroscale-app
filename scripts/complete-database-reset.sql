-- Complete Database Reset and Recreation with Fixed Weight Records Structure
-- Execute this script in Supabase SQL Editor

BEGIN;

-- Drop all existing tables (in correct order to handle foreign key constraints)
DROP TABLE IF EXISTS public.weight_records CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.issues CASCADE;
DROP TABLE IF EXISTS public.samples_item CASCADE;
DROP TABLE IF EXISTS public.ref_items CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS public.trigger_set_timestamp() CASCADE;

-- Create Tables with Fixed Structure

-- Roles table
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Users table
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES public.roles(id)
);

-- Ref items table (kept for backward compatibility)
CREATE TABLE public.ref_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    weight DECIMAL(10, 2) NOT NULL
);

-- Samples item table (main table for weight records)
CREATE TABLE public.samples_item (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    item VARCHAR(100) NOT NULL,
    sample_weight DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, item)
);

-- Weight records table with FIXED structure
CREATE TABLE public.weight_records (
    record_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_id INTEGER NULL, -- Made nullable for legacy support
    sample_id INTEGER NULL, -- New column for samples-based system
    total_weight DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER NULL,
    approved_at TIMESTAMP NULL,
    source VARCHAR(255) NULL, -- Added source field
    destination VARCHAR(255) NULL, -- Added destination field
    notes TEXT NULL, -- Added notes field
    unit VARCHAR(10) DEFAULT 'kg', -- Added unit field
    FOREIGN KEY (user_id) REFERENCES public.users(id),
    FOREIGN KEY (item_id) REFERENCES public.ref_items(id),
    FOREIGN KEY (sample_id) REFERENCES public.samples_item(id),
    FOREIGN KEY (approved_by) REFERENCES public.users(id)
);

-- Sessions table
CREATE TABLE public.sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Issues table for reporting problems
CREATE TABLE public.issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    reporter_id INTEGER NOT NULL,
    assigned_to INTEGER NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (reporter_id) REFERENCES public.users(id),
    FOREIGN KEY (assigned_to) REFERENCES public.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_weight_records_user_id ON public.weight_records(user_id);
CREATE INDEX idx_weight_records_sample_id ON public.weight_records(sample_id);
CREATE INDEX idx_weight_records_status ON public.weight_records(status);
CREATE INDEX idx_weight_records_timestamp ON public.weight_records(timestamp);
CREATE INDEX idx_issues_status ON public.issues(status);
CREATE INDEX idx_issues_reporter_id ON public.issues(reporter_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_samples_item
    BEFORE UPDATE ON public.samples_item
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_issues
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Insert Data

-- Insert default roles
INSERT INTO public.roles (name) VALUES 
    ('admin'), 
    ('manager'), 
    ('operator');

-- Insert sample users with hashed password (password123)
INSERT INTO public.users (name, email, password, role_id)
VALUES 
    ('Admin User', 'admin@example.com', '$2a$10$6KxuB6pAQsxS4CffTDcnHOJ8m3SvPPELGYCCdD.ZFQbOGciiK3mwK', 
     (SELECT id FROM public.roles WHERE name = 'admin')),
    ('Test Manager', 'manager@example.com', '$2a$10$6KxuB6pAQsxS4CffTDcnHOJ8m3SvPPELGYCCdD.ZFQbOGciiK3mwK',
     (SELECT id FROM public.roles WHERE name = 'manager')),
    ('Test Operator', 'operator@example.com', '$2a$10$6KxuB6pAQsxS4CffTDcnHOJ8m3SvPPELGYCCdD.ZFQbOGciiK3mwK',
     (SELECT id FROM public.roles WHERE name = 'operator'));

-- Insert reference items (for backward compatibility)
INSERT INTO public.ref_items (name, weight) 
VALUES
    ('Steel Bar', 5.75),
    ('Aluminum Sheet', 2.3),
    ('Copper Wire', 1.25),
    ('Iron Pipe', 8.5),
    ('Plastic Granules', 0.85),
    ('Metal Sheet', 12.5),
    ('Stone Aggregate', 25.0),
    ('Cement Bag', 50.0),
    ('Wood Plank', 7.2),
    ('Steel Rod Bundle', 35.5),
    ('Concrete Block', 22.7),
    ('Gravel Container', 18.3),
    ('Sand Bag', 30.0);

-- Insert samples (main data for weight records)
INSERT INTO public.samples_item (category, item, sample_weight) 
VALUES
    ('Metal', 'Steel', 7.8),
    ('Metal', 'Aluminum', 2.7),
    ('Metal', 'Copper', 8.96),
    ('Metal', 'Iron', 7.87),
    ('Metal', 'Zinc', 7.13),
    ('Metal', 'Lead', 11.34),
    ('Plastic', 'PVC', 1.3),
    ('Plastic', 'Polypropylene', 0.9),
    ('Plastic', 'HDPE', 0.95),
    ('Plastic', 'ABS', 1.07),
    ('Wood', 'Oak', 0.7),
    ('Wood', 'Pine', 0.5),
    ('Wood', 'Mahogany', 0.85),
    ('Rubber', 'Natural Rubber', 0.92),
    ('Glass', 'Soda-lime Glass', 2.5),
    ('Glass', 'Borosilicate', 2.23),
    ('Ceramic', 'Porcelain', 2.4),
    ('Ceramic', 'Stoneware', 2.3),
    ('Composite', 'Carbon Fiber', 1.55);

-- Insert sample weight records using the new sample-based system
WITH user_ids AS (
    SELECT id FROM public.users
),
sample_ids AS (
    SELECT id FROM public.samples_item
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
),
sources AS (
    SELECT unnest(ARRAY['Warehouse A', 'Warehouse B', 'Production Line 1', 'Production Line 2', 'Storage Room', 'Lab']) AS source
),
destinations AS (
    SELECT unnest(ARRAY['Quality Control', 'Shipping', 'Processing Unit', 'Storage', 'Disposal', 'Archive']) AS destination
)
INSERT INTO public.weight_records (user_id, sample_id, total_weight, timestamp, status, source, destination, notes, unit)
SELECT
    user_ids.id,
    sample_ids.id,
    (RANDOM() * 100 + 1)::DECIMAL(10,2), -- Random weight between 1 and 101
    record_date + (RANDOM() * INTERVAL '24 hours'), -- Random time during the day
    statuses.status,
    sources.source,
    destinations.destination,
    CASE 
        WHEN RANDOM() > 0.7 THEN 'Sample processing completed'
        WHEN RANDOM() > 0.5 THEN 'Quality check required'
        ELSE NULL
    END,
    'kg'
FROM
    user_ids
CROSS JOIN
    sample_ids
CROSS JOIN
    date_series
CROSS JOIN
    statuses
CROSS JOIN
    sources
CROSS JOIN
    destinations
WHERE RANDOM() < 0.1 -- Only insert 10% to avoid too much data
ORDER BY RANDOM()
LIMIT 200; -- Limit to 200 records

-- Insert sample issues
INSERT INTO public.issues (title, description, status, priority, reporter_id)
SELECT
    title,
    description,
    status,
    priority,
    (SELECT id FROM public.users WHERE role_id = (SELECT id FROM public.roles WHERE name = 'operator') LIMIT 1)
FROM (
    VALUES
        ('Weight Scale Calibration Issue', 'The main weight scale in Warehouse A is showing inconsistent readings', 'pending', 'high'),
        ('Sample Contamination', 'Some metal samples appear to be contaminated with foreign materials', 'in_progress', 'medium'),
        ('Documentation Missing', 'Weight record documentation for batch #1234 is incomplete', 'resolved', 'low'),
        ('Equipment Malfunction', 'Conveyor belt in Production Line 2 is not working properly', 'pending', 'urgent'),
        ('Data Entry Error', 'Multiple weight records have incorrect timestamp values', 'closed', 'medium')
) AS issues_data(title, description, status, priority);

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

COMMIT;

-- Verification queries to check the setup
SELECT 'Roles' as table_name, COUNT(*) as count FROM public.roles
UNION ALL
SELECT 'Users', COUNT(*) FROM public.users
UNION ALL
SELECT 'Ref Items', COUNT(*) FROM public.ref_items
UNION ALL
SELECT 'Samples', COUNT(*) FROM public.samples_item
UNION ALL
SELECT 'Weight Records', COUNT(*) FROM public.weight_records
UNION ALL
SELECT 'Issues', COUNT(*) FROM public.issues
UNION ALL
SELECT 'Sessions', COUNT(*) FROM public.sessions;

-- Show sample weight records with sample names
SELECT 
    wr.record_id,
    u.name as user_name,
    si.category || ' - ' || si.item as sample_name,
    wr.total_weight,
    wr.status,
    wr.source,
    wr.destination,
    wr.timestamp
FROM public.weight_records wr
JOIN public.users u ON wr.user_id = u.id
JOIN public.samples_item si ON wr.sample_id = si.id
ORDER BY wr.timestamp DESC
LIMIT 10;
