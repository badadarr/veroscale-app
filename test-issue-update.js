#!/usr/bin/env node

/**
 * Test script to reproduce the issue status constraint violation error
 * This script simulates the exact API update operation that's failing
 */

const { executeQuery } = require('./lib/db-adapter.ts');

async function testIssueUpdate() {
  console.log('=== Testing Issue Status Update to "rejected" ===');
  console.log('');

  try {
    // First, get an existing issue to update
    console.log('1. Fetching existing issues...');
    const issues = await executeQuery({
      table: 'issues',
      action: 'select',
      columns: 'id, title, status, reporter_id',
      filters: {},
    });

    console.log('Found issues:', JSON.stringify(issues, null, 2));

    if (!issues || issues.length === 0) {
      console.log('No issues found in database. Creating a test issue first...');
      
      // Create a test issue
      const newIssue = await executeQuery({
        table: 'issues',
        action: 'insert',
        data: {
          title: 'Test Issue for Status Update',
          description: 'This is a test issue to test status updates',
          issue_type: 'other',
          priority: 'medium',
          status: 'pending',
          reporter_id: 1, // Assuming user ID 1 exists
        },
        returning: '*',
      });

      console.log('Created test issue:', JSON.stringify(newIssue, null, 2));
      
      if (Array.isArray(newIssue) && newIssue.length > 0) {
        issues.push(newIssue[0]);
      } else if (newIssue && !Array.isArray(newIssue)) {
        issues.push(newIssue);
      }
    }

    if (issues.length === 0) {
      throw new Error('Could not create or find any issues to test with');
    }

    // Get the first issue
    const testIssue = issues[0];
    console.log('');
    console.log('2. Testing issue to update:', JSON.stringify(testIssue, null, 2));

    // Now try to update the status to 'rejected'
    console.log('');
    console.log('3. Attempting to update issue status to "rejected"...');
    
    const updateData = {
      status: 'rejected',
      updated_at: new Date().toISOString(),
    };

    console.log('Update data:', JSON.stringify(updateData, null, 2));
    console.log('Filters:', JSON.stringify({ id: testIssue.id }, null, 2));

    const updateResult = await executeQuery({
      table: 'issues',
      action: 'update',
      data: updateData,
      filters: { id: testIssue.id },
      returning: '*',
    });

    console.log('');
    console.log('✅ SUCCESS! Issue updated successfully:');
    console.log(JSON.stringify(updateResult, null, 2));

  } catch (error) {
    console.log('');
    console.log('❌ ERROR occurred during update:');
    console.error('Error:', error.message);
    console.error('Full error:', error);
    
    // Let's check what the constraint violation looks like
    if (error.message && error.message.includes('check constraint')) {
      console.log('');
      console.log('🔍 This appears to be the constraint violation error we\'re looking for!');
      console.log('The error confirms that there\'s an issue with the status constraint.');
    }
  }
}

// Run the test
testIssueUpdate().then(() => {
  console.log('');
  console.log('Test completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
