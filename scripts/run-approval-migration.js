#!/usr/bin/env node

/**
 * Simple script to run the approval columns migration
 * Run this script to add approved_by and approved_at columns to weight_records table
 */

const fs = require('fs');
const path = require('path');

// Check if we have the SQL file
const sqlFilePath = path.join(__dirname, 'add-approval-columns.sql');

if (!fs.existsSync(sqlFilePath)) {
    console.error('SQL file not found:', sqlFilePath);
    process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('=== Approval Columns Migration ===');
console.log('');
console.log('This script will add the following columns to weight_records table:');
console.log('- approved_by (INTEGER, NULL, FK to users.id)');
console.log('- approved_at (TIMESTAMP, NULL)');
console.log('');
console.log('SQL to execute:');
console.log('================');
console.log(sqlContent);
console.log('================');
console.log('');
console.log('Please run this SQL in your Supabase dashboard SQL editor or using a PostgreSQL client.');
console.log('');
console.log('After running the SQL, the API endpoints will be able to track approval information.');
console.log('');

// Instructions
console.log('Instructions:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Run the query');
console.log('5. Test the weight records API to ensure approval tracking works');
