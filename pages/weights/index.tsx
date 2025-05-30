import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import StatusInfoCard from '@/components/ui/StatusInfoCard';
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
}

export default function WeightRecords() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchWeightRecords();
  }, []);  // Function to fetch weight records from API
  const fetchWeightRecords = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/weights');
      const data = response.data;

      if (data.records && Array.isArray(data.records)) {
        setRecords(data.records.map((record: any) => ({
          id: record.record_id || record.id,
          item_name: record.item_name || 'Unknown Item',
          total_weight: record.total_weight || 0,
          timestamp: record.timestamp || new Date().toISOString(),
          status: record.status || 'pending',
          user_name: record.user_name || 'Unknown User'
        })));
      } else {
        console.warn('No records found or invalid format:', data);
        setRecords([]);
      }
    } catch (error: any) {
      console.error('Error fetching weight records:', error);
      
      if (error.response?.status === 500) {
        toast.error('Server error while loading records. Please try again.');
      } else if (error.response?.status === 401) {
        toast.error('Unauthorized. Please login again.');
      } else {
        toast.error('Failed to load weight records');
      }
      
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };// Function to update weight record status
  const updateRecordStatus = async (recordId: number, status: 'approved' | 'rejected' | 'pending') => {
    setStatusUpdating(recordId);
    
    try {
      const response = await apiClient.put(`/api/weights/${recordId}`, { status });
      const data = response.data;

      toast.success(`Record status updated to ${status}`);
      
      // Update local state with the returned record data
      setRecords(records.map(record => {
        if (record.id === recordId) {
          return { 
            ...record, 
            status,
            // Update with additional data from response if available
            ...(data.record && {
              user_name: data.record.user_name || record.user_name,
              item_name: data.record.item_name || record.item_name
            })
          };
        }
        return record;
      }));
      
    } catch (error: any) {
      console.error('Error updating record status:', error);
      
      // Check if the update might have succeeded but the response failed
      if (error.response?.status === 500) {
        // Show a different message and try to refresh the data
        toast.error('Update may have succeeded but response failed. Refreshing data...');
        
        // Optimistically update the local state
        setRecords(records.map(record =>
          record.id === recordId ? { ...record, status } : record
        ));
        
        // Try to refresh the data to get the latest state
        setTimeout(() => {
          fetchWeightRecords();
        }, 1000);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to update status';
        toast.error(errorMessage);
      }
    } finally {
      setStatusUpdating(null);
    }
  };

  // Determine if the user can change status
  const canChangeStatus = user?.role === 'admin' || user?.role === 'manager';
  return (
    <DashboardLayout title="Weight Records">
      <div className="space-y-6">
        <StatusInfoCard role={user?.role} />

        <Card>          <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Recent Weight Records</CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Showing last 24 hours
              </div>
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
                  <TableRow>                    <TableHead>ID</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Operator</TableHead>
                    {canChangeStatus && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
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
                      <TableCell>{record.user_name}</TableCell>
                      {canChangeStatus && (                        <TableCell>
                          <div className="flex space-x-2">
                            {record.status !== 'approved' && (
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
                            )}

                            {record.status !== 'pending' && record.status !== 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-2 py-1 h-8 text-xs text-warning-700 border-warning-200 hover:bg-warning-50"
                                onClick={() => updateRecordStatus(record.id, 'pending')}
                                disabled={statusUpdating === record.id}
                              >
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                Pending
                              </Button>
                            )}

                            {record.status !== 'rejected' && record.status !== 'approved' && (
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
