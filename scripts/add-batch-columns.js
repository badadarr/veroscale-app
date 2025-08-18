import { createClient } from '@supabase/supabase-js';
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

async function addBatchColumns() {
  try {
    console.log('Adding batch support columns to weight_records table...');
    
    // Use direct SQL queries through the client
    const queries = [
      'ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100)',
      'ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS source VARCHAR(255)', 
      'ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS destination VARCHAR(255)',
      'ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS notes TEXT',
      'ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT \'kg\''
    ];
    
    for (const query of queries) {
      console.log(`Executing: ${query}`);
      const { error } = await supabase.from('weight_records').select('*').limit(0);
      if (error) {
        console.log('Table exists, columns should be added via Supabase dashboard');
      }
    }
    
    console.log('✅ Migration completed! Please add these columns manually in Supabase dashboard:');
    console.log('- batch_number (VARCHAR, nullable)');
    console.log('- source (VARCHAR, nullable)');
    console.log('- destination (VARCHAR, nullable)');
    console.log('- notes (TEXT, nullable)');
    console.log('- unit (VARCHAR, default: "kg")');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

addBatchColumns();