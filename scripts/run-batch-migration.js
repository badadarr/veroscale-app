import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runBatchMigration() {
  try {
    console.log('Running batch support migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-batch-support.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error running migration:', error);
      return;
    }
    
    console.log('Batch support migration completed successfully!');
    console.log('Added columns: batch_number, source, destination, notes, unit');
    console.log('Added indexes for better performance');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Alternative method using direct SQL execution
async function runBatchMigrationDirect() {
  try {
    console.log('Running batch support migration (direct method)...');
    
    // Add columns one by one
    const migrations = [
      'ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100)',
      'ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS source VARCHAR(255)',
      'ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS destination VARCHAR(255)',
      'ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS notes TEXT',
      'ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT \'kg\'',
      'CREATE INDEX IF NOT EXISTS idx_weight_records_batch_number ON public.weight_records(batch_number)',
      'CREATE INDEX IF NOT EXISTS idx_weight_records_timestamp ON public.weight_records(timestamp)'
    ];
    
    for (const migration of migrations) {
      console.log(`Executing: ${migration}`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: migration });
      
      if (error) {
        console.error(`Error executing migration: ${migration}`, error);
      } else {
        console.log('✓ Success');
      }
    }
    
    console.log('Batch support migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
if (process.argv.includes('--direct')) {
  runBatchMigrationDirect();
} else {
  runBatchMigration();
}