import { useState, useEffect } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { useRouter } from 'next/router';

interface NotificationBellProps {
    className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(false);    useEffect(() => {
        if (user) {
            fetchPendingIssues();
            // Set up polling for real-time updates
            const interval = setInterval(fetchPendingIssues, 15000); // Check every 15 seconds
            return () => clearInterval(interval);
        }
    }, [user]);

    // Also update when navigating back to the page
    useEffect(() => {
        const handleFocus = () => {
            if (user) fetchPendingIssues();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [user]);const fetchPendingIssues = async () => {
        if (loading) return;
        
        setLoading(true);
        try {
            const response = await apiClient.get('/api/issues');
            const allIssues = response.data?.issues || [];
            // Filter only pending and in_review issues, exclude resolved and rejected
            const pendingIssues = allIssues.filter((issue: any) => 
                issue.status === 'pending' || issue.status === 'in_review'
            );
            setPendingCount(pendingIssues.length);
            console.log('Notification bell - pending issues count:', pendingIssues.length);
        } catch (error) {
            console.error('Error fetching pending issues:', error);
            setPendingCount(0);
        } finally {
            setLoading(false);
        }
    };

    const handleClick = () => {
        router.push('/issues');
    };

    // Show for all users - but with different functionality based on role
    if (!user) {
        return null;
    }

    return (
        <div className={`relative ${className} cursor-pointer`} onClick={handleClick}>
            <Bell className="h-5 w-5 text-gray-600 hover:text-primary-600 transition-colors" />
            {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {pendingCount > 9 ? '9+' : pendingCount}
                </span>
            )}
            {pendingCount > 0 && (
                <div className="absolute top-6 right-0 bg-yellow-50 border border-yellow-200 rounded-md px-2 py-1 text-xs text-yellow-800 whitespace-nowrap shadow-sm z-10">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    {pendingCount} pending issue{pendingCount !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
