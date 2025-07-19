import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api';
import { Plus, Truck, Calendar, Package } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';

import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';

interface Supplier {
  id: number;
  name: string;
}

interface Sample {
  id: number;
  category: string;
  item: string;
}

interface Delivery {
  id: number;
  supplier_id: number;
  item_name: string;
  expected_quantity: number;
  expected_weight: number;
  scheduled_date: string;
  delivery_status: 'scheduled' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
  actual_delivery_date?: string;
  notes?: string;
  suppliers?: { name: string; contact_person: string };
  users?: { name: string };
}

interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export default function Deliveries() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  // const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null); // Unused for now
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState({
    supplier_id: '',
    item_name: '',
    expected_quantity: '',
    expected_weight: '',
    scheduled_date: '',
    notes: ''
  });

  useEffect(() => {
    if (user && !['admin', 'marketing', 'manager', 'operator'].includes(user.role)) {
      window.location.href = '/dashboard';
    }
  }, [user]);

  useEffect(() => {
    fetchDeliveries();
    fetchSuppliers();
    fetchSamples();
  }, [pagination.currentPage, pagination.itemsPerPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDeliveries = async () => {
    try {
      const { data } = await apiClient.get(`/api/deliveries?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`);
      setDeliveries(data.deliveries);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data } = await apiClient.get('/api/suppliers');
      setSuppliers(data.suppliers);
    } catch (err) {
      console.error('Failed to load suppliers');
    }
  };

  const fetchSamples = async () => {
    try {
      const { data } = await apiClient.get('/api/samples');
      setSamples(data.samples);
    } catch (err) {
      console.error('Failed to load samples');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id || !formData.item_name || !formData.expected_quantity || !formData.scheduled_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await apiClient.post('/api/deliveries', {
        ...formData,
        supplier_id: parseInt(formData.supplier_id),
        expected_quantity: parseFloat(formData.expected_quantity),
        expected_weight: formData.expected_weight ? parseFloat(formData.expected_weight) : null
      });
      toast.success('Delivery scheduled successfully');
      fetchDeliveries();
      setShowForm(false);
      setFormData({
        supplier_id: '',
        item_name: '',
        expected_quantity: '',
        expected_weight: '',
        scheduled_date: '',
        notes: ''
      });
    } catch (err) {
      toast.error('Failed to schedule delivery');
    }
  };

  const handleStatusUpdate = async (deliveryId: number, status: string, actualDate?: string) => {
    try {
      await apiClient.put(`/api/deliveries/${deliveryId}`, {
        delivery_status: status,
        actual_delivery_date: actualDate,
      });
      toast.success('Status updated successfully');
      fetchDeliveries();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const canShipToday = (scheduledDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const scheduled = new Date(scheduledDate).toISOString().split('T')[0];
    return today >= scheduled;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'delayed': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Delivery Management">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Supplier Deliveries</CardTitle>
              {(user?.role === 'admin' || user?.role === 'marketing') && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Delivery
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showForm && (
              <div className="p-4 mb-6 border rounded-md bg-gray-50">
                <h3 className="mb-4 text-lg font-medium">Schedule New Delivery</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Supplier *
                      </label>
                      <select
                        value={formData.supplier_id}
                        onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">
                        Item Name *
                      </label>
                      <select
                        value={formData.item_name}
                        onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select Item</option>
                        {samples.map((sample) => (
                          <option key={sample.id} value={`${sample.category} - ${sample.item}`}>
                            {sample.category} - {sample.item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Input
                      label="Expected Quantity *"
                      type="number"
                      placeholder="Enter quantity"
                      value={formData.expected_quantity}
                      onChange={(e) => setFormData({ ...formData, expected_quantity: e.target.value })}
                      required
                    />
                    <Input
                      label="Expected Weight (kg)"
                      type="number"
                      step="0.01"
                      placeholder="Enter weight"
                      value={formData.expected_weight}
                      onChange={(e) => setFormData({ ...formData, expected_weight: e.target.value })}
                    />
                    <Input
                      label="Scheduled Date *"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Enter any additional notes"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Schedule Delivery</Button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
              </div>
            ) : (
              <>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Truck className="w-6 h-6 mr-2 text-primary-600" />
                          <div>
                            <div className="font-medium">
                              {delivery.suppliers?.name || 'Unknown Supplier'}
                            </div>
                            {delivery.suppliers?.contact_person && (
                              <div className="text-sm text-gray-500">
                                {delivery.suppliers.contact_person}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          {delivery.item_name}
                        </div>
                      </TableCell>
                      <TableCell>{delivery.expected_quantity}</TableCell>
                      <TableCell>
                        {delivery.expected_weight ? `${delivery.expected_weight} kg` : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(delivery.scheduled_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.delivery_status)}`}>
                          {delivery.delivery_status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {delivery.notes && (
                          <div className="max-w-xs text-sm text-gray-600 truncate">
                            {delivery.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {delivery.delivery_status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (canShipToday(delivery.scheduled_date)) {
                                  handleStatusUpdate(delivery.id, 'in_transit');
                                } else {
                                  toast.error('Cannot ship before scheduled date');
                                }
                              }}
                            >
                              Ship
                            </Button>
                          )}
                          {delivery.delivery_status === 'in_transit' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(delivery.id, 'delivered', new Date().toISOString().split('T')[0])}
                            >
                              Deliver
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} deliveries
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