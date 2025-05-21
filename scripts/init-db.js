import { createConnection } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

// Load environment variables
const envFile = process.env.NODE_ENV === "production" ? ".env" : ".env.local";
dotenv.config({ path: envFile });

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeDatabase() {
  console.log("Initializing database...");

  let connection;

  try {
    const host = process.env.DB_HOST || "localhost";
    const user = process.env.DB_USER || "root";
    const password = process.env.DB_PASSWORD || "admin1234";
    const dbName = process.env.DB_NAME || "public";

    console.log(`Connecting to database at ${host}...`);

    // Options for ssl in production
    const sslOptions =
      process.env.NODE_ENV === "production"
        ? {
            ssl: { rejectUnauthorized: true },
          }
        : {};

    // Connect to MySQL server
    connection = await createConnection({
      host,
      user,
      password,
      ...sslOptions,
    });

    // For cloud databases like PlanetScale, database may already exist
    // and user might not have CREATE DATABASE permissions
    try {
      // Create database if it doesn't exist
      await connection.execute(`
        CREATE DATABASE IF NOT EXISTS ${dbName}
      `);
      console.log("Database created successfully");
    } catch (error) {
      console.log(
        "Database already exists or cannot create database. Continuing..."
      );
    }

    // Connect to the database
    await connection.changeUser({
      database: dbName,
    });

    // Create tables
    console.log("Creating tables...");

    // Create roles table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) UNIQUE NOT NULL
      )
    `);

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    // Create ref_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ref_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        weight DECIMAL(10, 2) NOT NULL
      )
    `);

    // Create weight_records table
    await connection.execute(`
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
    `);

    // Create sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create samples_item table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS samples_item (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category VARCHAR(100) NOT NULL,
        item VARCHAR(100) NOT NULL,
        sample_weight DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default roles
    await connection.execute(`
      INSERT IGNORE INTO roles (name) VALUES 
      ('admin'), 
      ('manager'), 
      ('operator')
    `);

    // Check if there are any users
    const [users] = await connection.execute(
      "SELECT COUNT(*) as count FROM users"
    );
    const userCount = users[0].count;

    // Insert default admin user if no users exist
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await connection.execute(
        `
        INSERT INTO users (name, email, password, role_id) 
        VALUES (?, ?, ?, (SELECT id FROM roles WHERE name = 'admin'))
      `,
        ["Admin User", "admin@example.com", hashedPassword]
      );

      console.log("Default admin user created");
    }

    // Insert sample data
    const [samples] = await connection.execute(
      "SELECT COUNT(*) as count FROM samples_item"
    );
    const sampleCount = samples[0].count;

    if (sampleCount === 0) {
      console.log("Inserting sample data...");

      // Insert sample ref_items
      await connection.execute(`
        INSERT INTO ref_items (name, weight) VALUES
        ('Steel Bar', 5.75),
        ('Aluminum Sheet', 2.3),
        ('Copper Wire', 1.25),
        ('Iron Pipe', 8.5),
        ('Plastic Granules', 0.85)
      `);

      // Insert sample samples_item
      await connection.execute(`
        INSERT INTO samples_item (category, item, sample_weight) VALUES
        ('Metal', 'Steel', 7.8),
        ('Metal', 'Aluminum', 2.7),
        ('Metal', 'Copper', 8.96),
        ('Plastic', 'PVC', 1.3),
        ('Plastic', 'Polypropylene', 0.9),
        ('Wood', 'Oak', 0.7),
        ('Wood', 'Pine', 0.5),
        ('Rubber', 'Natural Rubber', 0.92),
        ('Glass', 'Soda-lime Glass', 2.5),
        ('Ceramic', 'Porcelain', 2.4)
      `);

      console.log("Sample data inserted successfully");
    }

    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the initialization
initializeDatabase();
