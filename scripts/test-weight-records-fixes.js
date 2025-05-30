#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Check required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWeightRecordsTable() {
  try {
    console.log('Testing weight_records table schema...');
    
    // 1. Check if sample_id column exists
    const { data: columnInfo, error: columnError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weight_records'
        ORDER BY ordinal_position;
      `
    });
    
    if (columnError) {
      console.error('Error checking columns:', columnError);
      return false;
    }
    
    console.log('Weight records table schema:');
    console.table(columnInfo);
    
    // 2. Check if we have an id alias for record_id
    const hasRecordId = columnInfo.some(col => col.column_name === 'record_id');
    const hasSampleId = columnInfo.some(col => col.column_name === 'sample_id');
    const hasIdAlias = columnInfo.some(col => col.column_name === 'id');
    
    console.log(`Has record_id column: ${hasRecordId ? 'YES' : 'NO'}`);
    console.log(`Has sample_id column: ${hasSampleId ? 'YES' : 'NO'}`);
    console.log(`Has id alias column: ${hasIdAlias ? 'YES' : 'NO'}`);
    
    // 3. Test foreign key constraint
    const { data: fkInfo, error: fkError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT 
          tc.constraint_name, 
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS references_table,
          ccu.column_name AS references_column
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'weight_records' 
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'sample_id';
      `
    });
    
    if (fkError) {
      console.error('Error checking foreign key constraints:', fkError);
    } else {
      console.log('Foreign key constraints for sample_id:');
      console.table(fkInfo);
    }
    
    // 4. Check existing records
    const { data: recordCounts, error: countError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT 
          COUNT(*) AS total_records,
          COUNT(sample_id) AS records_with_sample_id,
          COUNT(*) - COUNT(sample_id) AS records_missing_sample_id
        FROM weight_records;
      `
    });
    
    if (countError) {
      console.error('Error checking record counts:', countError);
    } else {
      console.log('Record status:');
      console.table(recordCounts);
    }
    
    return true;
  } catch (error) {
    console.error('Error during weight_records table test:', error);
    return false;
  }
}

// Run the test
testWeightRecordsTable()
  .then(success => {
    if (success) {
      console.log('Weight records table test completed successfully');
      process.exit(0);
    } else {
      console.error('Failed to test weight records table');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
