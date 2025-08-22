-- Ensure weight-related columns have 3-decimal precision
ALTER TABLE public.weight_records
  ALTER COLUMN total_weight TYPE DECIMAL(10,3);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='weight_records' AND column_name='iot_weight'
  ) THEN
    EXECUTE 'ALTER TABLE public.weight_records ALTER COLUMN iot_weight TYPE DECIMAL(10,3)';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='weight_records' AND column_name='manager_weight'
  ) THEN
    EXECUTE 'ALTER TABLE public.weight_records ALTER COLUMN manager_weight TYPE DECIMAL(10,3)';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='weight_records' AND column_name='weight_variance'
  ) THEN
    EXECUTE 'ALTER TABLE public.weight_records ALTER COLUMN weight_variance TYPE DECIMAL(10,3)';
  END IF;
END $$;
