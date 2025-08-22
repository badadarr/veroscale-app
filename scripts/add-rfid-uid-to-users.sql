-- Add rfid_uid column to users if not exists
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS rfid_uid VARCHAR(64);

-- Optional index for quick lookup by UID
CREATE INDEX IF NOT EXISTS idx_users_rfid_uid ON public.users (rfid_uid);
