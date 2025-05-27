-- Add department and status fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' NOT NULL;

-- Ensure status is limited to allowed values
ALTER TABLE public.users
ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive'));

-- Update existing users to have active status
UPDATE public.users SET status = 'active' WHERE status IS NULL;
