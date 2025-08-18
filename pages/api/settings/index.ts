import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db-adapter';
import { getUserFromToken, isAdmin } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromToken(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only admin can access system settings
  if (!isAdmin(user)) {
    return res.status(403).json({ message: 'Forbidden. Admin access required.' });
  }

  switch (req.method) {
    case 'GET':
      return getSystemSettings(req, res);
    case 'PUT':
      return updateSystemSettings(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all system settings
async function getSystemSettings(req: NextApiRequest, res: NextApiResponse) {
  try {
    let settings = await executeQuery<any[]>({
      query: 'SELECT * FROM system_settings',
    });
    
    // If no settings exist yet, return default values
    if (!settings || settings.length === 0) {
      settings = getDefaultSettings();
    }

    // Group settings by category
    const groupedSettings = groupSettingsByCategory(settings);
    
    return res.status(200).json(groupedSettings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Update system settings
async function updateSystemSettings(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { settings } = req.body;    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ message: 'Invalid settings data' });
    }

    // Process each setting
    for (const setting of settings) {
      const { key, value, category } = setting;
      
      if (!key || value === undefined || !category) {
        continue; // Skip invalid settings
      }
      
      // Check if setting exists
      const existingSetting = await executeQuery<any>({
        query: 'SELECT * FROM system_settings WHERE `key` = ?',
        values: [key],
        single: true
      });
      
      if (existingSetting) {
        // Update existing setting
        await executeQuery({
          query: 'UPDATE system_settings SET `value` = ?, `category` = ? WHERE `key` = ?',
          values: [value, category, key]
        });
      } else {
        // Insert new setting
        await executeQuery({
          query: 'INSERT INTO system_settings (`key`, `value`, `category`) VALUES (?, ?, ?)',
          values: [key, value, category]
        });
      }
    }
    
    return res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Helper function to get default system settings
function getDefaultSettings() {
  return [
    // System defaults
    { key: 'defaultWeightUnit', value: 'kg', category: 'system' },
    { key: 'defaultLanguage', value: 'en', category: 'system' },
    { key: 'defaultPageSize', value: '10', category: 'system' },
    
    // Data retention
    { key: 'retainRecordsForDays', value: '365', category: 'retention' },
    { key: 'retainSessionsForDays', value: '30', category: 'retention' },
    { key: 'autoArchiveAfterDays', value: '90', category: 'retention' },
    { key: 'archiveStrategy', value: 'compress', category: 'retention' },
    
    // Email settings
    { key: 'smtpServer', value: '', category: 'email' },
    { key: 'smtpPort', value: '587', category: 'email' },
    { key: 'smtpUser', value: '', category: 'email' },
    { key: 'smtpPassword', value: '', category: 'email' },
    { key: 'emailSender', value: 'noreply@example.com', category: 'email' },
    { key: 'emailEnabled', value: 'false', category: 'email' },
    
    // Approval settings
    { key: 'requireApproval', value: 'true', category: 'approval' },
    { key: 'approvalThreshold', value: '10', category: 'approval' },
    { key: 'autoApproveRegularUsers', value: 'false', category: 'approval' },
    { key: 'notifyAdminOnNewEntry', value: 'true', category: 'approval' }
  ];
}

// Helper function to group settings by category
function groupSettingsByCategory(settings: any[]) {
  const groupedSettings: Record<string, Record<string, any>> = {};
  
  settings.forEach(setting => {
    const { key, value, category } = setting;
    
    if (!groupedSettings[category]) {
      groupedSettings[category] = {};
    }
    
    groupedSettings[category][key] = value;
  });
  
  return groupedSettings;
}
