-- Update precision for expected_weight to 3 decimals to avoid rounding (e.g., 0.225 stays 0.225)
-- Supplier deliveries table (marketing features)
ALTER TABLE public.supplier_deliveries
  ALTER COLUMN expected_weight TYPE DECIMAL(10,3);

-- Samples item expected weight
ALTER TABLE public.samples_item
  ALTER COLUMN expected_weight TYPE DECIMAL(10,3);

-- If weight_records has expected_weight, update it as well (ignore if column doesn't exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'weight_records'
      AND column_name = 'expected_weight'
  ) THEN
    EXECUTE 'ALTER TABLE public.weight_records ALTER COLUMN expected_weight TYPE DECIMAL(10,3)';
  END IF;
END $$;
