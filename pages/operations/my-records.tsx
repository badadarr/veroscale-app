import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { ClipboardList, Search, Calendar, Filter, X, Eye } from "lucide-react";
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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import StatusInfoCard from "@/components/ui/StatusInfoCard";
import { formatDate, formatWeight } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api";
import WeightRecordDetailModal from "@/components/ui/WeightRecordDetailModal";

interface WeightRecord {
  id: number;
  record_id: number;
  user_id: number;
  sample_id?: number;
  item_id?: number;
  item_name: string;
  total_weight: number;
  iot_weight?: number;
  manager_weight?: number;
  weight_variance?: number;
  weight_variance_percentage?: number;
  variance_status?: "normal" | "warning" | "critical";
  iot_device_id?: string;
  verification_required?: boolean;
  timestamp: string;
  status: "auto_approved" | "auto_rejected" | "processed";
  source?: string;
  destination?: string;
  notes?: string;
  unit?: string;
  approved_by?: number;
  approved_at?: string;
  created_at?: string;
  user_name?: string;
  approved_by_name?: string;
  quantity?: number;
  variance_amount?: number;
  variance_percentage?: number;
}

export default function MyRecords() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<WeightRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WeightRecord | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load user's records on component mount
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
        const endpoint = "/api/weights?limit=50";

        const response = await apiClient.get(endpoint);
        const fetchedRecords = response.data.records || [];

        // Map API data to match the expected WeightRecord interface
        type APIWeightRecord = {
          record_id?: number;
          id?: number;
          user_id?: number;
          sample_id?: number;
          item_id?: number;
          item_name?: string;
          total_weight?: number;
          iot_weight?: number;
          manager_weight?: number;
          weight_variance?: number;
          weight_variance_percentage?: number;
          variance_status?: "normal" | "warning" | "critical" | string;
          iot_device_id?: string;
          verification_required?: boolean;
          timestamp?: string;
          created_at?: string;
          status?: "auto_approved" | "auto_rejected" | "processed" | string;
          source?: string;
          destination?: string;
          notes?: string;
          unit?: string;
          approved_by?: number;
          approved_at?: string;
          user_name?: string;
          approved_by_name?: string;
          quantity?: number;
          variance_amount?: number;
          variance_percentage?: number;
        };

        const mappedRecords: WeightRecord[] = fetchedRecords.map(
          (record: APIWeightRecord) => ({
            id: record.record_id || record.id,
            record_id: record.record_id || record.id,
            user_id: record.user_id || 0,
            sample_id: record.sample_id,
            item_id: record.item_id,
            item_name: record.item_name || "Unknown Item",
            total_weight: record.total_weight || 0,
            iot_weight: record.iot_weight,
            manager_weight: record.manager_weight,
            weight_variance: record.weight_variance,
            weight_variance_percentage: record.weight_variance_percentage,
            variance_status: record.variance_status,
            iot_device_id: record.iot_device_id,
            verification_required: record.verification_required,
            timestamp:
              record.timestamp || record.created_at || new Date().toISOString(),
            status: record.status || "processed",
            source: record.source,
            destination: record.destination,
            notes: record.notes,
            unit: record.unit || "kg",
            approved_by: record.approved_by,
            approved_at: record.approved_at,
            created_at: record.created_at,
            user_name: record.user_name,
            approved_by_name: record.approved_by_name,
            quantity: record.quantity,
            variance_amount: record.variance_amount,
            variance_percentage: record.variance_percentage,
          })
        );

        setRecords(mappedRecords);
        setFilteredRecords(mappedRecords);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching records:", error);
        toast.error("Failed to load weight records");
        setRecords([]);
        setFilteredRecords([]);
        setLoading(false);
      }
    };

    fetchRecords();
  }, [user?.id, user?.role]);

  // Filter records based on search term and filters
  useEffect(() => {
    let filtered = [...records];

    // Filter by search term (material name)
    if (searchTerm) {
      filtered = filtered.filter((record) =>
        record.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((record) => record.status === selectedStatus);
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(
        (record) => new Date(record.timestamp) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (record) =>
          new Date(record.timestamp) <= new Date(endDate + "T23:59:59")
      );
    }

    setFilteredRecords(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [records, searchTerm, selectedStatus, startDate, endDate]);

  // Handle view record details
  const handleViewRecord = (record: WeightRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  // Handle closing record details
  const handleCloseDetails = () => {
    setSelectedRecord(null);
    setIsDetailModalOpen(false);
  };

  // Issue reporting functionality removed

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <DashboardLayout title="My Records">
      <div className="max-w-6xl mx-auto">
        <StatusInfoCard role={user?.role} />

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Weight Processing History
            </h1>
            <p className="text-gray-600">
              All weight records are automatically processed by the system
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              size="sm"
            >
              {showFilters ? (
                <X className="h-4 w-4 mr-1" />
              ) : (
                <Filter className="h-4 w-4 mr-1" />
              )}
              {showFilters ? "Hide Filters" : "Show Filters"}
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
                  placeholder="Search by material..."
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
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No records found
                </h3>
                <p className="text-gray-500">
                  {searchTerm ||
                  selectedStatus !== "all" ||
                  startDate ||
                  endDate
                    ? "Try adjusting your filters to see more results."
                    : "You haven't recorded any weights yet. Start by adding a new record."}
                </p>
                {(searchTerm ||
                  selectedStatus !== "all" ||
                  startDate ||
                  endDate) && (
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
              <>
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
                    {currentItems.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          #{record.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {record.item_name}
                            </div>
                            {record.quantity && record.quantity > 1 && (
                              <div className="text-xs text-gray-500">
                                Qty: {record.quantity}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatWeight(record.total_weight)}
                            </div>
                            {record.variance_amount && (
                              <div
                                className={`text-xs ${
                                  record.variance_status === "normal"
                                    ? "text-green-600"
                                    : record.variance_status === "warning"
                                    ? "text-orange-600"
                                    : "text-red-600"
                                }`}
                              >
                                {record.variance_amount >= 0 ? "+" : ""}
                                {record.variance_amount.toFixed(2)} kg
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(record.timestamp)}</TableCell>
                        <TableCell>
                          {(() => {
                            const getStatusDisplay = (status: string) => {
                              switch (status) {
                                case "auto_approved":
                                  return {
                                    label: "Auto Approved",
                                    className: "bg-green-100 text-green-800",
                                    icon: "✅",
                                  };
                                case "auto_rejected":
                                  return {
                                    label: "Auto Rejected",
                                    className: "bg-red-100 text-red-800",
                                    icon: "❌",
                                  };
                                case "processed":
                                  return {
                                    label: "Processed",
                                    className: "bg-blue-100 text-blue-800",
                                    icon: "📊",
                                  };
                                default:
                                  return {
                                    label:
                                      status.charAt(0).toUpperCase() +
                                      status.slice(1),
                                    className: "bg-gray-100 text-gray-800",
                                    icon: "📝",
                                  };
                              }
                            };

                            const statusInfo = getStatusDisplay(record.status);
                            return (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}
                              >
                                {statusInfo.icon} {statusInfo.label}
                              </span>
                            );
                          })()}
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

                {/* Pagination */}
                {filteredRecords.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-600">
                        Showing {indexOfFirstItem + 1}-
                        {Math.min(indexOfLastItem, filteredRecords.length)} of{" "}
                        {filteredRecords.length} records
                      </div>
                    </div>

                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Weight Record Detail Modal */}
        {selectedRecord && (
          <WeightRecordDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleCloseDetails}
            record={selectedRecord}
          />
        )}

        {/* Issue reporting functionality removed */}
      </div>
    </DashboardLayout>
  );
}
