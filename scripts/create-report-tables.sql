-- Create report_configurations table
CREATE TABLE IF NOT EXISTS public.report_configurations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'quarterly', 'custom')),
  fields JSONB NOT NULL,
  schedule JSONB,
  recipients JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES public.users(id)
);

-- Create system_settings table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_configurations_type ON public.report_configurations(type);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
