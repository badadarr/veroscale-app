# Database Migration Scripts

This directory contains SQL scripts for database migrations.

## Adding Status Column to Samples Table

To add the status column to the samples_item table and set existing records to 'shipped' status, run the following command:

```bash
# For Supabase
psql -h <your-supabase-host> -p 5432 -d postgres -U postgres -f add-status-to-samples.sql

# For local PostgreSQL
psql -U <your-username> -d <your-database> -f add-status-to-samples.sql
```

Or you can run the SQL commands directly in the Supabase SQL Editor:

```sql
-- Add status column to samples_item table
ALTER TABLE public.samples_item ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Update existing records to have 'shipped' status
UPDATE public.samples_item SET status = 'shipped' WHERE status IS NULL OR status = 'pending';

-- Create index on status column for faster queries
CREATE INDEX IF NOT EXISTS idx_samples_item_status ON public.samples_item(status);
```

## Important Notes

- The status column is used to filter samples that are available for weight calculation
- Only samples with 'shipped' status will be shown in the BatchWeightCalculator component
- New samples are created with 'pending' status by default
- You need to update the status to 'shipped' for samples to appear in the calculator