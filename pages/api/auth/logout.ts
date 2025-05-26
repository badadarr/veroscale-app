import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db-adapter';
import { getUserFromToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await getUserFromToken(req);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Close user sessions
    await executeQuery({
      table: 'public.sessions',
      action: 'update',
      data: {
        status: 'inactive',
        end_time: new Date()
      },
      filters: {
        user_id: user.id,
        status: 'active'
      },
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}