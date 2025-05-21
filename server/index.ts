import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createConnection } from 'mysql2/promise';

// Import routes
import authRoutes from './routes/auth.route';
import itemRoutes from './routes/item.route';
import weightRoutes from './routes/weight.route';
import sampleRoutes from './routes/sample.route';
import roleRoutes from './routes/role.route';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
export const initDb = async () => {
  try {
    const connection = await createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin1234',
      database: 'weightmanagementdb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('Connected to MySQL database');
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Initialize database tables if they don't exist
const initDbTables = async () => {
  const connection = await initDb();
  
  try {
    // Create roles table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE
      )
    `);

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        role_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    // Create ref_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ref_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        weight DECIMAL(10,2) DEFAULT 0
      )
    `);

    // Create weight_records table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS weight_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        item_id INT NOT NULL,
        total_weight DECIMAL(10,2) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (item_id) REFERENCES ref_items(id)
      )
    `);

    // Create sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP NULL,
        status ENUM('active', 'ended') DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create sample_items table as requested
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sample_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category VARCHAR(100) NOT NULL,
        item VARCHAR(100) NOT NULL,
        sample_weight DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if admin role exists
    const [roles] = await connection.execute('SELECT * FROM roles WHERE name = ?', ['admin']);
    
    if (Array.isArray(roles) && roles.length === 0) {
      // Insert default roles
      await connection.execute('INSERT INTO roles (name) VALUES (?), (?)', ['admin', 'user']);
      console.log('Default roles created');
      
      // Create default admin user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await connection.execute(
        'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@example.com', hashedPassword, 1]
      );
      console.log('Default admin user created');
    }

    // Insert sample data for ref_items
    const [items] = await connection.execute('SELECT * FROM ref_items LIMIT 1');
    
    if (Array.isArray(items) && items.length === 0) {
      await connection.execute(`
        INSERT INTO ref_items (name, weight) VALUES 
        ('Steel', 7.85),
        ('Aluminum', 2.7),
        ('Copper', 8.96),
        ('Plastic', 0.9),
        ('Glass', 2.5)
      `);
      console.log('Sample items created');
    }

    // Insert sample data for sample_items
    const [samples] = await connection.execute('SELECT * FROM sample_items LIMIT 1');
    
    if (Array.isArray(samples) && samples.length === 0) {
      await connection.execute(`
        INSERT INTO sample_items (category, item, sample_weight) VALUES 
        ('Metals', 'Steel', 7.85),
        ('Metals', 'Aluminum', 2.7),
        ('Metals', 'Copper', 8.96),
        ('Polymers', 'Plastic', 0.9),
        ('Ceramics', 'Glass', 2.5),
        ('Metals', 'Iron', 7.87),
        ('Metals', 'Gold', 19.32),
        ('Polymers', 'Nylon', 1.15),
        ('Ceramics', 'Porcelain', 2.4),
        ('Composites', 'Carbon Fiber', 1.6)
      `);
      console.log('Sample item weights created');
    }

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database tables:', error);
  } finally {
    await connection.end();
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/weights', weightRoutes);
app.use('/api/samples', sampleRoutes);
app.use('/api/roles', roleRoutes);

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDbTables();
});

export default app;