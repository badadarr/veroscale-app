#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Check required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixWeightRecordsTable() {
  try {
    console.log('Applying fixes to weight_records table...');
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'fix-weight-records-table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL using Supabase exec_sql RPC function
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying SQL fixes:', error);
      return false;
    }
    
    console.log('Successfully applied fixes to weight_records table');
    
    // For compatibility, update any existing weight records to use sample_id
    console.log('Updating existing records to use sample_id from samples_item...');
    
    // This transfers item_id values to sample_id for existing records
    // based on matching materials and samples by name
    const updateSql = `
      WITH sample_matches AS (
        SELECT 
          wr.record_id,
          si.id AS sample_id
        FROM 
          weight_records wr
          JOIN ref_items ri ON wr.item_id = ri.id
          JOIN samples_item si ON LOWER(ri.name) LIKE LOWER('%' || si.item || '%')
        WHERE 
          wr.sample_id IS NULL
      )
      UPDATE weight_records wr
      SET sample_id = sm.sample_id
      FROM sample_matches sm
      WHERE wr.record_id = sm.record_id
    `;
    
    const { error: updateError } = await supabase.rpc('exec_sql', { sql: updateSql });
    
    if (updateError) {
      console.error('Error updating existing records:', updateError);
    } else {
      console.log('Successfully updated existing records');
    }
    
    return true;
  } catch (error) {
    console.error('Error during weight_records table fix:', error);
    return false;
  }
}

// Run the fixes
fixWeightRecordsTable()
  .then(success => {
    if (success) {
      console.log('Weight records table fixes completed successfully');
      process.exit(0);
    } else {
      console.error('Failed to apply weight records table fixes');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
