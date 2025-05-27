ALTER TABLE public.weight_records
ADD COLUMN approved_by INTEGER,
ADD COLUMN approved_at TIMESTAMPTZ;

-- Optional: Tambahkan foreign key constraint jika kolom user_id di tabel users adalah integer
-- Sesuaikan 'users' dan 'id' jika nama tabel atau kolom berbeda
ALTER TABLE public.weight_records
ADD CONSTRAINT fk_approved_by
FOREIGN KEY (approved_by)
REFERENCES public.users(id);