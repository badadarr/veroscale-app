// add-dummy-data.js
// Script to add dummy data for testing features
import { createConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Script started successfully');

async function addDummyData() {
  console.log('Adding dummy data for testing...');
  
  let connection;
  
  try {
    // Connect to MySQL server with database
    connection = await createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin1234',
      database: 'weightmanagementdb'
    });
    
    console.log('Connected to database successfully');
    
    // Add more users for testing
    console.log('Adding additional test users...');
    
    // Create users with different roles
    const roles = ['admin', 'manager', 'operator'];
    const users = [
      { name: 'Test Admin', email: 'admin2@example.com', password: 'password123', role: 'admin' },
      { name: 'Test Manager', email: 'manager@example.com', password: 'password123', role: 'manager' },
      { name: 'Test Operator 1', email: 'operator1@example.com', password: 'password123', role: 'operator' },
      { name: 'Test Operator 2', email: 'operator2@example.com', password: 'password123', role: 'operator' },
    ];
    
    // Add users if they don't exist
    for (const user of users) {
      const [existingUser] = await connection.execute('SELECT * FROM users WHERE email = ?', [user.email]);
      
      if (!existingUser.length) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await connection.execute(`
          INSERT INTO users (name, email, password, role_id) 
          VALUES (?, ?, ?, (SELECT id FROM roles WHERE name = ?))
        `, [user.name, user.email, hashedPassword, user.role]);
        console.log(`User ${user.email} created successfully`);
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
      const [existingItem] = await connection.execute('SELECT * FROM ref_items WHERE name = ?', [item.name]);
      
      if (!existingItem.length) {
        await connection.execute('INSERT INTO ref_items (name, weight) VALUES (?, ?)', [item.name, item.weight]);
        console.log(`Reference item ${item.name} added successfully`);
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
      const [existingItem] = await connection.execute(
        'SELECT * FROM samples_item WHERE category = ? AND item = ?', 
        [item.category, item.item]
      );
      
      if (!existingItem.length) {
        await connection.execute(
          'INSERT INTO samples_item (category, item, sample_weight) VALUES (?, ?, ?)', 
          [item.category, item.item, item.sample_weight]
        );
        console.log(`Sample item ${item.category} - ${item.item} added successfully`);
      } else {
        console.log(`Sample item ${item.category} - ${item.item} already exists, skipping`);
      }
    }
    
    // Add weight records for testing
    console.log('Adding weight records...');
    
    // Get user IDs
    const [userRows] = await connection.execute('SELECT id, name FROM users');
    const users_map = userRows.map(user => ({ id: user.id, name: user.name }));
    
    // Get item IDs
    const [itemRows] = await connection.execute('SELECT id, name FROM ref_items');
    const items_map = itemRows.map(item => ({ id: item.id, name: item.name }));
    
    // Generate records for the past 30 days
    const today = new Date();
    const statuses = ['pending', 'approved', 'rejected'];
    
    for (let days = 30; days >= 0; days--) {
      const recordDate = new Date(today);
      recordDate.setDate(recordDate.getDate() - days);
      
      // Generate 3-7 random records per day
      const recordsCount = Math.floor(Math.random() * 5) + 3;
      
      for (let i = 0; i < recordsCount; i++) {
        const userId = users_map[Math.floor(Math.random() * users_map.length)].id;
        const itemId = items_map[Math.floor(Math.random() * items_map.length)].id;
        const totalWeight = (Math.random() * 100 + 5).toFixed(2);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Set time component for the day
        const hours = Math.floor(Math.random() * 8) + 8; // Between 8 AM and 4 PM
        const minutes = Math.floor(Math.random() * 60);
        recordDate.setHours(hours, minutes, 0, 0);
        
        // Format date for MySQL
        const formattedDate = recordDate.toISOString().slice(0, 19).replace('T', ' ');
        
        await connection.execute(
          'INSERT INTO weight_records (user_id, item_id, total_weight, timestamp, status) VALUES (?, ?, ?, ?, ?)',
          [userId, itemId, totalWeight, formattedDate, status]
        );
      }
      
      console.log(`Added records for ${recordDate.toISOString().split('T')[0]}`);
    }
    
    // Add session records
    console.log('Adding session records...');
    
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
        const startTime = sessionDate.toISOString().slice(0, 19).replace('T', ' ');
        
        // End time 2-8 hours later
        const endDate = new Date(sessionDate);
        endDate.setHours(endDate.getHours() + Math.floor(Math.random() * 6) + 2);
        const endTime = endDate.toISOString().slice(0, 19).replace('T', ' ');
        
        await connection.execute(
          'INSERT INTO sessions (user_id, start_time, end_time, status) VALUES (?, ?, ?, ?)',
          [user.id, startTime, endTime, 'inactive']
        );
      }
      
      // Add one active session for some users (50% chance)
      if (Math.random() > 0.5) {
        const activeDate = new Date();
        activeDate.setHours(8 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0);
        const activeTime = activeDate.toISOString().slice(0, 19).replace('T', ' ');
        
        await connection.execute(
          'INSERT INTO sessions (user_id, start_time, end_time, status) VALUES (?, ?, ?, ?)',
          [user.id, activeTime, null, 'active']
        );
      }
    }
    
    console.log('Dummy data added successfully!');
    
  } catch (error) {
    console.error('Error adding dummy data:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the function
addDummyData();
