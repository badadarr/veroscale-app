import { supabase } from './supabase';

// Helper function to execute queries on Supabase
export async function executeQuery<T>({
  table,
  action = 'select',
  data = {},
  conditions = {},
  columns = '*',
}: {
  table: string;
  action?: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  data?: Record<string, any>;
  conditions?: Record<string, any>;
  columns?: string | string[];
}): Promise<T> {
  try {
    let query = supabase.from(table);
    
    switch (action) {
      case 'select':
        query = query.select(columns);
        break;
      case 'insert':
        query = query.insert(data);
        break;
      case 'update':
        query = query.update(data);
        break;
      case 'upsert':
        query = query.upsert(data);
        break;
      case 'delete':
        query = query.delete();
        break;
    }
    
    // Apply conditions (where clauses)
    for (const [key, value] of Object.entries(conditions)) {
      query = query.eq(key, value);
    }
    
    const { data: result, error } = await query;
    
    if (error) throw error;
    return result as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database query failed');
  }
}

// Initialize database
export async function initializeDatabase() {
  try {
    // Create users table
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `,
    });

    // Create roles table
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS roles (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(50) UNIQUE NOT NULL
        )
      `,
    });

    // Create ref_items table
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS ref_items (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          weight DECIMAL(10, 2) NOT NULL
        )
      `,
    });

    // Create weight_records table
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS weight_records (
          record_id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          item_id INT NOT NULL,
          total_weight DECIMAL(10, 2) NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (item_id) REFERENCES ref_items(id)
        )
      `,
    });

    // Create sessions table
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS sessions (
          session_id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          end_time TIMESTAMP NULL,
          status ENUM('active', 'inactive') DEFAULT 'active',
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `,
    });

    // Create samples_item table
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS samples_item (
          id INT PRIMARY KEY AUTO_INCREMENT,
          category VARCHAR(100) NOT NULL,
          item VARCHAR(100) NOT NULL,
          sample_weight DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `,
    });

    // Insert default roles if they don't exist
    await executeQuery({
      query: `
        INSERT IGNORE INTO roles (name) VALUES 
        ('admin'), 
        ('manager'), 
        ('operator')
      `,
    });

    // Insert default admin user if no users exist
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const userCount = (users as any)[0].count;

    if (userCount === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await executeQuery({
        query: `
          INSERT INTO users (name, email, password, role_id) 
          VALUES (?, ?, ?, (SELECT id FROM roles WHERE name = 'admin'))
        `,
        values: ['Admin User', 'admin@example.com', hashedPassword],
      });
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw new Error('Failed to initialize database');
  }
}