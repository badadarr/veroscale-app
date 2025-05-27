import { useState } from 'react';
import { useRouter } from 'next/router';
import { Scale, PackagePlus, Layers, Info } from 'lucide-react';
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
}

export default function WeightEntry() {
    const router = useRouter();
    const { user } = useAuth();
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
    const [weight, setWeight] = useState<number | null>(null);
    const [unit, setUnit] = useState<string>('kg');
    const [batchNumber, setBatchNumber] = useState<string>('');
    const [source, setSource] = useState<string>('');
    const [destination, setDestination] = useState<string>('');
    const [batchItems, setBatchItems] = useState<{ weight: number, note: string }[]>([]);

    // Mock materials data (replace with API call in production)
    const materials: Material[] = [
        { id: 1, name: 'Metal Sheet', standard_weight: 12.5 },
        { id: 2, name: 'Steel Rod Bundle', standard_weight: 35.5 },
        { id: 3, name: 'Concrete Block', standard_weight: 22.7 },
        { id: 4, name: 'Gravel Container', standard_weight: 18.3 },
        { id: 5, name: 'Sand Bag', standard_weight: 30.0 },
    ];

    // Function to handle single record submission
    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedMaterial || !weight) {
            setError('Please select a material and enter a weight.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // In production, replace with actual API call
            // await apiClient.post('/api/weights', {
            //   item_id: selectedMaterial,
            //   total_weight: weight,
            //   unit,
            //   batch_number: batchNumber,
            //   source,
            //   destination
            // });

            // Mock API call for demonstration
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSuccess(true);

            // Reset form after successful submission
            setTimeout(() => {
                setSuccess(false);
                setSelectedMaterial(null);
                setWeight(null);
                setBatchNumber('');
                setSource('');
                setDestination('');
            }, 3000);

        } catch (err) {
            console.error('Error submitting weight record:', err);
            setError('Failed to submit weight record. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Function to add item to batch
    const addToBatch = () => {
        if (!weight) {
            setError('Please enter a weight value.');
            return;
        }

        setBatchItems([...batchItems, { weight, note: `Item ${batchItems.length + 1}` }]);
        setWeight(null);
        setError(null);
    };

    // Function to handle batch submission
    const handleBatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedMaterial || batchItems.length === 0) {
            setError('Please select a material and add at least one weight record.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // In production, replace with actual API call
            // await apiClient.post('/api/weights/batch', {
            //   item_id: selectedMaterial,
            //   batch_items: batchItems,
            //   unit,
            //   batch_number: batchNumber,
            //   source,
            //   destination
            // });

            // Mock API call for demonstration
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSuccess(true);

            // Reset form after successful submission
            setTimeout(() => {
                setSuccess(false);
                setSelectedMaterial(null);
                setBatchItems([]);
                setBatchNumber('');
                setSource('');
                setDestination('');
            }, 3000);

        } catch (err) {
            console.error('Error submitting batch records:', err);
            setError('Failed to submit batch records. Please try again.');
        } finally {
            setLoading(false);
        }
    }; return (
        <DashboardLayout title="Weight Entry">
            <div className="max-w-4xl mx-auto">
                <StatusInfoCard role={user?.role} />

                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Material Weight Entry</h1>
                    <div className="flex space-x-2">
                        <Button
                            variant={!isBatchMode ? "default" : "outline"}
                            onClick={() => setIsBatchMode(false)}
                            size="sm"
                        >
                            <PackagePlus className="h-4 w-4 mr-1" />
                            Single Entry
                        </Button>
                        <Button
                            variant={isBatchMode ? "default" : "outline"}
                            onClick={() => setIsBatchMode(true)}
                            size="sm"
                        >
                            <Layers className="h-4 w-4 mr-1" />
                            Batch Mode
                        </Button>
                    </div>
                </div>

                {success && (
                    <div className="mb-6 bg-success-100 border border-success-300 text-success-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex">
                            <span className="font-medium">{isBatchMode ? 'Batch records' : 'Weight record'} submitted successfully!</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-error-100 border border-error-300 text-error-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex">
                            <span className="font-medium">{error}</span>
                        </div>
                    </div>
                )}

                <Card className="shadow-md">
                    <CardHeader className="bg-primary-50">
                        <CardTitle className="flex items-center text-primary-800">
                            <Scale className="h-5 w-5 mr-2" />
                            {isBatchMode ? 'Batch Weight Entry' : 'Single Weight Entry'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={isBatchMode ? handleBatchSubmit : handleSingleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Material *
                                    </label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                        value={selectedMaterial || ''}
                                        onChange={(e) => setSelectedMaterial(Number(e.target.value) || null)}
                                        required
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

                                {!isBatchMode && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Weight *
                                        </label>
                                        <div className="flex">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="Enter weight value"
                                                value={weight || ''}
                                                onChange={(e) => setWeight(parseFloat(e.target.value) || null)}
                                                required
                                                className="rounded-r-none"
                                            />
                                            <select
                                                className="p-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 focus:ring-primary-500 focus:border-primary-500"
                                                value={unit}
                                                onChange={(e) => setUnit(e.target.value)}
                                                aria-label="Weight unit"
                                            >
                                                <option value="kg">kg</option>
                                                <option value="g">g</option>
                                                <option value="lb">lb</option>
                                                <option value="ton">ton</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

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
                                        placeholder="Where the material came from"
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
                                        placeholder="Where the material is going"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                    />
                                </div>
                            </div>

                            {isBatchMode && (
                                <div className="mb-6">
                                    <div className="flex items-end space-x-2 mb-2">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Weight Value *
                                            </label>
                                            <div className="flex">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Enter weight value"
                                                    value={weight || ''}
                                                    onChange={(e) => setWeight(parseFloat(e.target.value) || null)}
                                                    className="rounded-r-none"
                                                />
                                                <select
                                                    className="p-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 focus:ring-primary-500 focus:border-primary-500"
                                                    value={unit}
                                                    onChange={(e) => setUnit(e.target.value)}
                                                    aria-label="Weight unit"
                                                >
                                                    <option value="kg">kg</option>
                                                    <option value="g">g</option>
                                                    <option value="lb">lb</option>
                                                    <option value="ton">ton</option>
                                                </select>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={addToBatch}
                                            variant="secondary"
                                        >
                                            Add to Batch
                                        </Button>
                                    </div>

                                    <div className="bg-gray-50 rounded-md p-3 mt-3">
                                        <h3 className="font-medium text-gray-700 mb-2">Batch Items ({batchItems.length})</h3>
                                        {batchItems.length === 0 ? (
                                            <p className="text-gray-500 text-sm italic">No items added yet. Add weight values to your batch.</p>
                                        ) : (
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {batchItems.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                                                        <span className="font-medium">{item.note}: {item.weight} {unit}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                const newItems = [...batchItems];
                                                                newItems.splice(index, 1);
                                                                setBatchItems(newItems);
                                                            }}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/operations/my-records')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : isBatchMode ? 'Save Batch' : 'Save Record'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
