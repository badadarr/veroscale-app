import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import StatusInfoCard from '@/components/ui/StatusInfoCard';
import IoTWeightHistory from '@/components/ui/IoTWeightHistory';
import { formatDate, formatWeight } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api';

interface WeightRecord {
  id: number;
  item_name: string;
  total_weight: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  user_name: string;
  batch_number?: string;
  unit?: string;
  source?: string;
  destination?: string;
  notes?: string;
}

export default function WeightRecords() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [filteredRecords, setFilteredRecords] = useState<WeightRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchWeightRecords();
  }, []);

  useEffect(() => {
    if (batchFilter) {
      setFilteredRecords(
        records.filter(record => 
          record.batch_number?.toLowerCase().includes(batchFilter.toLowerCase()) ||
          record.item_name.toLowerCase().includes(batchFilter.toLowerCase()) ||
          record.notes?.toLowerCase().includes(batchFilter.toLowerCase())
        )
      );
    } else {
      setFilteredRecords(records);
    }
  }, [records, batchFilter]);
  // Function to fetch weight records from API
  const fetchWeightRecords = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/weights');
      const data = response.data;

      if (data.records) {
        setRecords(data.records.map((record: any) => ({
          id: record.record_id || record.id,
          item_name: record.item_name,
          total_weight: record.total_weight,
          timestamp: record.timestamp,
          status: record.status,
          user_name: record.user_name,
          batch_number: record.batch_number,
          unit: record.unit || 'kg',
          source: record.source,
          destination: record.destination,
          notes: record.notes
        })));
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Error fetching weight records:', error);
      toast.error('Failed to load weight records');
    } finally {
      setLoading(false);
    }
  };
  // Function to update weight record status
  const updateRecordStatus = async (recordId: number, status: 'approved' | 'rejected' | 'pending') => {
    setStatusUpdating(recordId);
    try {
      const response = await apiClient.put(`/api/weights/${recordId}`, { status });
      const data = response.data;

      toast.success(`Record status updated to ${status}`);
      // Update local state
      setRecords(records.map(record =>
        record.id === recordId ? { ...record, status } : record
      ));
    } catch (error: any) {
      console.error('Error updating record status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update status';
      toast.error(errorMessage);
    } finally {
      setStatusUpdating(null);
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredRecords.map(record => record.id));
    } else {
      setSelectedRecords([]);
    }
  };

  // Handle individual checkbox
  const handleSelectRecord = (recordId: number, checked: boolean) => {
    if (checked) {
      setSelectedRecords([...selectedRecords, recordId]);
    } else {
      setSelectedRecords(selectedRecords.filter(id => id !== recordId));
    }
  };

  // Handle multiple delete
  const handleMultipleDelete = async () => {
    if (selectedRecords.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedRecords.length} record(s)?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/weights', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ record_ids: selectedRecords }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete records');
      }
      
      toast.success(`Successfully deleted ${selectedRecords.length} record(s)`);
      setSelectedRecords([]);
      fetchWeightRecords();
    } catch (error: any) {
      console.error('Error deleting records:', error);
      toast.error('Failed to delete records');
    } finally {
      setDeleting(false);
    }
  };

  // Determine if the user can change status
  const canChangeStatus = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';
  return (
    <DashboardLayout title="Weight Records">
      <div className="space-y-6">
        <StatusInfoCard role={user?.role} />
        
        <IoTWeightHistory />

        <Card>          <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Recent Weight Records</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search batch, item, or notes..."
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="w-64"
                />
              </div>
              <div className="text-sm text-gray-500">
                Showing {filteredRecords.length} records
              </div>
              {canDelete && selectedRecords.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMultipleDelete}
                  disabled={deleting}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {deleting ? 'Deleting...' : `Delete ${selectedRecords.length}`}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchWeightRecords}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {canDelete && (
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                    )}
                    <TableHead>ID</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Operator</TableHead>
                    {canChangeStatus && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      {canDelete && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.id)}
                            onChange={(e) => handleSelectRecord(record.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">#{record.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.item_name}</div>
                          {record.notes && (
                            <div className="text-xs text-gray-500">{record.notes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.total_weight} {record.unit}</div>
                          {(record.source || record.destination) && (
                            <div className="text-xs text-gray-500">
                              {record.source && `From: ${record.source}`}
                              {record.source && record.destination && ' → '}
                              {record.destination && `To: ${record.destination}`}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.batch_number ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            {record.batch_number}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Single</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(record.timestamp)}</TableCell>
                      <TableCell>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'approved' ? 'bg-success-100 text-success-800' :
                            record.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                              'bg-error-100 text-error-800'
                            }`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                          {(record.status === 'approved' || record.status === 'rejected') && (
                            <div className="text-xs text-gray-500 mt-1">
                              {record.approved_at && formatDate(record.approved_at)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{record.user_name}</TableCell>
                      {canChangeStatus && (
                        <TableCell>
                          <div className="flex space-x-2">
                            {record.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="px-2 py-1 h-8 text-xs text-success-700 border-success-200 hover:bg-success-50"
                                  onClick={() => updateRecordStatus(record.id, 'approved')}
                                  disabled={statusUpdating === record.id}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="px-2 py-1 h-8 text-xs text-error-700 border-error-200 hover:bg-error-50"
                                  onClick={() => updateRecordStatus(record.id, 'rejected')}
                                  disabled={statusUpdating === record.id}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {record.status === 'approved' && (
                              <span className="text-xs text-success-600 font-medium">
                                ✓ Approved
                              </span>
                            )}
                            {record.status === 'rejected' && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-error-600 font-medium">
                                  ✗ Rejected
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="px-2 py-1 h-6 text-xs text-warning-700 border-warning-200 hover:bg-warning-50"
                                  onClick={() => updateRecordStatus(record.id, 'pending')}
                                  disabled={statusUpdating === record.id}
                                  title="Reopen for review"
                                >
                                  Reopen
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
