import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addApprovalColumnsSimple() {
  try {
    console.log('Adding approval columns to weight_records table...');
    
    // Try to add columns one by one and catch errors if they already exist
    try {
      console.log('Adding approved_by column...');
      const { error: error1 } = await supabase
        .from('weight_records')
        .select('approved_by')
        .limit(1);
      
      if (error1 && error1.code === 'PGRST116') { // Column doesn't exist
        console.log('approved_by column does not exist, will need manual addition');
      } else {
        console.log('approved_by column already exists');
      }
    } catch (e) {
      console.log('Error checking approved_by column:', e);
    }

    try {
      console.log('Adding approved_at column...');
      const { error: error2 } = await supabase
        .from('weight_records')
        .select('approved_at')
        .limit(1);
      
      if (error2 && error2.code === 'PGRST116') { // Column doesn't exist
        console.log('approved_at column does not exist, will need manual addition');
      } else {
        console.log('approved_at column already exists');
      }
    } catch (e) {
      console.log('Error checking approved_at column:', e);
    }

    console.log('Please run the following SQL manually in your Supabase SQL editor:');
    console.log(`
-- Add approval tracking columns to weight_records table
ALTER TABLE public.weight_records 
ADD COLUMN IF NOT EXISTS approved_by INTEGER NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL;

-- Add foreign key constraint for approved_by
ALTER TABLE public.weight_records 
ADD CONSTRAINT IF NOT EXISTS fk_weight_records_approved_by 
FOREIGN KEY (approved_by) REFERENCES public.users(id);
    `);

    return true;
  } catch (error) {
    console.error('Error during migration check:', error);
    return false;
  }
}

// Run the migration check
addApprovalColumnsSimple()
  .then((success) => {
    if (success) {
      console.log('Migration check completed');
    } else {
      console.log('Migration check failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Migration check error:', error);
    process.exit(1);
  });
