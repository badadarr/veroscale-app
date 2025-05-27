import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function SystemConfiguration() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // System defaults
        defaultWeightUnit: 'kg',
        defaultDateFormat: 'MM/DD/YYYY',
        defaultTimezone: 'Asia/Jakarta',

        // Data retention
        weightRecordRetentionDays: 365,
        sessionLogRetentionDays: 90,
        archiveOldRecords: true,

        // Email settings
        smtpServer: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPassword: '',
        emailSenderAddress: '',
        emailSenderName: 'Weight Management System',

        // Approval settings
        requireWeightApproval: true,
        autoApproveAfterHours: 24,
    });

    // Redirect if not admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            window.location.href = '/dashboard';
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Here you would make an API call to save the system configuration
            // const response = await apiClient.post('/api/settings/system', formData);

            // For now, we'll just simulate success
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('System configuration updated successfully');
        } catch (error) {
            console.error('Error saving system configuration:', error);
            toast.error('Failed to update system configuration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="System Configuration">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>System Defaults</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="defaultWeightUnit" className="block text-sm font-medium text-gray-700 mb-1">
                                        Default Weight Unit
                                    </label>
                                    <select
                                        id="defaultWeightUnit"
                                        value={formData.defaultWeightUnit}
                                        onChange={(e) => setFormData({ ...formData, defaultWeightUnit: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                                    >
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="g">Grams (g)</option>
                                        <option value="lb">Pounds (lb)</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="defaultDateFormat" className="block text-sm font-medium text-gray-700 mb-1">
                                        Default Date Format
                                    </label>
                                    <select
                                        id="defaultDateFormat"
                                        value={formData.defaultDateFormat}
                                        onChange={(e) => setFormData({ ...formData, defaultDateFormat: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                                    >
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="defaultTimezone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Default Timezone
                                    </label>
                                    <select
                                        id="defaultTimezone"
                                        value={formData.defaultTimezone}
                                        onChange={(e) => setFormData({ ...formData, defaultTimezone: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                                    >
                                        <option value="Asia/Jakarta">Asia/Jakarta (GMT+7)</option>
                                        <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                                        <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Data Retention Policy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="weightRecordRetentionDays" className="block text-sm font-medium text-gray-700 mb-1">
                                        Weight Record Retention (days)
                                    </label>
                                    <Input
                                        id="weightRecordRetentionDays"
                                        type="number"
                                        value={formData.weightRecordRetentionDays}
                                        onChange={(e) => setFormData({ ...formData, weightRecordRetentionDays: parseInt(e.target.value) })}
                                        min="1"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="sessionLogRetentionDays" className="block text-sm font-medium text-gray-700 mb-1">
                                        Session Log Retention (days)
                                    </label>
                                    <Input
                                        id="sessionLogRetentionDays"
                                        type="number"
                                        value={formData.sessionLogRetentionDays}
                                        onChange={(e) => setFormData({ ...formData, sessionLogRetentionDays: parseInt(e.target.value) })}
                                        min="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Archive Old Records
                                    </label>
                                    <div className="flex items-center mt-2">
                                        <input
                                            type="checkbox"
                                            id="archiveOldRecords"
                                            checked={formData.archiveOldRecords}
                                            onChange={(e) => setFormData({ ...formData, archiveOldRecords: e.target.checked })}
                                            className="h-4 w-4 text-primary-600 rounded border-gray-300"
                                        />
                                        <label htmlFor="archiveOldRecords" className="ml-2 text-sm text-gray-600">
                                            Archive records instead of permanently deleting them
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Email Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="smtpServer" className="block text-sm font-medium text-gray-700 mb-1">
                                        SMTP Server
                                    </label>
                                    <Input
                                        id="smtpServer"
                                        type="text"
                                        value={formData.smtpServer}
                                        onChange={(e) => setFormData({ ...formData, smtpServer: e.target.value })}
                                        placeholder="smtp.example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 mb-1">
                                        SMTP Port
                                    </label>
                                    <Input
                                        id="smtpPort"
                                        type="text"
                                        value={formData.smtpPort}
                                        onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700 mb-1">
                                        SMTP Username
                                    </label>
                                    <Input
                                        id="smtpUser"
                                        type="text"
                                        value={formData.smtpUser}
                                        onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        SMTP Password
                                    </label>
                                    <Input
                                        id="smtpPassword"
                                        type="password"
                                        value={formData.smtpPassword}
                                        onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="emailSenderAddress" className="block text-sm font-medium text-gray-700 mb-1">
                                        Sender Email Address
                                    </label>
                                    <Input
                                        id="emailSenderAddress"
                                        type="email"
                                        value={formData.emailSenderAddress}
                                        onChange={(e) => setFormData({ ...formData, emailSenderAddress: e.target.value })}
                                        placeholder="noreply@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="emailSenderName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Sender Name
                                    </label>
                                    <Input
                                        id="emailSenderName"
                                        type="text"
                                        value={formData.emailSenderName}
                                        onChange={(e) => setFormData({ ...formData, emailSenderName: e.target.value })}
                                    />
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Approval Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="requireWeightApproval" className="block text-sm font-medium text-gray-700 mb-1">
                                        Require Weight Approval
                                    </label>
                                    <div className="flex items-center mt-2">
                                        <input
                                            type="checkbox"
                                            id="requireWeightApproval"
                                            checked={formData.requireWeightApproval}
                                            onChange={(e) => setFormData({ ...formData, requireWeightApproval: e.target.checked })}
                                            className="h-4 w-4 text-primary-600 rounded border-gray-300"
                                        />
                                        <span className="ml-2 text-sm text-gray-600">
                                            Weight records require manager approval
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="autoApproveAfterHours" className="block text-sm font-medium text-gray-700 mb-1">
                                        Auto-approve after (hours)
                                    </label>
                                    <Input
                                        id="autoApproveAfterHours"
                                        type="number"
                                        value={formData.autoApproveAfterHours}
                                        onChange={(e) => setFormData({ ...formData, autoApproveAfterHours: parseInt(e.target.value) })}
                                        min="0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Set to 0 to disable auto-approval</p>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button type="submit" onClick={handleSubmit} disabled={loading}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? 'Saving...' : 'Save Configuration'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
