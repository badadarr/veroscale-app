import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import StatusWorkflowGuide from '@/components/ui/StatusWorkflowGuide';

export default function Settings() {
  const [formData, setFormData] = useState({
    weightUnit: 'kg',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'Asia/Jakarta',
    emailNotifications: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement settings update logic here
    toast.success('Settings updated successfully');
  };
  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        <StatusWorkflowGuide />

        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="weightUnit" className="block text-sm font-medium text-gray-700 mb-1">
                    Weight Unit
                  </label>
                  <select                    id="weightUnit"
                    value={formData.weightUnit}
                    onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    disabled
                  >
                    <option value="kg">Kilograms (kg)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">System is configured to use kilograms (kg) only</p>
                </div>

                <div>
                  <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">
                    Date Format
                  </label>
                  <select
                    id="dateFormat"
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Asia/Jakarta">Asia/Jakarta (GMT+7)</option>
                    <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Notifications
                  </label>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300"
                      title="Receive email notifications for important updates"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Receive email notifications for important updates
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
