import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  Search,
  Package
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';

interface Material {
  id: number;
  name: string;
  weight: number;
  price_per_kg: number;
  created_at?: string;
  updated_at?: string;
}

export default function Materials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);  const [formData, setFormData] = useState({
    id: null as number | null,
    name: '',
    weight: '',
    price_per_kg: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Redirect if not admin or manager
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'manager') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);

    try {
      // This would be your actual API call
      // const response = await apiClient.get('/api/materials');
      // setMaterials(response.data);
        // For now, we'll use dummy data
      const dummyData: Material[] = [
        { id: 1, name: 'Steel Bar', weight: 5.75, price_per_kg: 1200 },
        { id: 2, name: 'Aluminum Sheet', weight: 2.3, price_per_kg: 2800 },
        { id: 3, name: 'Copper Wire', weight: 1.25, price_per_kg: 8500 },
        { id: 4, name: 'Iron Pipe', weight: 8.5, price_per_kg: 800 },
        { id: 5, name: 'Plastic Granules', weight: 0.85, price_per_kg: 1500 },
      ];
      
      setMaterials(dummyData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching materials:', err);
      setError('Failed to load materials. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (material: Material) => {
    setFormData({
      id: material.id,
      name: material.name,
      weight: material.weight.toString(),
      price_per_kg: material.price_per_kg.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      // This would be your actual API call
      // await apiClient.delete(`/api/materials/${id}`);
      
      // For now, we'll just simulate success
      toast.success('Material deleted successfully');
      
      // Update the local state
      setMaterials(materials.filter(material => material.id !== id));
    } catch (err: any) {
      console.error('Error deleting material:', err);
      toast.error('Failed to delete material');
    }
  };
  const openForm = () => {
    setFormData({
      id: null,
      name: '',
      weight: '',
      price_per_kg: '',
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
      errors.name = 'Name is required';
    }

    if (!formData.weight.trim()) {
      errors.weight = 'Weight is required';
    } else {
      const weightValue = parseFloat(formData.weight);
      if (isNaN(weightValue) || weightValue <= 0) {
        errors.weight = 'Weight must be a positive number';
      }
    }

    if (!formData.price_per_kg.trim()) {
      errors.price_per_kg = 'Price per kg is required';
    } else {
      const priceValue = parseFloat(formData.price_per_kg);
      if (isNaN(priceValue) || priceValue <= 0) {
        errors.price_per_kg = 'Price must be a positive number';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }    try {
      const materialData = {
        name: formData.name,
        weight: parseFloat(formData.weight),
        price_per_kg: parseFloat(formData.price_per_kg),
      };

      if (formData.id) {
        // Update existing material
        // await apiClient.put(`/api/materials/${formData.id}`, materialData);
        
        // For now, we'll just simulate success
        toast.success('Material updated successfully');
        
        // Update the local state
        setMaterials(materials.map(material => 
          material.id === formData.id 
            ? { ...material, ...materialData }
            : material
        ));
      } else {
        // Create new material
        // const response = await apiClient.post('/api/materials', materialData);
        
        // For now, we'll just simulate success
        const newMaterial = {
          id: Math.max(0, ...materials.map(m => m.id)) + 1,
          ...materialData
        };
        
        toast.success('Material created successfully');
        
        // Update the local state
        setMaterials([...materials, newMaterial]);
      }

      closeForm();
    } catch (err: any) {
      console.error('Error saving material:', err);
      toast.error('Failed to save material');
    }
  };

  // Filter materials based on search query
  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Material Management">
      <div className="space-y-6">
        {error && (
          <div className="bg-error-100 border border-error-300 text-error-700 px-4 py-3 rounded relative" role="alert">
            <div className="flex">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Materials</CardTitle>
              <Button onClick={openForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {showForm && (
              <Card className="mb-6 border border-primary-200 bg-primary-50">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>{formData.id ? 'Edit Material' : 'Add Material'}</CardTitle>
                    <Button size="sm" variant="ghost" onClick={closeForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="material-name" className="block text-sm font-medium text-gray-700 mb-1">
                          Material Name
                        </label>
                        <Input
                          id="material-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          error={formErrors.name}
                        />
                      </div>
                      <div>
                        <label htmlFor="material-weight" className="block text-sm font-medium text-gray-700 mb-1">
                          Standard Weight (kg)
                        </label>
                        <Input
                          id="material-weight"
                          type="number"
                          step="0.01"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          error={formErrors.weight}
                        />
                      </div>
                      <div>
                        <label htmlFor="material-price" className="block text-sm font-medium text-gray-700 mb-1">
                          Price per kg (IDR)
                        </label>
                        <Input
                          id="material-price"
                          type="number"
                          step="0.01"
                          value={formData.price_per_kg}
                          onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                          error={formErrors.price_per_kg}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={closeForm}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        {formData.id ? 'Update Material' : 'Add Material'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="text-center py-4">Loading materials...</div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchQuery ? 'No materials found matching your search.' : 'No materials found. Add some materials to get started.'}
              </div>
            ) : (              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Standard Weight (kg)</TableHead>
                    <TableHead>Price per kg (IDR)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-3">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>{material.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{material.weight} kg</TableCell>
                      <TableCell>IDR {material.price_per_kg.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(material)}
                          className="mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(material.id)}
                        >
                          <Trash2 className="h-4 w-4 text-error-500" />
                        </Button>
                      </TableCell>
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
