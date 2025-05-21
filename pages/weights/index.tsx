import { useState } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { formatDate, formatWeight } from '@/lib/utils';

interface WeightRecord {
  id: number;
  item_name: string;
  total_weight: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  user_name: string;
}

export default function WeightRecords() {
  const [loading] = useState(false);
  
  // Dummy data for demonstration
  const records: WeightRecord[] = [
    {
      id: 1,
      item_name: "Metal Sheet",
      total_weight: 125.5,
      timestamp: "2025-05-21T09:30:00",
      status: "approved",
      user_name: "John Doe"
    },
    {
      id: 2,
      item_name: "Steel Rod Bundle",
      total_weight: 355.0,
      timestamp: "2025-05-21T10:15:00",
      status: "pending",
      user_name: "Jane Smith"
    },
    {
      id: 3,
      item_name: "Concrete Block",
      total_weight: 227.3,
      timestamp: "2025-05-21T11:00:00",
      status: "rejected",
      user_name: "Mike Johnson"
    }
  ];

  return (
    <DashboardLayout title="Weight Records">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Recent Weight Records</CardTitle>
              <div className="text-sm text-gray-500">
                Showing last 24 hours
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
                    <TableHead>ID</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Operator</TableHead>
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'approved' ? 'bg-success-100 text-success-800' :
                          record.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                          'bg-error-100 text-error-800'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{record.user_name}</TableCell>
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
