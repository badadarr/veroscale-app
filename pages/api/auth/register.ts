import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../../../lib/db';
import { getUserFromToken, isAdmin } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Only admin can register new users
    const user = await getUserFromToken(req);
    if (!user || !isAdmin(user)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email already exists
    const existingUsers = await executeQuery<any[]>({
      query: 'SELECT * FROM users WHERE email = ?',
      values: [email],
    });

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Get role ID
    const roles = await executeQuery<any[]>({
      query: 'SELECT id FROM roles WHERE name = ?',
      values: [role],
    });

    if (!roles || roles.length === 0) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const roleId = roles[0].id;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await executeQuery<any>({
      query: `
        INSERT INTO users (name, email, password, role_id)
        VALUES (?, ?, ?, ?)
      `,
      values: [name, email, hashedPassword, roleId],
    });

    return res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}