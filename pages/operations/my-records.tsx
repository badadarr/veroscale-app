import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ClipboardList, Search, Calendar, Filter, X, AlertTriangle, Eye, Flag } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate, formatWeight } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';

interface WeightRecord {
    id: number;
    item_name: string;
    total_weight: number;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
    source?: string;
    destination?: string;
    batch_number?: string;
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
    const [issueDescription, setIssueDescription] = useState('');

    // Mock data for demonstration
    const mockRecords: WeightRecord[] = [
        {
            id: 1,
            item_name: "Metal Sheet",
            total_weight: 125.5,
            timestamp: "2025-05-27T09:30:00",
            status: "approved",
            source: "Warehouse A",
            destination: "Production Line 1",
            batch_number: "B2025-05-01"
        },
        {
            id: 2,
            item_name: "Steel Rod Bundle",
            total_weight: 355.0,
            timestamp: "2025-05-27T10:15:00",
            status: "pending",
            source: "Supplier XYZ",
            destination: "Warehouse B"
        },
        {
            id: 3,
            item_name: "Concrete Block",
            total_weight: 227.3,
            timestamp: "2025-05-26T11:00:00",
            status: "rejected",
            source: "Construction Site",
            destination: "Recycling Center",
            batch_number: "B2025-05-02"
        },
        {
            id: 4,
            item_name: "Metal Sheet",
            total_weight: 130.2,
            timestamp: "2025-05-26T14:20:00",
            status: "approved",
            source: "Warehouse A",
            destination: "Production Line 2"
        },
        {
            id: 5,
            item_name: "Sand Bag",
            total_weight: 30.0,
            timestamp: "2025-05-25T09:10:00",
            status: "approved",
            source: "Supplier ABC",
            destination: "Construction Site"
        },
        {
            id: 6,
            item_name: "Gravel Container",
            total_weight: 18.3,
            timestamp: "2025-05-25T11:30:00",
            status: "pending",
            source: "Quarry",
            destination: "Warehouse C"
        }
    ];

    // Load user's records on component mount
    useEffect(() => {
        const fetchRecords = async () => {
            setLoading(true);
            try {
                // In production, use real API call
                // const response = await apiClient.get('/api/weights', {
                //   params: { user_id: user?.id }
                // });
                // setRecords(response.data.records);

                // For demo, use mock data with a simulated delay
                setTimeout(() => {
                    setRecords(mockRecords);
                    setFilteredRecords(mockRecords);
                    setLoading(false);
                }, 1000);
            } catch (error) {
                console.error('Error fetching records:', error);
                setLoading(false);
            }
        };

        fetchRecords();
    }, []);

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
    };

    // Handle submitting issue report
    const handleSubmitIssue = async () => {
        if (!selectedRecord || !issueType || !issueDescription) {
            return;
        }

        try {
            // In production, use real API call
            // await apiClient.post('/api/issues', {
            //   record_id: selectedRecord.id,
            //   issue_type: issueType,
            //   description: issueDescription,
            //   user_id: user?.id
            // });

            // For demo, just close the modal and show success
            setTimeout(() => {
                handleCloseReportModal();
                handleCloseDetails();
                // In a real implementation, you would show a success message
            }, 1000);
        } catch (error) {
            console.error('Error reporting issue:', error);
        }
    };

    // Reset all filters
    const resetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setStartDate('');
        setEndDate('');
    };

    return (
        <DashboardLayout title="My Records">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">My Weight Records</h1>
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
                                </Button>
                                {selectedRecord.status !== 'rejected' && (
                                    <Button
                                        variant="secondary"
                                        onClick={handleOpenReportModal}
                                    >
                                        <Flag className="h-4 w-4 mr-1" />
                                        Report Issue
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Report Issue Modal */}
                {isReportModalOpen && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                            <div className="flex justify-between items-start p-4 border-b">
                                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                    <AlertTriangle className="h-5 w-5 mr-2 text-warning-500" />
                                    Report Issue
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
                                    </label>
                                    <select
                                        value={issueType}
                                        onChange={(e) => setIssueType(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        title="Select issue type"
                                        required
                                    >
                                        <option value="">Select Issue Type</option>
                                        <option value="incorrect_weight">Incorrect Weight</option>
                                        <option value="wrong_material">Wrong Material</option>
                                        <option value="duplicate_entry">Duplicate Entry</option>
                                        <option value="wrong_batch">Wrong Batch Number</option>
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
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={handleSubmitIssue}
                                    disabled={!issueType || !issueDescription}
                                >
                                    Submit Report
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
