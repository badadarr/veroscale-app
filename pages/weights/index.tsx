import React from "react";
import { useState, useEffect } from "react";
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
import StatusInfoCard from "@/components/ui/StatusInfoCard";
import WeightVarianceDisplay from "@/components/ui/WeightVarianceDisplay";
import WeightRecordDetailModal from "@/components/ui/WeightRecordDetailModal";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, formatWeight } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api";

interface WeightRecord {
  id: number;
  record_id: number;
  user_id: number;
  sample_id?: number;
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
  user_name?: string;
  // batch_number?: string; // removed for schema compatibility
  unit?: string;
  source?: string;
  destination?: string;
  notes?: string;
  approved_by?: number;
  approved_at?: string;
  created_at?: string;
  approved_by_name?: string;
}

export default function WeightRecords() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [filteredRecords, setFilteredRecords] = useState<WeightRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState<WeightRecord | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Remove unused state since no status updates allowed
  // const [statusUpdating] = useState<number | null>(null);

  // Function to handle detail modal
  const handleViewDetail = (record: WeightRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedRecord(null);
    setIsDetailModalOpen(false);
  };

  useEffect(() => {
    fetchWeightRecords();
  }, []);

  // Function to fetch weight records from API
  const fetchWeightRecords = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/weights");
      const data = response.data;
      if (data.records && Array.isArray(data.records)) {
        const processedRecords = data.records.map((record: WeightRecord) => ({
          id: record.id || record.record_id,
          record_id: record.record_id || record.id,
          user_id: record.user_id || 0,
          sample_id: record.sample_id,
          item_name: record.item_name || "Unknown Item",
          total_weight: record.total_weight || 0,
          timestamp: record.timestamp || new Date().toISOString(),
          status: record.status || "processed",
          source: record.source,
          destination: record.destination,
          notes: record.notes,
          unit: record.unit || "kg",
          approved_by: record.approved_by,
          approved_at: record.approved_at,
          created_at: record.created_at,
          user_name: record.user_name || "Unknown User",
          approved_by_name: record.approved_by_name,
          // batch_number: record.batch_number,
        }));
        setFilteredRecords(processedRecords);
      } else {
        console.warn("No records found or invalid format:", data);
        setFilteredRecords([]);
      }
    } catch (error: unknown) {
      console.error("Error fetching weight records:", error);

      if (error instanceof Error && "response" in error) {
        const apiError = error as { response?: { status: number } };
        if (apiError.response?.status === 500) {
          toast.error("Server error while loading records. Please try again.");
        } else if (apiError.response?.status === 401) {
          toast.error("Unauthorized. Please login again.");
        } else {
          toast.error("Failed to load weight records");
        }
      } else {
        toast.error("Failed to load weight records");
      }

      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to get status display info
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
          label: status.charAt(0).toUpperCase() + status.slice(1),
          className: "bg-gray-100 text-gray-800",
          icon: "📝",
        };
    }
  };

  // No longer need manager/admin privileges - all records are read-only history
  const canChangeStatus = false;

  // Determine page title - now always shows as history
  const pageTitle = "Weight Records History";

  return (
    <DashboardLayout title={pageTitle}>
      <div className="space-y-6">
        <StatusInfoCard role={user?.role} />

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weight Processing History</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  All weight records are automatically processed by the system
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchWeightRecords}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>IoT vs Target</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Actions</TableHead>
                      {canChangeStatus && <TableHead>Admin Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          #{record.id}
                        </TableCell>
                        <TableCell>{record.item_name}</TableCell>
                        <TableCell>
                          {formatWeight(record.total_weight)}
                        </TableCell>
                        <TableCell>
                          {record.iot_weight && record.manager_weight ? (
                            <div className="space-y-1 text-xs">
                              <div>
                                IoT: {Number(record.iot_weight).toFixed(3)} kg
                              </div>
                              <div>
                                Target:{" "}
                                {Number(record.manager_weight).toFixed(3)} kg
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.iot_weight && record.manager_weight ? (
                            <WeightVarianceDisplay
                              iotWeight={record.iot_weight}
                              managerWeight={record.manager_weight}
                              variance={record.weight_variance}
                              variancePercentage={
                                record.weight_variance_percentage
                              }
                              varianceStatus={record.variance_status}
                              compact={true}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">
                              No variance data
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(record.timestamp)}</TableCell>
                        <TableCell>
                          {(() => {
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
                        <TableCell>{record.user_name}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(record)}
                          >
                            View Detail
                          </Button>
                        </TableCell>
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

        {/* Weight Record Detail Modal */}
        {selectedRecord && (
          <WeightRecordDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleCloseDetailModal}
            record={selectedRecord}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
