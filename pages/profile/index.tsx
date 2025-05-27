import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { Save, User, Mail, Lock, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileFormData {
    name: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export default function Profile() {
    const { user, login } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState<ProfileFormData>({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData(prevData => ({
                ...prevData,
                name: user.name || '',
                email: user.email || '',
            }));
        }
    }, [user]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Basic validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        // Password validation (only if the user is trying to change password)
        if (formData.newPassword || formData.currentPassword) {
            if (!formData.currentPassword) {
                newErrors.currentPassword = 'Current password is required to set a new password';
            }

            if (!formData.newPassword) {
                newErrors.newPassword = 'New password is required';
            } else if (formData.newPassword.length < 6) {
                newErrors.newPassword = 'Password must be at least 6 characters';
            }

            if (formData.newPassword !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Prepare data to send (exclude confirmPassword)
            const dataToSend = {
                name: formData.name,
                email: formData.email,
                currentPassword: formData.currentPassword || undefined,
                newPassword: formData.newPassword || undefined,
            };

            const response = await apiClient.put('/api/profile', dataToSend);

            // Update local user data
            if (response.data.user) {
                // Force relogin to update local data
                const token = localStorage.getItem('token');
                if (token) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    // Update global auth state
                    login(formData.email, formData.currentPassword || '').catch(() => {
                        // If login fails after profile update, redirect to login page
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        router.push('/login');
                    });
                }
            }

            // Reset password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            }));

            toast.success('Profile updated successfully');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="My Profile">
            <div className="space-y-6">
                {fetchError && (
                    <div className="bg-error-100 border border-error-300 text-error-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            <span>{fetchError}</span>
                        </div>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    id="name"
                                    label="Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    error={errors.name}
                                />

                                <Input
                                    id="email"
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    error={errors.email}
                                />
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-medium mb-4">Change Password</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        id="currentPassword"
                                        label="Current Password"
                                        type="password"
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                        error={errors.currentPassword}
                                    />

                                    <Input
                                        id="newPassword"
                                        label="New Password"
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        error={errors.newPassword}
                                    />

                                    <Input
                                        id="confirmPassword"
                                        label="Confirm New Password"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        error={errors.confirmPassword}
                                    />
                                </div>

                                <Button type="submit" disabled={loading}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
