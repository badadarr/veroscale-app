import express from 'express';
import { createConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'VeroScale-secret-key';

// Register a new user
router.post('/register', async (req, res) => {
  const connection = await createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin1234',
    database: 'public'
  });
  
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get the default user role id
    const [roles] = await connection.execute(
      'SELECT id FROM roles WHERE name = ?', 
      ['user']
    );
    
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(500).json({ message: 'Role not found' });
    }
    
    const roleId = (roles[0] as { id: number }).id;

    // Create new user
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, roleId]
    );
    
    const insertId = (result as { insertId: number }).insertId;

    // Create user session
    await connection.execute(
      'INSERT INTO sessions (user_id, status) VALUES (?, ?)',
      [insertId, 'active']
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: insertId, email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: insertId,
        name,
        email,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  } finally {
    await connection.end();
  }
});

// Login user
router.post('/login', async (req, res) => {
  const connection = await createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin1234',
    database: 'public'
  });
  
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const [users] = await connection.execute(
      'SELECT u.id, u.name, u.email, u.password, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
      [email]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0] as {
      id: number;
      name: string;
      email: string;
      password: string;
      role: string;
    };

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create user session
    await connection.execute(
      'INSERT INTO sessions (user_id, status) VALUES (?, ?)',
      [user.id, 'active']
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  } finally {
    await connection.end();
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  const connection = await createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin1234',
    database: 'public'
  });
  
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Update all active sessions for this user to 'ended'
    await connection.execute(
      'UPDATE sessions SET status = ?, end_time = NOW() WHERE user_id = ? AND status = ?',
      ['ended', userId, 'active']
    );

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  } finally {
    await connection.end();
  }
});

export default router;