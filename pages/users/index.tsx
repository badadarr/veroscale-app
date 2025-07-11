import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api";
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Search,
  UserCircle,
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

import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
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

export default function Users() {
  const { user: currentUser } = useAuth();
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
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    } catch (err) {
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
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        status: formData.status,
      };

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
    } catch (err: any) {
      console.error("Error saving user:", err);
      const errorMessage =
        err.response?.data?.message ||
        (formData.id ? "Failed to update user" : "Failed to create user");
      toast.error(errorMessage);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-6">
        {error && (
          <div
            className="bg-error-100 border border-error-300 text-error-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <div className="flex">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>User Accounts</CardTitle>
              <Button onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search input */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {showForm && (
              <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200">
                <h3 className="text-lg font-medium mb-4">
                  {formData.id ? "Edit User" : "Add New User"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Role
                      </label>
                      <select
                        id="user-role-select"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="operator">Operator</option>
                        <option value="marketing">Marketing</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="user-department"
                        className="block text-sm font-medium text-gray-700 mb-1"
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
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
                          className="block text-sm font-medium text-gray-700 mb-1"
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
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        {formData.status === "inactive" && (
                          <p className="text-xs text-red-500 mt-1">
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
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="font-medium">{user.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.department || "—"}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === "admin"
                                  ? "bg-primary-100 text-primary-800"
                                  : user.role === "manager"
                                  ? "bg-secondary-100 text-secondary-800"
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
                                });
                                setFormErrors({});
                                setShowForm(true);
                              }}
                              className="mr-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-error-600 hover:text-error-700"
                              onClick={() => {
                                toast.custom(
                                  (t) => (
                                    <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200">
                                      <h3 className="font-medium mb-2">
                                        Confirm Deletion
                                      </h3>
                                      <p className="text-gray-600 mb-4">
                                        Are you sure you want to delete this
                                        user?
                                      </p>
                                      <div className="flex justify-end space-x-2">
                                        <button
                                          onClick={() => toast.dismiss(t.id)}
                                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => {
                                            toast.dismiss(t.id);
                                            toast.error(
                                              "User deletion is disabled for demo"
                                            );
                                          }}
                                          className="px-3 py-1 bg-error-500 hover:bg-error-600 text-white rounded text-sm"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ),
                                  { duration: Infinity }
                                );
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

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
                      of {pagination.totalItems} users
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
