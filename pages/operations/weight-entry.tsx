import { useState } from 'react';
import { useRouter } from 'next/router';
import { Scale, Layers, Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import StatusInfoCard from '@/components/ui/StatusInfoCard';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';

interface Material {
    id: number;
    name: string;
    standard_weight: number;
    price_per_kg?: number;
}

interface MaterialEntry {
    materialId: number;
    materialName: string;
    weight: number;
    notes?: string;
}

export default function MultiMaterialEntry() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states - focus on multiple materials
    const [materialEntries, setMaterialEntries] = useState<MaterialEntry[]>([]);
    const [currentMaterialId, setCurrentMaterialId] = useState<number | null>(null);
    const [currentWeight, setCurrentWeight] = useState<number | null>(null);
    const [currentNotes, setCurrentNotes] = useState<string>('');
    const [batchNumber, setBatchNumber] = useState<string>('');
    const [source, setSource] = useState<string>('');
    const [destination, setDestination] = useState<string>('');

    // Mock materials data (replace with API call in production)
    const materials: Material[] = [
        { id: 1, name: 'Metal Sheet', standard_weight: 12.5, price_per_kg: 12.50 },
        { id: 2, name: 'Steel Rod Bundle', standard_weight: 35.5, price_per_kg: 18.75 },
        { id: 3, name: 'Concrete Block', standard_weight: 22.7, price_per_kg: 8.25 },
        { id: 4, name: 'Gravel Container', standard_weight: 18.3, price_per_kg: 5.50 },
        { id: 5, name: 'Sand Bag', standard_weight: 30.0, price_per_kg: 3.75 },
    ];    // Function to add material to the entry list
    const addMaterialToEntry = () => {
        if (!currentMaterialId || !currentWeight) {
            setError('Please select a material and enter a weight value.');
            return;
        }

        const selectedMaterial = materials.find(m => m.id === currentMaterialId);
        if (!selectedMaterial) {
            setError('Selected material not found.');
            return;
        }

        const newEntry: MaterialEntry = {
            materialId: currentMaterialId,
            materialName: selectedMaterial.name,
            weight: currentWeight,
            notes: currentNotes
        };

        setMaterialEntries([...materialEntries, newEntry]);
        
        // Reset current entry fields
        setCurrentMaterialId(null);
        setCurrentWeight(null);
        setCurrentNotes('');
        setError(null);
    };

    // Function to remove material from entry list
    const removeMaterialEntry = (index: number) => {
        const newEntries = [...materialEntries];
        newEntries.splice(index, 1);
        setMaterialEntries(newEntries);
    };

    // Function to handle multiple material submission
    const handleMultiMaterialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (materialEntries.length === 0) {
            setError('Please add at least one material entry.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Real API call to add multiple material records
            await apiClient.post('/api/weights/multi-material', {
                material_entries: materialEntries,
                batch_number: batchNumber,
                source,
                destination,
                unit: 'kg' // Fixed to kg only
            });

            setSuccess(true);

            // Reset form after successful submission
            setTimeout(() => {
                setSuccess(false);
                setMaterialEntries([]);
                setBatchNumber('');
                setSource('');
                setDestination('');

                // Navigate to weight records page
                router.push('/weights');
            }, 2000);

        } catch (err) {
            console.error('Error submitting multi-material records:', err);
            setError('Failed to submit material records. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Calculate total weight
    const totalWeight = materialEntries.reduce((sum, entry) => sum + entry.weight, 0);    return (
        <DashboardLayout title="Multiple Material Entry">
            <div className="max-w-4xl mx-auto">
                <StatusInfoCard role={user?.role} />                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Layers className="h-6 w-6 mr-2" />
                        Multiple Material Entry
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Add multiple materials with their weights in a single batch entry (all weights measured in kg)
                    </p>
                </div>

                {success && (
                    <div className="mb-6 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex">
                            <span className="font-medium">Multiple material records submitted successfully!</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex">
                            <span className="font-medium">{error}</span>
                        </div>
                    </div>
                )}

                {/* Add Material Form */}
                <Card className="shadow-md mb-6">
                    <CardHeader className="bg-primary-50">
                        <CardTitle className="flex items-center text-primary-800">
                            <Plus className="h-5 w-5 mr-2" />
                            Add Material to Entry
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Material *
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                    value={currentMaterialId || ''}
                                    onChange={(e) => setCurrentMaterialId(Number(e.target.value) || null)}
                                    aria-label="Select Material"
                                >
                                    <option value="">-- Select Material --</option>
                                    {materials.map((material) => (
                                        <option key={material.id} value={material.id}>
                                            {material.name} (Std: {material.standard_weight} kg)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Weight (kg) *
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter weight in kg"
                                    value={currentWeight || ''}
                                    onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || null)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Additional notes"
                                    value={currentNotes}
                                    onChange={(e) => setCurrentNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={addMaterialToEntry}
                            variant="secondary"
                            className="w-full md:w-auto"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Material
                        </Button>
                    </CardContent>
                </Card>

                {/* Material Entries List */}
                {materialEntries.length > 0 && (
                    <Card className="shadow-md mb-6">
                        <CardHeader className="bg-gray-50">
                            <CardTitle className="flex items-center justify-between text-gray-800">
                                <span className="flex items-center">
                                    <Scale className="h-5 w-5 mr-2" />
                                    Material Entries ({materialEntries.length})
                                </span>
                                <span className="text-sm font-medium text-primary-600">
                                    Total Weight: {totalWeight.toFixed(2)} kg
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {materialEntries.map((entry, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white p-3 border border-gray-200 rounded-md">
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-900">{entry.materialName}</span>
                                            <span className="ml-2 text-primary-600 font-semibold">{entry.weight} kg</span>
                                            {entry.notes && (
                                                <span className="ml-2 text-gray-500 text-sm">({entry.notes})</span>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeMaterialEntry(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Batch Information and Submit */}
                <Card className="shadow-md">
                    <CardHeader className="bg-primary-50">
                        <CardTitle className="flex items-center text-primary-800">
                            <Scale className="h-5 w-5 mr-2" />
                            Batch Information & Submit
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleMultiMaterialSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Batch Number
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Optional batch identifier"
                                        value={batchNumber}
                                        onChange={(e) => setBatchNumber(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Source Location
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Where materials came from"
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Destination
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Where materials are going"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/weights')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || materialEntries.length === 0}
                                >
                                    {loading ? 'Saving...' : `Submit ${materialEntries.length} Material${materialEntries.length !== 1 ? 's' : ''}`}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
