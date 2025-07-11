import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api";
import {
  Filter,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
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

import { formatWeight } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import IoTWeightDisplay from "@/components/ui/IoTWeightDisplay";
import RFIDUserDisplay from "@/components/ui/RFIDUserDisplay";
import { useCallback } from "react";

interface Sample {
  id: number;
  category: string;
  item: string;
  sample_weight: number;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export default function Samples() {
  const { user } = useAuth();
  const router = useRouter();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [itemFilter, setItemFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: null as number | null,
    category: "",
    item: "",
    sample_weight: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isOperator = user?.role === "operator";
  const canEdit = isAdmin || isManager || isOperator;

  const fetchSamples = useCallback(async () => {
    setLoading(true);

    try {
      // Use our API client with automatic auth token handling
      const { data } = await apiClient.get(
        "/api/samples" +
          `?page=${pagination.currentPage}` +
          `&limit=${pagination.itemsPerPage}` +
          (categoryFilter
            ? `&category=${encodeURIComponent(categoryFilter)}`
            : "") +
          (itemFilter ? `&item=${encodeURIComponent(itemFilter)}` : "")
      );

      setSamples(data.samples);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching samples:", err);
      setError("Failed to load samples");
      toast.error("Failed to load samples");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.currentPage,
    pagination.itemsPerPage,
    categoryFilter,
    itemFilter,
  ]);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when applying filters
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setCategoryFilter("");
    setItemFilter("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const openCreateForm = () => {
    setFormData({
      id: null,
      category: "",
      item: "",
      sample_weight: "",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const fetchIoTWeight = async () => {
    setFormLoading(true);

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 2000)
    );

    try {
      const fetchPromise = fetch("/api/iot/current-weight");
      const response = await Promise.race([fetchPromise, timeout]);
      const data = await (response as Response).json();

      if (data.weight && data.weight > 0.05 && data.weight < 1000) {
        setFormData((prev) => ({
          ...prev,
          sample_weight: data.weight.toString(),
        }));
        toast.success(`✅ Data IoT: ${data.weight} kg`);
      } else {
        toast.error("❌ Data tidak valid, isi manual");
      }
    } catch {
      toast.error("🔌 IoT tidak tersedia, isi manual");
    }

    setFormLoading(false);
  };

  const handleIoTWeightSelect = (weight: number) => {
    setFormData((prev) => ({ ...prev, sample_weight: weight.toString() }));
    toast.success(`Berat ${weight} kg diambil dari timbangan IoT`);
  };

  const openEditForm = (sample: Sample) => {
    setFormData({
      id: sample.id,
      category: sample.category,
      item: sample.item,
      sample_weight: sample.sample_weight.toString(),
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.category.trim()) {
      errors.category = "Category is required";
    }

    if (!formData.item.trim()) {
      errors.item = "Item name is required";
    }

    const weight = parseFloat(formData.sample_weight);
    if (isNaN(weight) || weight <= 0) {
      errors.sample_weight = "Weight must be a positive number";
    } else if (weight < 0.01) {
      errors.sample_weight = "Weight too small (minimum 0.01 kg)";
    } else if (weight > 10000) {
      errors.sample_weight = "Weight too large (maximum 10000 kg)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const sampleData = {
        category: formData.category,
        item: formData.item,
        sample_weight: parseFloat(formData.sample_weight),
      };

      if (formData.id) {
        // Update existing sample
        await apiClient.put(`/api/samples/${formData.id}`, sampleData);
        toast.success("Sample updated successfully");
      } else {
        // Create new sample
        await apiClient.post("/api/samples", sampleData);
        toast.success("Sample created successfully");
      }

      // Refresh samples list
      fetchSamples();
      closeForm();
    } catch (err) {
      console.error("Error saving sample:", err);
      toast.error(
        formData.id ? "Failed to update sample" : "Failed to create sample"
      );
    }
  };

  const handleDelete = async (id: number) => {
    // Menggunakan toast.custom untuk konfirmasi
    const proceed = await new Promise((resolve) => {
      toast.custom(
        (t) => (
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
            <h3 className="mb-2 font-medium">Confirm Deletion</h3>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete this sample?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-3 py-1 text-sm text-white rounded bg-error-500 hover:bg-error-600"
              >
                Delete
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });

    if (!proceed) return;

    try {
      await apiClient.delete(`/api/samples/${id}`);
      toast.success("Sample deleted successfully");

      // Refresh samples list
      fetchSamples();
    } catch (err) {
      console.error("Error deleting sample:", err);
      toast.error("Failed to delete sample");
    }
  };

  return (
    <DashboardLayout title="Material Samples">
      <div className="space-y-6">
        {/* IoT Integration Section */}
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
          <IoTWeightDisplay
            showSelectButton={showForm}
            onWeightSelect={handleIoTWeightSelect}
          />
          <RFIDUserDisplay />
        </div>
        {error && (
          <div
            className="relative px-4 py-3 border rounded bg-error-100 border-error-300 text-error-700"
            role="alert"
          >
            <div className="flex">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Sample Weight Materials</CardTitle>
              {canEdit && (
                <Button onClick={openCreateForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sample
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter form */}
            <form
              onSubmit={handleFilter}
              className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3"
            >
              <Input
                placeholder="Filter by category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Filter by item name"
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
                className="flex-1"
              />
              <div className="flex space-x-2">
                <Button type="submit" variant="secondary">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </form>

            {showForm && (
              <div className="p-4 mb-6 border border-gray-200 rounded-md bg-gray-50">
                <h3 className="mb-4 text-lg font-medium">
                  {formData.id ? "Edit Sample" : "Add New Sample"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Input
                      label="Category"
                      placeholder="Enter category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      error={formErrors.category}
                    />
                    <Input
                      label="Item Name"
                      placeholder="Enter item name"
                      value={formData.item}
                      onChange={(e) =>
                        setFormData({ ...formData, item: e.target.value })
                      }
                      error={formErrors.item}
                    />
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Sample Weight (kg)
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter weight"
                          value={formData.sample_weight}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sample_weight: e.target.value,
                            })
                          }
                          error={formErrors.sample_weight}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={fetchIoTWeight}
                          disabled={formLoading}
                          className="px-4"
                        >
                          {formLoading ? "Loading..." : "Get IoT"}
                        </Button>
                      </div>
                      {formErrors.sample_weight && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.sample_weight}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={closeForm}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {formData.id ? "Update Sample" : "Add Sample"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Samples table */}
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
                      <TableHead>Category</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Sample Weight</TableHead>
                      {canEdit && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {samples.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={canEdit ? 5 : 4}
                          className="py-8 text-center text-gray-500"
                        >
                          No samples found
                        </TableCell>
                      </TableRow>
                    ) : (
                      samples.map((sample) => (
                        <TableRow key={sample.id}>
                          <TableCell className="font-medium">
                            #{sample.id}
                          </TableCell>
                          <TableCell>{sample.category}</TableCell>
                          <TableCell>{sample.item}</TableCell>
                          <TableCell>
                            {formatWeight(sample.sample_weight)}
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditForm(sample)}
                                className="mr-2"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(sample.id)}
                                className="text-error-600 hover:text-error-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Showing{" "}
                      {(pagination.currentPage - 1) * pagination.itemsPerPage +
                        1}{" "}
                      to{" "}
                      {Math.min(
                        pagination.currentPage * pagination.itemsPerPage,
                        pagination.totalItems
                      )}{" "}
                      of {pagination.totalItems} samples
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={pagination.currentPage === 1}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={
                          pagination.currentPage === pagination.totalPages
                        }
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
