import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for migrations

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and service role key are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Starting database migrations...');    // Array of SQL files to execute in order
    const migrationFiles = [
      'alter-users-table.sql',
      'create-report-tables.sql',
      'fix-weight-records-comprehensive.sql' // Added comprehensive fix
    ];

    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}`);
      const filePath = path.join(process.cwd(), 'scripts', file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Split SQL file into separate statements
      const statements = sql
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);

      for (const statement of statements) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`Error executing SQL from ${file}:`, error);
          throw error;
        }
      }

      console.log(`Migration ${file} completed successfully.`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
