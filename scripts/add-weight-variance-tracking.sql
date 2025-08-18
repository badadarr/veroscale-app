-- Add columns to track IoT weight vs manager weight difference
-- This script adds support for weight variance tracking between IoT and manual input

-- Add new columns to weight_records table
ALTER TABLE public.weight_records 
ADD COLUMN IF NOT EXISTS iot_weight DECIMAL(10, 2) NULL,
ADD COLUMN IF NOT EXISTS manager_weight DECIMAL(10, 2) NULL,
ADD COLUMN IF NOT EXISTS weight_variance DECIMAL(10, 2) NULL,
ADD COLUMN IF NOT EXISTS weight_variance_percentage DECIMAL(5, 2) NULL,
ADD COLUMN IF NOT EXISTS variance_status VARCHAR(20) DEFAULT 'normal' CHECK (variance_status IN ('normal', 'warning', 'critical')),
ADD COLUMN IF NOT EXISTS iot_device_id VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS verification_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT NULL,
ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'kg' NULL;

-- Add index for better performance on variance queries
CREATE INDEX IF NOT EXISTS idx_weight_records_variance_status ON public.weight_records(variance_status);
CREATE INDEX IF NOT EXISTS idx_weight_records_verification_required ON public.weight_records(verification_required);

-- Add comments for documentation
COMMENT ON COLUMN public.weight_records.iot_weight IS 'Weight measured by IoT scale device';
COMMENT ON COLUMN public.weight_records.manager_weight IS 'Weight entered manually by manager';
COMMENT ON COLUMN public.weight_records.weight_variance IS 'Difference between IoT and manager weight (IoT - Manager)';
COMMENT ON COLUMN public.weight_records.weight_variance_percentage IS 'Percentage variance ((IoT - Manager) / Manager * 100)';
COMMENT ON COLUMN public.weight_records.variance_status IS 'Status based on variance threshold: normal (<5%), warning (5-10%), critical (>10%)';
COMMENT ON COLUMN public.weight_records.iot_device_id IS 'ID of the IoT device that measured the weight';
COMMENT ON COLUMN public.weight_records.verification_required IS 'Flag indicating if manual verification is required due to high variance';
COMMENT ON COLUMN public.weight_records.notes IS 'Additional notes or comments for the weight record';
COMMENT ON COLUMN public.weight_records.unit IS 'Unit of measurement for the weight (kg, g, etc.)';

-- Create function to automatically calculate variance when weights are updated
CREATE OR REPLACE FUNCTION calculate_weight_variance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if both weights are present
  IF NEW.iot_weight IS NOT NULL AND NEW.manager_weight IS NOT NULL THEN
    -- Calculate absolute variance
    NEW.weight_variance = NEW.iot_weight - NEW.manager_weight;
    
    -- Calculate percentage variance (avoid division by zero)
    IF NEW.manager_weight != 0 THEN
      NEW.weight_variance_percentage = (NEW.weight_variance / NEW.manager_weight) * 100;
    ELSE
      NEW.weight_variance_percentage = NULL;
    END IF;
    
    -- Determine variance status based on absolute percentage
    IF ABS(NEW.weight_variance_percentage) < 5 THEN
      NEW.variance_status = 'normal';
      NEW.verification_required = FALSE;
    ELSIF ABS(NEW.weight_variance_percentage) BETWEEN 5 AND 10 THEN
      NEW.variance_status = 'warning';
      NEW.verification_required = TRUE;
    ELSE
      NEW.variance_status = 'critical';
      NEW.verification_required = TRUE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate variance
DROP TRIGGER IF EXISTS trigger_calculate_weight_variance ON public.weight_records;
CREATE TRIGGER trigger_calculate_weight_variance
  BEFORE INSERT OR UPDATE ON public.weight_records
  FOR EACH ROW
  EXECUTE FUNCTION calculate_weight_variance();

-- Sample data update for testing (optional - remove in production)
-- UPDATE public.weight_records 
-- SET iot_weight = total_weight + (random() - 0.5) * 2
-- WHERE iot_weight IS NULL AND total_weight IS NOT NULL;

-- Script completed successfully
-- Weight variance tracking columns and triggers have been added to weight_records table
