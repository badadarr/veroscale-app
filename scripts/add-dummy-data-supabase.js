// Script to add dummy data to Supabase for testing features
import supabase from '../lib/supabase.js';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv.config({ path: envFile });

console.log('Supabase dummy data script started successfully');

async function addDummyDataToSupabase() {
  console.log('Adding dummy data to Supabase for testing...');
  
  try {
    // Check connection to Supabase
    console.log('Checking connection to Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase.from('roles').select('count');
    
    if (connectionError) {
      console.error('Error connecting to Supabase:', connectionError);
      console.log('Make sure your Supabase URL and API key are correctly set in .env.local');
      return;
    }
    
    console.log('Connected to Supabase successfully');
    
    // Add more users for testing
    console.log('Adding additional test users...');
    
    // Make sure we have roles first
    const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
    
    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return;
    }
    
    if (!roles || roles.length === 0) {
      console.log('Inserting roles first...');
      const { error: insertRolesError } = await supabase
        .from('roles')
        .insert([
          { name: 'admin' },
          { name: 'manager' },
          { name: 'operator' }
        ]);
      
      if (insertRolesError) {
        console.error('Error inserting roles:', insertRolesError);
        return;
      }
    }
    
    // Get roles for reference
    const { data: rolesList } = await supabase.from('roles').select('*');
    const rolesMap = {};
    rolesList.forEach(role => {
      rolesMap[role.name] = role.id;
    });
    
    // Create users with different roles
    const usersToAdd = [
      { name: 'Test Admin', email: 'admin2@example.com', password: 'password123', role: 'admin' },
      { name: 'Test Manager', email: 'manager@example.com', password: 'password123', role: 'manager' },
      { name: 'Test Operator 1', email: 'operator1@example.com', password: 'password123', role: 'operator' },
      { name: 'Test Operator 2', email: 'operator2@example.com', password: 'password123', role: 'operator' },
    ];
    
    // Add users if they don't exist
    for (const user of usersToAdd) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const { error: insertUserError } = await supabase
          .from('users')
          .insert({
            name: user.name, 
            email: user.email, 
            password: hashedPassword, 
            role_id: rolesMap[user.role]
          });
        
        if (insertUserError) {
          console.error(`Error creating user ${user.email}:`, insertUserError);
        } else {
          console.log(`User ${user.email} created successfully`);
        }
      } else {
        console.log(`User ${user.email} already exists, skipping`);
      }
    }
    
    // Add more reference items for weighing
    console.log('Adding reference items...');
    
    const refItems = [
      { name: 'Metal Sheet', weight: 12.5 },
      { name: 'Stone Aggregate', weight: 25.0 },
      { name: 'Cement Bag', weight: 50.0 },
      { name: 'Wood Plank', weight: 7.2 },
      { name: 'Steel Rod Bundle', weight: 35.5 },
      { name: 'Concrete Block', weight: 22.7 },
      { name: 'Gravel Container', weight: 18.3 },
      { name: 'Sand Bag', weight: 30.0 }
    ];
    
    for (const item of refItems) {
      const { data: existingItem } = await supabase
        .from('ref_items')
        .select('*')
        .eq('name', item.name)
        .maybeSingle();
      
      if (!existingItem) {
        const { error: insertItemError } = await supabase
          .from('ref_items')
          .insert({ name: item.name, weight: item.weight });
        
        if (insertItemError) {
          console.error(`Error adding reference item ${item.name}:`, insertItemError);
        } else {
          console.log(`Reference item ${item.name} added successfully`);
        }
      } else {
        console.log(`Reference item ${item.name} already exists, skipping`);
      }
    }
    
    // Add more sample items
    console.log('Adding sample items...');
    
    const sampleItems = [
      { category: 'Metal', item: 'Iron', sample_weight: 7.87 },
      { category: 'Metal', item: 'Zinc', sample_weight: 7.13 },
      { category: 'Metal', item: 'Lead', sample_weight: 11.34 },
      { category: 'Plastic', item: 'HDPE', sample_weight: 0.95 },
      { category: 'Plastic', item: 'ABS', sample_weight: 1.07 },
      { category: 'Wood', item: 'Mahogany', sample_weight: 0.85 },
      { category: 'Composite', item: 'Carbon Fiber', sample_weight: 1.55 },
      { category: 'Ceramic', item: 'Stoneware', sample_weight: 2.3 },
      { category: 'Glass', item: 'Borosilicate', sample_weight: 2.23 }
    ];
    
    for (const item of sampleItems) {
      const { data: existingItem } = await supabase
        .from('samples_item')
        .select('*')
        .eq('category', item.category)
        .eq('item', item.item)
        .maybeSingle();
      
      if (!existingItem) {
        const { error: insertSampleError } = await supabase
          .from('samples_item')
          .insert({
            category: item.category,
            item: item.item,
            sample_weight: item.sample_weight
          });
        
        if (insertSampleError) {
          console.error(`Error adding sample item ${item.category} - ${item.item}:`, insertSampleError);
        } else {
          console.log(`Sample item ${item.category} - ${item.item} added successfully`);
        }
      } else {
        console.log(`Sample item ${item.category} - ${item.item} already exists, skipping`);
      }
    }
    
    // Add weight records for testing
    console.log('Adding weight records...');
    
    // Get user IDs
    const { data: userRows } = await supabase.from('users').select('id, name');
    const users_map = userRows.map(user => ({ id: user.id, name: user.name }));
    
    // Get item IDs
    const { data: itemRows } = await supabase.from('ref_items').select('id, name');
    const items_map = itemRows.map(item => ({ id: item.id, name: item.name }));
    
    // Generate records for the past 30 days
    const today = new Date();
    const statuses = ['pending', 'approved', 'rejected'];
    
    // Prepare batch inserts for performance
    const weightRecordsBatch = [];
    
    for (let days = 30; days >= 0; days--) {
      const recordDate = new Date(today);
      recordDate.setDate(recordDate.getDate() - days);
      
      // Generate 3-7 random records per day
      const recordsCount = Math.floor(Math.random() * 5) + 3;
      
      for (let i = 0; i < recordsCount; i++) {
        const userId = users_map[Math.floor(Math.random() * users_map.length)].id;
        const itemId = items_map[Math.floor(Math.random() * items_map.length)].id;
        const totalWeight = parseFloat((Math.random() * 100 + 5).toFixed(2));
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Set time component for the day
        const hours = Math.floor(Math.random() * 8) + 8; // Between 8 AM and 4 PM
        const minutes = Math.floor(Math.random() * 60);
        recordDate.setHours(hours, minutes, 0, 0);
        
        // Format date for Supabase
        const timestamp = recordDate.toISOString();
        
        weightRecordsBatch.push({
          user_id: userId,
          item_id: itemId,
          total_weight: totalWeight,
          timestamp: timestamp,
          status: status
        });
      }
      
      console.log(`Prepared records for ${recordDate.toISOString().split('T')[0]}`);
    }
    
    // Insert weight records in batches of 100 (Supabase has limits)
    const batchSize = 100;
    for (let i = 0; i < weightRecordsBatch.length; i += batchSize) {
      const batch = weightRecordsBatch.slice(i, i + batchSize);
      const { error } = await supabase.from('weight_records').insert(batch);
      
      if (error) {
        console.error(`Error inserting weight records batch ${i/batchSize + 1}:`, error);
      } else {
        console.log(`Inserted weight records batch ${i/batchSize + 1} successfully`);
      }
    }
    
    // Add session records
    console.log('Adding session records...');
    
    // Prepare batch inserts for sessions
    const sessionsBatch = [];
    
    for (const user of users_map) {
      // Add 5-10 past sessions per user
      const sessionCount = Math.floor(Math.random() * 6) + 5;
      
      for (let i = 0; i < sessionCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const sessionDate = new Date(today);
        sessionDate.setDate(sessionDate.getDate() - daysAgo);
        
        // Random start time between 8 AM and 2 PM
        const startHour = Math.floor(Math.random() * 6) + 8;
        sessionDate.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);
        const startTime = sessionDate.toISOString();
        
        // End time 2-8 hours later
        const endDate = new Date(sessionDate);
        endDate.setHours(endDate.getHours() + Math.floor(Math.random() * 6) + 2);
        const endTime = endDate.toISOString();
        
        sessionsBatch.push({
          user_id: user.id,
          start_time: startTime,
          end_time: endTime,
          status: 'inactive'
        });
      }
      
      // Add one active session for some users (50% chance)
      if (Math.random() > 0.5) {
        const activeDate = new Date();
        activeDate.setHours(8 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0);
        const activeTime = activeDate.toISOString();
        
        sessionsBatch.push({
          user_id: user.id,
          start_time: activeTime,
          end_time: null,
          status: 'active'
        });
      }
    }
    
    // Insert sessions in batches
    for (let i = 0; i < sessionsBatch.length; i += batchSize) {
      const batch = sessionsBatch.slice(i, i + batchSize);
      const { error } = await supabase.from('sessions').insert(batch);
      
      if (error) {
        console.error(`Error inserting sessions batch ${i/batchSize + 1}:`, error);
      } else {
        console.log(`Inserted sessions batch ${i/batchSize + 1} successfully`);
      }
    }
    
    console.log('Dummy data added to Supabase successfully!');
    
  } catch (error) {
    console.error('Error adding dummy data to Supabase:', error);
  }
}

// Run the function
addDummyDataToSupabase();
