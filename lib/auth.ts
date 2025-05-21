import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import { executeQuery } from './db';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface UserPayload {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthToken {
  userId: number;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

// Generate JWT token
export function generateToken(user: UserPayload): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// Verify JWT token
export function verifyToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken;
  } catch (error) {
    return null;
  }
}

// Get user from request
export async function getUserFromToken(req: NextApiRequest): Promise<UserPayload | null> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return null;
  }

  try {
    const user = await executeQuery<any[]>({
      query: `
        SELECT u.id, u.email, u.name, r.name as role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `,
      values: [decoded.userId],
    });

    if (!user || user.length === 0) {
      return null;
    }

    return user[0] as UserPayload;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Check if user has admin role
export function isAdmin(user: UserPayload | null): boolean {
  return user?.role === 'admin';
}

// Check if user has manager role or higher
export function isManagerOrAdmin(user: UserPayload | null): boolean {
  return user?.role === 'admin' || user?.role === 'manager';
}