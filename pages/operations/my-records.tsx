import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { ClipboardList, Search, Calendar, Filter, X, AlertTriangle, Eye, Flag } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import StatusInfoCard from '@/components/ui/StatusInfoCard';
import { formatDate, formatWeight } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';


interface WeightRecord {
    id: number;
    record_id: number;
    user_id: number;
    sample_id?: number;
    item_id?: number;
    item_name: string;
    total_weight: number;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
    source?: string;
    destination?: string;
    notes?: string;
    unit?: string;
    approved_by?: number;
    approved_at?: string;
    created_at?: string;
    user_name?: string;
    approved_by_name?: string;
    batch_number?: string; // Keep this for potential future use or if added later
}

export default function MyRecords() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<WeightRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<WeightRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<WeightRecord | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [issueType, setIssueType] = useState('');
    const [issueDescription, setIssueDescription] = useState('');    // Load user's records on component mount
    useEffect(() => {
        const fetchRecords = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // For operators, the API will automatically filter to their records
                // For admin/manager, they can see all records
                const endpoint = '/api/weights?limit=50';

                const response = await apiClient.get(endpoint);
                const fetchedRecords = response.data.records || [];

                // Map API data to match the expected WeightRecord interface
                const mappedRecords: WeightRecord[] = fetchedRecords.map((record: any) => ({
                    id: record.record_id || record.id,
                    record_id: record.record_id || record.id,
                    user_id: record.user_id || 0,
                    sample_id: record.sample_id,
                    item_id: record.item_id,
                    item_name: record.item_name || 'Unknown Item',
                    total_weight: record.total_weight || 0,
                    timestamp: record.timestamp || record.created_at || new Date().toISOString(),
                    status: record.status || 'pending',
                    source: record.source,
                    destination: record.destination,
                    notes: record.notes,
                    unit: record.unit || 'kg',
                    approved_by: record.approved_by,
                    approved_at: record.approved_at,
                    created_at: record.created_at,
                    user_name: record.user_name,
                    approved_by_name: record.approved_by_name,
                    batch_number: record.batch_number
                }));

                setRecords(mappedRecords);
                setFilteredRecords(mappedRecords);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching records:', error);
                toast.error('Failed to load weight records');
                // Fallback to empty array instead of mock data
                setRecords([]);
                setFilteredRecords([]);
                setLoading(false);
            }
        };

        fetchRecords();
    }, [user?.id, user?.role]); // Add user.role as dependency to refetch when user changes

    // Filter records based on search term and filters
    useEffect(() => {
        let filtered = [...records];

        // Filter by search term (material name)
        if (searchTerm) {
            filtered = filtered.filter(record =>
                record.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (record.batch_number && record.batch_number.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Filter by status
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(record => record.status === selectedStatus);
        }

        // Filter by date range
        if (startDate) {
            filtered = filtered.filter(record =>
                new Date(record.timestamp) >= new Date(startDate)
            );
        }

        if (endDate) {
            filtered = filtered.filter(record =>
                new Date(record.timestamp) <= new Date(endDate + 'T23:59:59')
            );
        }

        setFilteredRecords(filtered);
    }, [records, searchTerm, selectedStatus, startDate, endDate]);

    // Handle view record details
    const handleViewRecord = (record: WeightRecord) => {
        setSelectedRecord(record);
    };

    // Handle closing record details
    const handleCloseDetails = () => {
        setSelectedRecord(null);
    };

    // Handle opening report issue modal
    const handleOpenReportModal = () => {
        setIsReportModalOpen(true);
    };

    // Handle closing report issue modal
    const handleCloseReportModal = () => {
        setIsReportModalOpen(false);
        setIssueType('');
        setIssueDescription('');
    };    // Handle submitting issue report
    const handleSubmitIssue = async () => {
        if (!selectedRecord || !issueType || !issueDescription) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            console.log('Submitting issue with data:', {
                title: `Issue with record #${selectedRecord.id}: ${issueType}`,
                description: issueDescription,
                issue_type: issueType,
                priority: 'medium',
                record_id: selectedRecord.id
            });

            // Use real API call
            await apiClient.post('/api/issues', {
                title: `Issue with record #${selectedRecord.id}: ${issueType}`,
                description: issueDescription,
                issue_type: issueType,
                priority: 'medium',
                record_id: selectedRecord.id
            });

            toast.success('Issue reported successfully');
            handleCloseReportModal();
            handleCloseDetails();
        } catch (error: any) {
            console.error('Error reporting issue:', error);
            console.error('Error response:', error.response?.data);

            const errorMessage = error.response?.data?.error ||
                error.response?.data?.details ||
                error.message ||
                'Failed to report issue';

            toast.error(`Failed to report issue: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };


    // Reset all filters
    const resetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setStartDate('');
        setEndDate('');
    }; return (
        <DashboardLayout title="My Records">
            <div className="max-w-6xl mx-auto">
                <StatusInfoCard role={user?.role} />                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">
                        {user?.role === 'operator' ? 'My Weight Records' : 'All Weight Records'}
                    </h1>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            size="sm"
                        >
                            {showFilters ? <X className="h-4 w-4 mr-1" /> : <Filter className="h-4 w-4 mr-1" />}
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => router.push('/operations/weight-entry')}
                            size="sm"
                        >
                            Add New Record
                        </Button>
                    </div>
                </div>

                <Card className="shadow-md mb-6">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <CardTitle className="flex items-center text-primary-800 mb-2 md:mb-0">
                                <ClipboardList className="h-5 w-5 mr-2" />
                                Weight Records
                            </CardTitle>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search by material or batch..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 w-full md:w-64"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    {showFilters && (
                        <div className="px-6 pb-3">
                            <div className="p-3 bg-gray-50 rounded-md">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-300 rounded-md"
                                            aria-label="Filter by status"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            From Date
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="pl-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            To Date
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="pl-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={resetFilters}
                                        >
                                            Reset Filters
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                            </div>
                        ) : filteredRecords.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                    <ClipboardList className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No records found</h3>
                                <p className="text-gray-500">
                                    {searchTerm || selectedStatus !== 'all' || startDate || endDate ?
                                        'Try adjusting your filters to see more results.' :
                                        'You haven\'t recorded any weights yet. Start by adding a new record.'}
                                </p>
                                {(searchTerm || selectedStatus !== 'all' || startDate || endDate) && (
                                    <Button
                                        variant="outline"
                                        onClick={resetFilters}
                                        className="mt-4"
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Material</TableHead>
                                        <TableHead>Weight</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRecords.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">#{record.id}</TableCell>
                                            <TableCell>{record.item_name}</TableCell>
                                            <TableCell>{formatWeight(record.total_weight)}</TableCell>
                                            <TableCell>{formatDate(record.timestamp)}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'approved' ? 'bg-success-100 text-success-800' :
                                                    record.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                                                        'bg-error-100 text-error-800'
                                                    }`}>
                                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewRecord(record)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Record Details Modal */}
                {selectedRecord && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start p-4 border-b">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    Record #{selectedRecord.id} Details
                                </h3>
                                <button
                                    onClick={handleCloseDetails}
                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                                    title="Close details"
                                    aria-label="Close details"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Material</p>
                                        <p className="text-lg font-semibold">{selectedRecord.item_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Weight</p>
                                        <p className="text-lg font-semibold">{formatWeight(selectedRecord.total_weight)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Date & Time</p>
                                        <p className="font-medium">{formatDate(selectedRecord.timestamp)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedRecord.status === 'approved' ? 'bg-success-100 text-success-800' :
                                            selectedRecord.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                                                'bg-error-100 text-error-800'
                                            }`}>
                                            {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                                        </span>
                                    </div>
                                    {selectedRecord.batch_number && (
                                        <div>
                                            <p className="text-sm text-gray-500">Batch Number</p>
                                            <p className="font-medium">{selectedRecord.batch_number}</p>
                                        </div>
                                    )}
                                    {selectedRecord.source && (
                                        <div>
                                            <p className="text-sm text-gray-500">Source</p>
                                            <p className="font-medium">{selectedRecord.source}</p>
                                        </div>
                                    )}
                                    {selectedRecord.destination && (
                                        <div>
                                            <p className="text-sm text-gray-500">Destination</p>
                                            <p className="font-medium">{selectedRecord.destination}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 border-t border-gray-200">
                                <Button
                                    variant="outline"
                                    onClick={handleCloseDetails}
                                >
                                    Close
                                </Button>                                {selectedRecord.status !== 'rejected' && (
                                    <Button
                                        variant="secondary"
                                        onClick={handleOpenReportModal}
                                    >
                                        <Flag className="h-4 w-4 mr-1" />
                                        Notify Issue
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}                {/* Notify Issue Modal */}
                {isReportModalOpen && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                            <div className="flex justify-between items-start p-4 border-b">                                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2 text-warning-500" />
                                Notify Issue
                            </h3>
                                <button
                                    onClick={handleCloseReportModal}
                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                                    title="Close report modal"
                                    aria-label="Close report modal"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Issue Type *
                                    </label>                                    <select
                                        value={issueType}
                                        onChange={(e) => setIssueType(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        title="Select issue type"
                                        required
                                    >
                                        <option value="">Select Issue Type</option>
                                        <option value="data_correction">Data Correction</option>
                                        <option value="system_error">System Error</option>
                                        <option value="feature_request">Feature Request</option>
                                        <option value="other">Other Issue</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description *
                                    </label>
                                    <textarea
                                        value={issueDescription}
                                        onChange={(e) => setIssueDescription(e.target.value)}
                                        rows={4}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Please provide details about the issue..."
                                        required
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex items-center justify-end p-6 border-t border-gray-200">
                                <Button
                                    variant="outline"
                                    onClick={handleCloseReportModal}
                                    className="mr-2"
                                >
                                    Cancel
                                </Button>                                <Button
                                    variant="default"
                                    onClick={handleSubmitIssue}
                                    disabled={!issueType || !issueDescription}
                                >
                                    Submit Issue
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
