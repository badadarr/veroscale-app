import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Edit,
    Trash2,
    Plus,
    Eye,
    Flag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import apiClient from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Issue {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'in_review' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'critical';
    type?: 'data_correction' | 'system_error' | 'feature_request' | 'other';
    issue_type?: 'data_correction' | 'system_error' | 'feature_request' | 'other';
    created_at: string;
    updated_at: string;
    user_id?: number;
    reporter_id?: number;
    user_name: string;
    resolved_by?: number;
    resolved_by_name?: string;
    resolved_at?: string;
    record_id?: number;
}

export default function Issues() {
    const { user } = useAuth();
    const router = useRouter();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Form state for creating new issue
    const [newIssue, setNewIssue] = useState({
        title: '',
        description: '',
        type: 'data_correction',
        priority: 'medium',
        record_id: null as number | null
    });

    useEffect(() => {
        fetchIssues();
    }, []); const fetchIssues = async () => {
        setLoading(true);
        try {
            console.log('Fetching issues...');
            const response = await apiClient.get('/api/issues');
            console.log('Issues response:', response.data);
            setIssues(response.data.issues || []);
        } catch (error: any) {
            console.error('Error fetching issues:', error);
            console.error('Error response:', error.response?.data);
            toast.error(`Failed to load issues: ${error.response?.data?.error || error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };    const createIssue = async () => {
        if (!newIssue.title.trim() || !newIssue.description.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            console.log('Creating issue with data:', newIssue);
            const response = await apiClient.post('/api/issues', newIssue);
            console.log('Create issue response:', response.data);
            
            if (response.data?.issue) {
                toast.success('Issue created successfully');
                
                // Add the new issue to the beginning of the list
                setIssues(prevIssues => [response.data.issue, ...prevIssues]);
                
                setShowCreateModal(false);
                setNewIssue({
                    title: '',
                    description: '',
                    type: 'data_correction',
                    priority: 'medium',
                    record_id: null
                });
            } else {
                throw new Error('No issue data returned from server');
            }
        } catch (error: any) {
            console.error('Error creating issue:', error);
            console.error('Error response:', error.response?.data);
            
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.details || 
                               error.message || 
                               'Unknown error occurred';
            
            toast.error(`Failed to create issue: ${errorMessage}`);
        }
    };const updateIssueStatus = async (issueId: number, status: string) => {
        if (user?.role === 'operator' && status !== 'pending') {
            // Operators can only revise (reopen) issues
            toast.error('You can only reopen issues, not resolve or reject them');
            return;
        }

        setStatusUpdating(issueId);
        try {
            console.log(`Updating issue ${issueId} to status: ${status}`);
            const response = await apiClient.put(`/api/issues/${issueId}`, {
                status,
                resolver_id: status === 'resolved' ? user?.id : undefined
            });
            
            console.log('Status update response:', response.data);
            
            if (response.data?.issue) {
                // Update the local state with the returned issue data
                setIssues(issues.map(issue =>
                    issue.id === issueId ? {
                        ...response.data.issue,
                        user_name: response.data.issue.user_name || issue.user_name
                    } : issue
                ));
                
                toast.success(`Issue ${status === 'resolved' ? 'resolved' : status === 'rejected' ? 'rejected' : 'updated'} successfully`);
            } else {
                throw new Error('No issue data returned from server');
            }
            
        } catch (error: any) {
            console.error('Error updating issue status:', error);
            console.error('Error response:', error.response?.data);
            
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.details || 
                               error.message || 
                               'Unknown error occurred';
            
            toast.error(`Failed to update issue status: ${errorMessage}`);
        } finally {
            setStatusUpdating(null);
        }
    };    const deleteIssue = async (issueId: number) => {
        if (!confirm('Are you sure you want to delete this issue?')) return;

        try {
            console.log(`Deleting issue ${issueId}`);
            const response = await apiClient.delete(`/api/issues/${issueId}`);
            console.log('Delete response:', response.data);
            
            toast.success('Issue deleted successfully');
            
            // Update local state immediately
            setIssues(prevIssues => prevIssues.filter(issue => issue.id !== issueId));
            
        } catch (error: any) {
            console.error('Error deleting issue:', error);
            console.error('Error response:', error.response?.data);
            
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.details || 
                               error.message || 
                               'Unknown error occurred';
            
            toast.error(`Failed to delete issue: ${errorMessage}`);
        }
    };

    const filteredIssues = issues.filter(issue => {
        const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
        const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-warning-100 text-warning-800';
            case 'in_review': return 'bg-blue-100 text-blue-800';
            case 'resolved': return 'bg-success-100 text-success-800';
            case 'rejected': return 'bg-error-100 text-error-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'text-green-600';
            case 'medium': return 'text-yellow-600';
            case 'high': return 'text-orange-600';
            case 'critical': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const canManageIssues = user?.role === 'admin' || user?.role === 'manager';

    return (
        <DashboardLayout title="Issues Management">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Issues Management</h1>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Report Issue
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search issues..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                aria-label="Filter issues by status"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in_review">In Review</option>
                                <option value="resolved">Resolved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Issues Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Issues ({filteredIssues.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                            </div>
                        ) : filteredIssues.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
                                <p className="text-gray-500">
                                    {searchTerm || filterStatus !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'No issues have been reported yet'
                                    }
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Reporter</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredIssues.map((issue) => (
                                        <TableRow key={issue.id}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <p className="font-medium">{issue.title}</p>
                                                    <p className="text-sm text-gray-500 truncate max-w-xs">
                                                        {issue.description}
                                                    </p>
                                                </div>
                                            </TableCell>                                            <TableCell>
                                                <span className="capitalize">{(issue.issue_type || issue.type || 'other').replace('_', ' ')}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Flag className={`h-4 w-4 ${getPriorityColor(issue.priority)}`} />
                                            </TableCell>
                                            <TableCell>
                                                {/* Ensure issue.status is defined before calling replace */}
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status || '')}`}>
                                                    {issue.status ? issue.status.replace('_', ' ') : 'Unknown Status'}
                                                </span>
                                            </TableCell>
                                            <TableCell>{issue.user_name}</TableCell>
                                            <TableCell>{formatDate(issue.created_at)}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setSelectedIssue(issue)}
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                    </Button>                                                    {canManageIssues && (
                                                        <>
                                                            {issue.status !== 'resolved' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-success-700 border-success-200 hover:bg-success-50"
                                                                    onClick={() => updateIssueStatus(issue.id, 'resolved')}
                                                                    disabled={statusUpdating === issue.id}
                                                                    title="Mark as resolved"
                                                                >
                                                                    {statusUpdating === issue.id ? (
                                                                        <div className="h-3 w-3 border-2 border-success-700 border-t-transparent rounded-full animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            )}

                                                            {issue.status !== 'rejected' && issue.status !== 'resolved' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-error-700 border-error-200 hover:bg-error-50"
                                                                    onClick={() => updateIssueStatus(issue.id, 'rejected')}
                                                                    disabled={statusUpdating === issue.id}
                                                                    title="Mark as rejected"
                                                                >
                                                                    {statusUpdating === issue.id ? (
                                                                        <div className="h-3 w-3 border-2 border-error-700 border-t-transparent rounded-full animate-spin" />
                                                                    ) : (
                                                                        <XCircle className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}                                                    {user?.role === 'operator' && (issue.user_id === user.id || issue.reporter_id === user.id) && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-warning-700 border-warning-200 hover:bg-warning-50"
                                                            onClick={() => updateIssueStatus(issue.id, 'pending')}
                                                            disabled={statusUpdating === issue.id}
                                                            title="Reopen issue"
                                                        >
                                                            {statusUpdating === issue.id ? (
                                                                <div className="h-3 w-3 border-2 border-warning-700 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Edit className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                    )}

                                                    {(user?.role === 'admin' || (issue.user_id === user?.id || issue.reporter_id === user?.id)) && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-error-700 border-error-200 hover:bg-error-50"
                                                            onClick={() => deleteIssue(issue.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Create Issue Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-medium mb-4">Report New Issue</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title *
                                    </label>
                                    <Input
                                        value={newIssue.title}
                                        onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                                        placeholder="Brief description of the issue"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description *
                                    </label>
                                    <textarea
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                        rows={3}
                                        value={newIssue.description}
                                        onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                                        placeholder="Detailed description of the issue"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type
                                    </label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                        value={newIssue.type}
                                        onChange={(e) => setNewIssue({ ...newIssue, type: e.target.value })}
                                        aria-label="Issue type"
                                    >
                                        <option value="data_correction">Data Correction</option>
                                        <option value="system_error">System Error</option>
                                        <option value="feature_request">Feature Request</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                        value={newIssue.priority}
                                        onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                                        aria-label="Issue priority"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Related Record ID (Optional)
                                    </label>
                                    <Input
                                        type="number"
                                        value={newIssue.record_id || ''}
                                        onChange={(e) => setNewIssue({ ...newIssue, record_id: e.target.value ? parseInt(e.target.value) : null })}
                                        placeholder="Enter record ID if issue is related to specific record"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewIssue({
                                            title: '',
                                            description: '',
                                            type: 'data_correction',
                                            priority: 'medium',
                                            record_id: null
                                        });
                                    }}
                                >
                                    Cancel
                                </Button>                                <Button onClick={createIssue}>
                                    Create Issue
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Issue Detail Modal */}
                {selectedIssue && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                            <h3 className="text-lg font-medium mb-4">Issue Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-900">{selectedIssue.title}</h4>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedIssue.status)}`}>
                                            {selectedIssue.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Priority: <span className={getPriorityColor(selectedIssue.priority)}>{selectedIssue.priority}</span>
                                        </span>                                        <span className="text-sm text-gray-500">
                                            Type: {(selectedIssue.issue_type || selectedIssue.type || 'other').replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Description</h5>
                                    <p className="text-gray-600">{selectedIssue.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h5 className="font-medium text-gray-700">Reporter</h5>
                                        <p className="text-gray-600">{selectedIssue.user_name}</p>
                                    </div>
                                    <div>
                                        <h5 className="font-medium text-gray-700">Created</h5>
                                        <p className="text-gray-600">{formatDate(selectedIssue.created_at)}</p>
                                    </div>
                                </div>

                                {selectedIssue.record_id && (
                                    <div>
                                        <h5 className="font-medium text-gray-700">Related Record</h5>
                                        <p className="text-gray-600">Record ID: {selectedIssue.record_id}</p>
                                    </div>
                                )}

                                {selectedIssue.resolved_by_name && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="font-medium text-gray-700">Resolved By</h5>
                                            <p className="text-gray-600">{selectedIssue.resolved_by_name}</p>
                                        </div>
                                        {selectedIssue.resolved_at && (
                                            <div>
                                                <h5 className="font-medium text-gray-700">Resolved At</h5>
                                                <p className="text-gray-600">{formatDate(selectedIssue.resolved_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button variant="outline" onClick={() => setSelectedIssue(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
