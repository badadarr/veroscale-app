import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import apiClient from '@/lib/api';
import {
  Scale,
  Clipboard,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Package
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { formatDate, formatWeight } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

interface SummaryStats {
  totalSamples: number;
  totalRecords: number;
  totalWeight: number;
  pendingRecords: number;
}

interface DashboardData {
  summaryStats: SummaryStats;
  recentRecords: any[];
  weightByCategory: { category: string; total_weight: number }[];
  topUsers: { id: number; name: string; record_count: number; total_weight: number }[];
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use our API client that automatically includes the auth token
        const { data } = await apiClient.get('/api/dashboard');
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="bg-error-100 border border-error-300 text-error-700 px-4 py-3 rounded relative" role="alert">
          <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      {dashboardData && (
        <div className="space-y-6 animate-slide-up">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card animate={true}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Samples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clipboard className="h-8 w-8 text-primary-600 mr-2" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardData.summaryStats.totalSamples}</p>
                    <p className="text-xs text-gray-500">Material samples recorded</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card animate={true}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Weight Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Scale className="h-8 w-8 text-secondary-600 mr-2" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardData.summaryStats.totalRecords}</p>
                    <p className="text-xs text-gray-500">Total measurements</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card animate={true}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-accent-600 mr-2" />
                  <div>
                    <p className="text-2xl font-bold">{formatWeight(dashboardData.summaryStats.totalWeight)}</p>
                    <p className="text-xs text-gray-500">Cumulative weight</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card animate={true}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pending Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-warning-600 mr-2" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardData.summaryStats.pendingRecords}</p>
                    <p className="text-xs text-gray-500">Awaiting approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weight by category chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Weight by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardData.weightByCategory}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} kg`, 'Weight']} />
                      <Bar dataKey="total_weight" fill="#0f6bc3" name="Weight (kg)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top users */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Top Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Total Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.topUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.record_count}</TableCell>
                        <TableCell>{formatWeight(user.total_weight)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Recent weight records */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Weight Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recentRecords.map((record) => (
                    <TableRow key={record.record_id}>
                      <TableCell className="font-medium">#{record.record_id}</TableCell>
                      <TableCell>{record.item_name}</TableCell>
                      <TableCell>{record.user_name}</TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Materials Overview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Materials Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Standard Weight (kg)</TableHead>
                    <TableHead>Usage Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Showing sample data - this should be fetched from API */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-2">
                          <Package className="h-4 w-4" />
                        </div>
                        Steel Bar
                      </div>
                    </TableCell>
                    <TableCell>5.75</TableCell>
                    <TableCell>48</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-2">
                          <Package className="h-4 w-4" />
                        </div>
                        Aluminum Sheet
                      </div>
                    </TableCell>
                    <TableCell>2.30</TableCell>
                    <TableCell>36</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-2">
                          <Package className="h-4 w-4" />
                        </div>
                        Copper Wire
                      </div>
                    </TableCell>
                    <TableCell>1.25</TableCell>
                    <TableCell>22</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                {/* Only show the "View All Materials" button for admin and manager roles */}
                {user?.role !== 'operator' ? (
                  <Button size="sm" variant="outline" onClick={() => router.push('/materials')}>
                    View All Materials
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => router.push('/operator-guide')}>
                    View Operator Guide
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}