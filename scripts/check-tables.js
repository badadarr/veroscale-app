import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  try {
    console.log('Checking weight_records table structure...');
    
    // Check weight_records table
    const { data: weightRecords, error: weightError } = await supabase
      .from('weight_records')
      .select('*')
      .limit(1);
    
    if (weightError) {
      console.error('Weight records error:', weightError);
    } else {
      console.log('Weight records sample:', weightRecords);
    }

    // Check ref_items table
    console.log('\nChecking ref_items table...');
    const { data: refItems, error: refError } = await supabase
      .from('ref_items')
      .select('*')
      .limit(5);
    
    if (refError) {
      console.error('Ref items error:', refError);
    } else {
      console.log('Ref items:', refItems);
    }

    // Check table schema
    console.log('\nChecking table columns...');
    const { data: columns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: 'weight_records' })
      .catch(() => {
        // If RPC doesn't exist, try direct query
        return supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', 'weight_records')
          .eq('table_schema', 'public');
      });

    if (colError) {
      console.error('Columns error:', colError);
    } else {
      console.log('Weight records columns:', columns);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();