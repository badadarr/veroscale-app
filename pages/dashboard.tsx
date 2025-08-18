import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import apiClient from "@/lib/api";
import {
  Scale,
  AlertTriangle,
  TrendingUp,
  AlertCircle,
  Package,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { formatWeight } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

interface SummaryStats {
  totalMaterials: number;
  totalRequests: number;
  totalWeight: number;
  pendingIssues: number;
}

interface DashboardData {
  summaryStats: SummaryStats;
  weightByCategory: { category: string; total_weight: number }[];
  topUsers: {
    id: number;
    name: string;
    record_count: number;
    total_weight: number;
  }[];
  materialsOverview: {
    id: number;
    name: string;
    standard_weight: number;
    usage_count: number;
  }[];
  weightByDay: { day: string; total_weight: number }[];
  reportIssues: {
    id: number;
    title: string;
    description: string;
    status: string;
    created_at: string;
    user_name: string;
  }[];
  systemStatus?: {
    status: string;
    message: string;
    details: string;
    metrics?: {
      criticalIssues: number;
      pendingIssues: number;
      dataAnomalies: number;
    };
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use our API client that automatically includes the auth token
        const { data } = await apiClient.get("/api/dashboard");
        setDashboardData(data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Determine dashboard title based on user role
  const getDashboardTitle = () => {
    if (user?.role === "operator") {
      return "My Dashboard";
    } else if (user?.role === "manager") {
      return "Manager Dashboard";
    } else if (user?.role === "admin") {
      return "Admin Dashboard";
    }
    return "Dashboard";
  };

  if (loading) {
    return (
      <DashboardLayout title={getDashboardTitle()}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title={getDashboardTitle()}>
        <div
          className="relative px-4 py-3 border rounded bg-error-100 border-error-300 text-error-700"
          role="alert"
        >
          <div className="flex">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={getDashboardTitle()}>
      {dashboardData && (
        <div className="space-y-6 animate-slide-up">
          {/* Role-based welcome message */}
          {user?.role === "operator" && (
            <div className="px-4 py-3 text-blue-800 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex">
                <Scale className="h-5 w-5 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Welcome, {user.name}!</p>
                  <p className="text-sm">
                    This dashboard shows your personal weight records and tasks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {user?.role === "manager" && (
            <div className="px-4 py-3 text-green-800 border border-green-200 rounded-lg bg-green-50">
              <div className="flex">
                <TrendingUp className="h-5 w-5 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Manager Overview</p>
                  <p className="text-sm">
                    Monitor team performance and approve weight records across
                    all operations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {user?.role === "admin" && (
            <div className="px-4 py-3 text-purple-800 border border-purple-200 rounded-lg bg-purple-50">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">System Administration</p>
                  <p className="text-sm">
                    Full system access with complete oversight of all operations
                    and data.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card animate={true}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Package className="w-8 h-8 mr-2 text-primary-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {dashboardData.summaryStats.totalMaterials}
                    </p>
                    <p className="text-xs text-gray-500">
                      Available material types
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card animate={true}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {user?.role === "operator"
                    ? "My Records/Month"
                    : "Total Records/Month"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Scale className="w-8 h-8 mr-2 text-secondary-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {dashboardData.summaryStats.totalRequests}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.role === "operator"
                        ? "Your records this month"
                        : "All records this month"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card animate={true}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {user?.role === "operator"
                    ? "My Weight/Month"
                    : "Total Weight/Month"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 mr-2 text-accent-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {formatWeight(dashboardData.summaryStats.totalWeight)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.role === "operator"
                        ? "Your total this month"
                        : "System total this month"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card animate={true}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {user?.role === "operator"
                    ? "My Pending Issues"
                    : "Pending Issues"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircle className="w-8 h-8 mr-2 text-warning-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {dashboardData.summaryStats.pendingIssues}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.role === "operator"
                        ? "Your issues needing attention"
                        : "System issues needing attention"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and tables */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Weight by day chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>
                  {user?.role === "operator"
                    ? "My Weight by Day (kg)"
                    : "Weight by Day (kg)"}
                  {user?.role === "operator" && (
                    <span className="block text-sm font-normal text-gray-500">
                      Your daily weight submissions
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {dashboardData.weightByDay &&
                    Array.isArray(dashboardData.weightByDay) ? (
                      <BarChart
                        data={dashboardData.weightByDay}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`${value} kg`, "Weight"]}
                        />
                        <Bar
                          dataKey="total_weight"
                          fill="#0f6bc3"
                          name="Weight (kg)"
                        />
                      </BarChart>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">
                          {user?.role === "operator"
                            ? "No weight data available. Start recording weights to see your daily progress!"
                            : "No weight data available"}
                        </p>
                      </div>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  System Status
                  {dashboardData.systemStatus?.status === "critical" && (
                    <AlertTriangle className="w-5 h-5 text-error-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-64">
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
                      dashboardData.systemStatus?.status === "critical"
                        ? "bg-error-100 text-error-700"
                        : dashboardData.systemStatus?.status === "warning"
                        ? "bg-warning-100 text-warning-700"
                        : "bg-success-100 text-success-700"
                    }`}
                  >
                    {dashboardData.systemStatus?.status === "critical" ? (
                      <AlertTriangle className="w-8 h-8" />
                    ) : dashboardData.systemStatus?.status === "warning" ? (
                      <AlertCircle className="w-8 h-8" />
                    ) : (
                      <TrendingUp className="w-8 h-8" />
                    )}
                  </div>
                  <p className="text-lg font-medium text-center text-gray-900">
                    {dashboardData.systemStatus?.message ||
                      "All Systems Operational"}
                  </p>
                  <p className="mt-2 text-sm text-center text-gray-500">
                    {dashboardData.systemStatus?.details ||
                      "No issues detected"}
                  </p>
                  {dashboardData.systemStatus?.metrics && (
                    <div className="grid grid-cols-3 gap-2 mt-4 text-xs text-gray-600">
                      <div className="text-center">
                        <div className="font-semibold">
                          {dashboardData.systemStatus.metrics.criticalIssues}
                        </div>
                        <div>Critical</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">
                          {dashboardData.systemStatus.metrics.pendingIssues}
                        </div>
                        <div>Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">
                          {dashboardData.systemStatus.metrics.dataAnomalies}
                        </div>
                        <div>Anomalies</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Materials Overview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                Materials Overview
                {user?.role === "operator" && (
                  <span className="block text-sm font-normal text-gray-500">
                    Available materials for weight recording
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Standard Weight (kg)</TableHead>
                    <TableHead>
                      {user?.role === "operator"
                        ? "My Usage Count"
                        : "Usage Count"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.materialsOverview?.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 mr-2 rounded-full bg-primary-100 text-primary-700">
                            <Package className="w-4 h-4" />
                          </div>
                          {material.name}
                        </div>
                      </TableCell>
                      <TableCell>{material.standard_weight}</TableCell>
                      <TableCell>{material.usage_count}</TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-gray-500"
                      >
                        No materials data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  {user?.role === "operator"
                    ? "Showing materials and your usage statistics"
                    : "Showing system-wide material usage statistics"}
                </div>
                <div className="flex space-x-2">
                  {user?.role === "operator" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push("/samples")}
                    >
                      View All Materials
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/samples")}
                      >
                        Manage Materials
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
