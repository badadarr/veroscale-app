import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api";
import { Plus, Edit, Trash2, AlertCircle, Search } from "lucide-react";
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

import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import { useRFIDUsers } from "@/hooks/useIoT";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  rfid_uid?: string | null;
  department?: string;
  status?: "active" | "inactive";
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as ApiError;
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const { rfidRequests, rfidUsers } = useRFIDUsers();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState({
    id: null as number | null,
    name: "",
    email: "",
    password: "",
    role: "operator",
    department: "",
    status: "active" as "active" | "inactive",
    rfid_uid: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Recent UIDs from RFID Log (pending requests)
  const recentUIDs = useMemo(() => {
    // Build a set of approved UIDs from rfid_users to exclude from dropdown
    const approved = new Set(
      Object.keys(rfidUsers || {}).map((k) => k.toUpperCase())
    );
    const entries = Object.entries(rfidRequests || {});
    const list = entries
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([key, val]) => {
        if (typeof val === "string") return val.toUpperCase();
        if (val && typeof val === "object") {
          const v = val as Record<string, unknown>;
          const cand = String(
            (v.uid as string) ||
              (v.user_id as string) ||
              (v.rfid as string) ||
              key
          );
          return cand.toUpperCase();
        }
        return String(key).toUpperCase();
      })
      .filter((s) => s && !approved.has(s));
    // Deduplicate and limit
    return Array.from(new Set(list)).slice(0, 10);
  }, [rfidRequests, rfidUsers]);

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      window.location.href = "/dashboard";
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, pagination.itemsPerPage, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const { data } = await apiClient.get(
        `/api/users?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}&search=${searchQuery}`
      );
      setUsers(data.users);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err: unknown) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const openCreateForm = () => {
    setFormData({
      id: null,
      name: "",
      email: "",
      password: "",
      role: "operator",
      department: "",
      status: "active",
      rfid_uid: "",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!formData.id && !formData.password.trim()) {
      errors.password = "Password is required for new users";
    } else if (!formData.id && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
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
      const userData: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        status: formData.status,
      };
      if (formData.role === "operator" && formData.rfid_uid.trim()) {
        userData.rfid_uid = formData.rfid_uid.trim().toUpperCase();
      }

      if (formData.id) {
        // Update existing user
        await apiClient.put(`/api/users/${formData.id}`, userData);
        toast.success("User updated successfully");
      } else {
        // Create new user
        await apiClient.post("/api/auth/register", userData);
        toast.success("User created successfully");
      }

      // Refresh users list
      fetchUsers();
      closeForm();
    } catch (err: unknown) {
      console.error("Error saving user:", err);
      const fallback = formData.id
        ? "Failed to update user"
        : "Failed to create user";
      toast.error(extractErrorMessage(err, fallback));
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const confirmAndDeleteUser = (id: number) => {
    toast.custom(
      (t) => (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <h3 className="mb-2 font-medium">Confirm Deletion</h3>
          <p className="mb-4 text-gray-600">
            Are you sure you want to delete this user? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  await apiClient.delete(`/api/users/${id}`);
                  toast.success("User deleted successfully");
                  fetchUsers();
                } catch (err: unknown) {
                  console.error("Delete user error:", err);
                  toast.error(
                    extractErrorMessage(err, "Failed to delete user")
                  );
                } finally {
                  toast.dismiss(t.id);
                }
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
  };

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-6">
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
              <CardTitle>User Accounts</CardTitle>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search input */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {showForm && (
              <div className="p-4 mb-6 border border-gray-200 rounded-md bg-gray-50">
                <h3 className="mb-4 text-lg font-medium">
                  {formData.id ? "Edit User" : "Add New User"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label="Name"
                      placeholder="Enter name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      error={formErrors.name}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      error={formErrors.email}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label={
                        formData.id
                          ? "Password (leave blank to keep current)"
                          : "Password"
                      }
                      type="password"
                      placeholder={
                        formData.id
                          ? "Leave blank to keep current password"
                          : "Enter password"
                      }
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      error={formErrors.password}
                    />
                    <div>
                      <label
                        htmlFor="user-role-select"
                        className="block mb-1 text-sm font-medium text-gray-700"
                      >
                        Role
                      </label>
                      <select
                        id="user-role-select"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
                      >
                        <option value="admin">Admin</option>
                        <option value="operator">Operator</option>
                        <option value="marketing">Marketing</option>
                      </select>
                    </div>
                    {formData.role === "operator" && (
                      <div className="md:col-span-2">
                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <Input
                              label="RFID UID"
                              placeholder="A1B2C3D4"
                              value={formData.rfid_uid}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  rfid_uid: e.target.value.toUpperCase(),
                                })
                              }
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Ambil UID dari menu RFID Log atau input manual.
                            </p>
                          </div>
                          <div className="w-48">
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                              From RFID Log
                            </label>
                            <select
                              value=""
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v) {
                                  setFormData({ ...formData, rfid_uid: v });
                                }
                              }}
                              disabled={recentUIDs.length === 0}
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50"
                            >
                              <option value="">
                                {recentUIDs.length ? "Pick UID…" : "No UIDs"}
                              </option>
                              {recentUIDs.map((uid) => (
                                <option key={uid} value={uid}>
                                  {uid}
                                </option>
                              ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-400">
                              {recentUIDs.length} recent
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor="user-department"
                        className="block mb-1 text-sm font-medium text-gray-700"
                      >
                        Department
                      </label>
                      <select
                        id="user-department"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
                      >
                        <option value="">None</option>
                        <option value="Operations">Operations</option>
                        <option value="Warehouse">Warehouse</option>
                        <option value="Quality Control">Quality Control</option>
                        <option value="Administration">Administration</option>
                        <option value="Management">Management</option>
                      </select>
                    </div>
                    {formData.id && (
                      <div>
                        <label
                          htmlFor="user-status"
                          className="block mb-1 text-sm font-medium text-gray-700"
                        >
                          Status
                        </label>
                        <select
                          id="user-status"
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              status: e.target.value as "active" | "inactive",
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        {formData.status === "inactive" && (
                          <p className="mt-1 text-xs text-red-500">
                            Inactive users cannot log in but their data will be
                            preserved.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={closeForm}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {formData.id ? "Update User" : "Add User"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Users table */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>RFID UID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="py-8 text-center text-gray-500"
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="flex items-center justify-center w-10 h-10 mr-3 font-bold rounded-full bg-primary-100 text-primary-700">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="font-medium">{user.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === "admin"
                                  ? "bg-primary-100 text-primary-800"
                                  : user.role === "marketing"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {user.role.charAt(0).toUpperCase() +
                                user.role.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {user.role === "operator"
                              ? user.rfid_uid || "—"
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.status || "active"}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setFormData({
                                  id: user.id,
                                  name: user.name,
                                  email: user.email,
                                  password: "",
                                  role: user.role,
                                  department: user.department || "",
                                  status: user.status || "active",
                                  rfid_uid: user.rfid_uid || "",
                                });
                                setFormErrors({});
                                setShowForm(true);
                              }}
                              className="mr-2"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-error-600 hover:text-error-700"
                              onClick={() => confirmAndDeleteUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      Showing{" "}
                      {(pagination.currentPage - 1) * pagination.itemsPerPage +
                        1}{" "}
                      to{" "}
                      {Math.min(
                        pagination.currentPage * pagination.itemsPerPage,
                        pagination.totalItems
                      )}{" "}
                      of {pagination.totalItems} users
                    </div>
                  </div>

                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
