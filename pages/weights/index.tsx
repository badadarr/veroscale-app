import React from 'react';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import StatusInfoCard from '@/components/ui/StatusInfoCard';
import IoTWeightHistory from '@/components/ui/IoTWeightHistory';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api';

interface WeightRecord {
  id: number;
  item_name: string;
  total_weight: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  user_name?: string;
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
  const [filteredRecords, setFilteredRecords] = useState<WeightRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  
  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    // Fetch records
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/weights');
        if (response.data.records) {
          setRecords(response.data.records);
          setFilteredRecords(response.data.records);
        }
      } catch (error) {
        console.error('Error fetching records:', error);
        toast.error('Failed to load records');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecords();
  }, []);

  return (
    <DashboardLayout title="Weight Records">
      <div className="space-y-6">
        <StatusInfoCard role={user?.role} />
        
        <IoTWeightHistory />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Weight Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>#{record.id}</TableCell>
                        <TableCell>{record.item_name}</TableCell>
                        <TableCell>{record.total_weight} {record.unit || 'kg'}</TableCell>
                        <TableCell>{formatDate(record.timestamp)}</TableCell>
                        <TableCell>{record.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={handlePageChange} 
                  className="mt-4" 
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}