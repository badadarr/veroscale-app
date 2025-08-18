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
import { formatDate } from "@/lib/utils";
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
  status: "pending" | "approved" | "rejected";
  user_name?: string;
  batch_number?: string;
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
  const [records, setRecords] = useState<WeightRecord[]>([]);
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

  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

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
          status: record.status || "pending",
          source: record.source,
          destination: record.destination,
          notes: record.notes,
          unit: record.unit || "kg",
          approved_by: record.approved_by,
          approved_at: record.approved_at,
          created_at: record.created_at,
          user_name: record.user_name || "Unknown User",
          approved_by_name: record.approved_by_name,
          batch_number: record.batch_number,
        }));
        setRecords(processedRecords);
        setFilteredRecords(processedRecords);
      } else {
        console.warn("No records found or invalid format:", data);
        setRecords([]);
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

      setRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to update weight record status
  const updateRecordStatus = async (
    recordId: number,
    status: "approved" | "rejected" | "pending"
  ) => {
    setStatusUpdating(recordId);

    try {
      const response = await apiClient.put(`/api/weights/${recordId}`, {
        status,
      });
      const data = response.data;

      toast.success(`Record status updated to ${status}`);

      // Update local state with the returned record data
      const updatedRecords = records.map((record) => {
        if (record.id === recordId) {
          return {
            ...record,
            status,
            // Update with additional data from response if available
            ...(data.record && {
              user_name: data.record.user_name || record.user_name,
              item_name: data.record.item_name || record.item_name,
            }),
          };
        }
        return record;
      });

      setRecords(updatedRecords);
      setFilteredRecords(updatedRecords);
    } catch (error: unknown) {
      console.error("Error updating record status:", error);

      // Check if the update might have succeeded but the response failed
      if (error instanceof Error && "response" in error) {
        const apiError = error as { response?: { status: number } };
        if (apiError.response?.status === 500) {
          // Show a different message and try to refresh the data
          toast.error(
            "Update may have succeeded but response failed. Refreshing data..."
          );

          // Optimistically update the local state
          const updatedRecords = records.map((record) =>
            record.id === recordId ? { ...record, status } : record
          );

          setRecords(updatedRecords);
          setFilteredRecords(updatedRecords);

          // Try to refresh the data to get the latest state
          setTimeout(() => {
            fetchWeightRecords();
          }, 1000);
        } else {
          const errorMessage = "Failed to update status";
          toast.error(errorMessage);
        }
      } else {
        toast.error("Failed to update status");
      }
    } finally {
      setStatusUpdating(null);
    }
  };

  // Determine if the user can change status
  const canChangeStatus = user?.role === "admin" || user?.role === "manager";

  // Determine page title based on role
  const pageTitle =
    user?.role === "operator" ? "My Weight Records" : "All Weight Records";

  return (
    <DashboardLayout title={pageTitle}>
      <div className="space-y-6">
        <StatusInfoCard role={user?.role} />

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>
                {user?.role === "operator"
                  ? "My Weight Records"
                  : "Recent Weight Records"}
              </CardTitle>
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
                          {record.total_weight} {record.unit || "kg"}
                        </TableCell>
                        <TableCell>
                          {record.iot_weight && record.manager_weight ? (
                            <div className="space-y-1 text-xs">
                              <div>IoT: {record.iot_weight} kg</div>
                              <div>Target: {record.manager_weight} kg</div>
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
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.status === "approved"
                                ? "bg-success-100 text-success-800"
                                : record.status === "pending"
                                ? "bg-warning-100 text-warning-800"
                                : "bg-error-100 text-error-800"
                            }`}
                          >
                            {record.status.charAt(0).toUpperCase() +
                              record.status.slice(1)}
                          </span>
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
                        {canChangeStatus && (
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateRecordStatus(
                                  record.id,
                                  record.status === "pending"
                                    ? "approved"
                                    : "pending"
                                )
                              }
                              disabled={statusUpdating === record.id}
                            >
                              {record.status === "pending"
                                ? "Approve"
                                : "Reset"}
                            </Button>
                          </TableCell>
                        )}
                        {canChangeStatus && (
                          <TableCell>
                            <div className="flex space-x-2">
                              {record.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 py-1 text-xs text-success-700 border-success-200 hover:bg-success-50"
                                    onClick={() =>
                                      updateRecordStatus(record.id, "approved")
                                    }
                                    disabled={statusUpdating === record.id}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 py-1 text-xs text-error-700 border-error-200 hover:bg-error-50"
                                    onClick={() =>
                                      updateRecordStatus(record.id, "rejected")
                                    }
                                    disabled={statusUpdating === record.id}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {(record.status === "approved" ||
                                record.status === "rejected") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 py-1 text-xs text-warning-700 border-warning-200 hover:bg-warning-50"
                                  onClick={() =>
                                    updateRecordStatus(record.id, "pending")
                                  }
                                  disabled={statusUpdating === record.id}
                                >
                                  Reset to Pending
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
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
