-- Remove manager role and implement automatic weight variance system
-- This script removes the manager role and updates the weight records system for automatic approval

-- 1. Update users table to remove manager role
UPDATE public.users 
SET role = 'operator' 
WHERE role = 'manager';

-- 2. Add new columns to weight_records for automatic variance checking
ALTER TABLE public.weight_records 
ADD COLUMN IF NOT EXISTS expected_weight DECIMAL(10, 2) NULL,
ADD COLUMN IF NOT EXISTS variance_status VARCHAR(20) DEFAULT 'pending' CHECK (variance_status IN ('auto_approved', 'auto_rejected', 'pending_verification', 'pending')),
ADD COLUMN IF NOT EXISTS verification_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS variance_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS auto_approved_at TIMESTAMP NULL;

-- 3. Update existing columns 
ALTER TABLE public.weight_records 
ALTER COLUMN approved_by TYPE VARCHAR(50),  -- Allow 'system_auto' as approver
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL;

-- 4. Add comments for new columns
COMMENT ON COLUMN public.weight_records.expected_weight IS 'Expected weight from delivery specification';
COMMENT ON COLUMN public.weight_records.variance_status IS 'Automatic variance check result: auto_approved, auto_rejected, pending_verification, pending';
COMMENT ON COLUMN public.weight_records.verification_required IS 'Whether manual verification is required due to variance';
COMMENT ON COLUMN public.weight_records.variance_reason IS 'Reason for automatic approval/rejection decision';
COMMENT ON COLUMN public.weight_records.auto_approved_at IS 'Timestamp when automatically approved';

-- 5. Create or replace function for automatic variance analysis
CREATE OR REPLACE FUNCTION analyze_weight_variance()
RETURNS TRIGGER AS $$
DECLARE
  variance_kg DECIMAL(10, 2);
  variance_percentage DECIMAL(5, 2);
  max_variance_percentage DECIMAL(5, 2) := 5.0; -- 5% max variance
  max_variance_kg DECIMAL(10, 2) := 0.5; -- 0.5kg max absolute variance
  min_sample_weight DECIMAL(10, 2) := 0.1; -- Minimum weight to check (100g)
BEGIN
  -- Only analyze if both IoT weight and expected weight are present
  IF NEW.iot_weight IS NOT NULL AND NEW.expected_weight IS NOT NULL AND NEW.expected_weight > min_sample_weight THEN
    
    -- Calculate variance
    variance_kg := ABS(NEW.iot_weight - NEW.expected_weight);
    variance_percentage := ABS((variance_kg / NEW.expected_weight) * 100);
    
    -- Update weight_variance and weight_variance_percentage for compatibility
    NEW.weight_variance := NEW.iot_weight - NEW.expected_weight;
    NEW.weight_variance_percentage := (NEW.weight_variance / NEW.expected_weight) * 100;
    
    -- Determine status based on thresholds
    IF variance_percentage > max_variance_percentage OR variance_kg > max_variance_kg THEN
      -- Auto-reject if variance exceeds thresholds
      NEW.variance_status := 'auto_rejected';
      NEW.status := 'rejected';
      NEW.verification_required := FALSE;
      NEW.variance_reason := FORMAT('Variance exceeds limits: %.1f%% (max %.1f%%) or %.2fkg (max %.2fkg)', 
                                   variance_percentage, max_variance_percentage, variance_kg, max_variance_kg);
    ELSE
      -- Auto-approve if variance within thresholds
      NEW.variance_status := 'auto_approved';
      NEW.status := 'approved';
      NEW.verification_required := FALSE;
      NEW.approved_by := 'system_auto';
      NEW.approved_at := NOW();
      NEW.auto_approved_at := NOW();
      NEW.variance_reason := FORMAT('Variance within acceptable limits: %.1f%% / %.2fkg', 
                                   variance_percentage, variance_kg);
    END IF;
    
  ELSIF NEW.iot_weight IS NOT NULL AND (NEW.expected_weight IS NULL OR NEW.expected_weight <= min_sample_weight) THEN
    -- Auto-approve if no expected weight for comparison or weight too small
    NEW.variance_status := 'auto_approved';
    NEW.status := 'approved';
    NEW.verification_required := FALSE;
    NEW.approved_by := 'system_auto';
    NEW.approved_at := NOW();
    NEW.auto_approved_at := NOW();
    NEW.variance_reason := 'No expected weight for comparison or sample below minimum threshold';
    
  ELSE
    -- Pending verification if no IoT weight
    NEW.variance_status := 'pending_verification';
    NEW.verification_required := TRUE;
    NEW.variance_reason := 'Missing IoT weight data - manual verification required';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for automatic variance analysis
DROP TRIGGER IF EXISTS trigger_analyze_weight_variance ON public.weight_records;
CREATE TRIGGER trigger_analyze_weight_variance
  BEFORE INSERT OR UPDATE ON public.weight_records
  FOR EACH ROW
  EXECUTE FUNCTION analyze_weight_variance();

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weight_records_variance_status ON public.weight_records(variance_status);
CREATE INDEX IF NOT EXISTS idx_weight_records_auto_approved_at ON public.weight_records(auto_approved_at);
CREATE INDEX IF NOT EXISTS idx_weight_records_verification_required ON public.weight_records(verification_required);

-- 8. Create view for automatic approval statistics
CREATE OR REPLACE VIEW weight_approval_stats AS
SELECT 
  variance_status,
  COUNT(*) as total_records,
  AVG(ABS(weight_variance_percentage)) as avg_variance_percentage,
  AVG(ABS(weight_variance)) as avg_variance_kg,
  COUNT(*) FILTER (WHERE verification_required = TRUE) as requires_verification,
  COUNT(*) FILTER (WHERE approved_by = 'system_auto') as auto_approved_count
FROM public.weight_records 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY variance_status;

-- 9. Update existing records to use new system (optional - for testing)
-- This will only affect records where the trigger wasn't applied
UPDATE public.weight_records 
SET 
  variance_status = CASE 
    WHEN iot_weight IS NOT NULL AND expected_weight IS NOT NULL 
         AND ABS((iot_weight - expected_weight) / expected_weight * 100) <= 5 
    THEN 'auto_approved'
    WHEN iot_weight IS NOT NULL AND expected_weight IS NOT NULL 
         AND ABS((iot_weight - expected_weight) / expected_weight * 100) > 5 
    THEN 'auto_rejected'
    ELSE 'pending_verification'
  END,
  verification_required = CASE 
    WHEN iot_weight IS NOT NULL AND expected_weight IS NOT NULL 
         AND ABS((iot_weight - expected_weight) / expected_weight * 100) <= 5 
    THEN FALSE
    ELSE TRUE
  END,
  approved_by = CASE 
    WHEN iot_weight IS NOT NULL AND expected_weight IS NOT NULL 
         AND ABS((iot_weight - expected_weight) / expected_weight * 100) <= 5 
    THEN 'system_auto'
    ELSE approved_by
  END,
  auto_approved_at = CASE 
    WHEN iot_weight IS NOT NULL AND expected_weight IS NOT NULL 
         AND ABS((iot_weight - expected_weight) / expected_weight * 100) <= 5 
    THEN NOW()
    ELSE auto_approved_at
  END
WHERE variance_status IS NULL OR variance_status = 'pending';

-- Script completed successfully
-- Manager role removed and automatic weight variance system implemented
COMMENT ON TABLE public.weight_records IS 'Weight records with automatic variance checking system. Manager role removed - system now auto-approves/rejects based on IoT vs expected weight variance thresholds.';
