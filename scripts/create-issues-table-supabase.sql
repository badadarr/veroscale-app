-- Create issues table for Supabase/PostgreSQL
-- This script should be run in Supabase SQL Editor

-- Create issues table
CREATE TABLE IF NOT EXISTS public.issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    issue_type VARCHAR(50) NOT NULL DEFAULT 'other' CHECK (issue_type IN ('data_correction', 'system_error', 'feature_request', 'other')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected')),
    reporter_id INTEGER NOT NULL,
    resolution TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_reporter ON public.issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues(created_at);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_issues_updated_at 
    BEFORE UPDATE ON public.issues 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample issues data (adjust reporter_id values based on your users table)
INSERT INTO public.issues (title, description, issue_type, priority, status, reporter_id) VALUES
('Weight Scale Calibration Issue', 'The main weight scale seems to be off by 0.5kg consistently. All readings are higher than expected.', 'system_error', 'high', 'pending', 1),
('Material Name Correction', 'Steel Rod Bundle should be renamed to Steel Rod Set for consistency with inventory.', 'data_correction', 'medium', 'pending', 1),
('Add Export Feature', 'Need ability to export weight records to CSV format for monthly reports.', 'feature_request', 'low', 'in_review', 1),
('Database Connection Timeout', 'Experiencing intermittent database connection timeouts during peak hours.', 'system_error', 'critical', 'resolved', 1),
('Batch Number Validation', 'Batch numbers should follow a specific format but system allows any input.', 'data_correction', 'medium', 'pending', 1);

-- Enable Row Level Security (RLS) for issues table if needed
-- ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (uncomment if you want to enable RLS)
-- CREATE POLICY "Users can view all issues" ON public.issues FOR SELECT USING (true);
-- CREATE POLICY "Users can insert their own issues" ON public.issues FOR INSERT WITH CHECK (auth.uid()::text = reporter_id::text);
-- CREATE POLICY "Users can update their own issues" ON public.issues FOR UPDATE USING (auth.uid()::text = reporter_id::text);
