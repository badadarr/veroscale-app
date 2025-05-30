import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Scale, Layers, Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import StatusInfoCard from '@/components/ui/StatusInfoCard';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Sample {
    id: number;
    category: string;
    item: string;
    sample_weight: number;
}

interface WeightEntry {
    sampleId: number;
    sampleName: string;
    category: string;
    weight: number;
    notes?: string;
}

export default function MultiWeightEntry() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [samples, setSamples] = useState<Sample[]>([]);

    // Form states - focus on multiple weight records
    const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
    const [currentSampleId, setCurrentSampleId] = useState<number | null>(null);
    const [currentWeight, setCurrentWeight] = useState<number | null>(null);
    const [currentNotes, setCurrentNotes] = useState<string>('');
    const [batchNumber, setBatchNumber] = useState<string>('');
    const [source, setSource] = useState<string>('');
    const [destination, setDestination] = useState<string>('');    // Fetch samples on component mount
    useEffect(() => {
        fetchSamples();
    }, []);

    const fetchSamples = async () => {
        try {
            const response = await apiClient.get('/api/samples');
            setSamples(response.data.samples || []);
        } catch (error) {
            console.error('Error fetching samples:', error);
            toast.error('Failed to load samples');
        }
    };

    // Function to add weight entry to the entry list
    const addWeightToEntry = () => {
        if (!currentSampleId || !currentWeight) {
            setError('Please select a sample and enter a weight value.');
            return;
        }

        const selectedSample = samples.find(s => s.id === currentSampleId);
        if (!selectedSample) {
            setError('Selected sample not found.');
            return;
        }

        const newEntry: WeightEntry = {
            sampleId: currentSampleId,
            sampleName: `${selectedSample.category} - ${selectedSample.item}`,
            category: selectedSample.category,
            weight: currentWeight,
            notes: currentNotes
        };

        setWeightEntries([...weightEntries, newEntry]);

        // Reset current entry fields
        setCurrentSampleId(null);
        setCurrentWeight(null);
        setCurrentNotes('');
        setError(null);
    };

    // Function to remove weight entry from entry list
    const removeWeightEntry = (index: number) => {
        const newEntries = [...weightEntries];
        newEntries.splice(index, 1);
        setWeightEntries(newEntries);
    };

    // Function to handle multiple weight records submission
    const handleMultiWeightSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (weightEntries.length === 0) {
            setError('Please add at least one weight entry.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Create weight records from samples
            const weightRecordsData = weightEntries.map(entry => ({
                sample_id: entry.sampleId,
                weight: entry.weight,
                notes: entry.notes,
            }));

            await apiClient.post('/api/weights/batch', {
                weight_records: weightRecordsData,
                batch_number: batchNumber,
                source,
                destination,
                unit: 'kg'
            });

            setSuccess(true);
            toast.success('Weight records submitted successfully!');

            // Reset form after successful submission
            setTimeout(() => {
                setSuccess(false);
                setWeightEntries([]);
                setBatchNumber('');
                setSource('');
                setDestination('');

                // Navigate to weight records page
                router.push('/weights');
            }, 2000);

        } catch (err) {
            console.error('Error submitting weight records:', err);
            setError('Failed to submit weight records. Please try again.');
        } finally {
            setLoading(false);
        }
    };    // Calculate total weight
    const totalWeight = weightEntries.reduce((sum, entry) => sum + entry.weight, 0);

    return (
        <DashboardLayout title="Multiple Weight Entry">
            <div className="max-w-4xl mx-auto">
                <StatusInfoCard role={user?.role} />
                
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Layers className="h-6 w-6 mr-2" />
                        Multiple Weight Entry
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Add multiple sample weights in a single batch entry (all weights measured in kg)
                    </p>
                </div>                {success && (
                    <div className="mb-6 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex">
                            <span className="font-medium">Multiple weight records submitted successfully!</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex">
                            <span className="font-medium">{error}</span>
                        </div>
                    </div>
                )}                {/* Add Sample Form */}
                <Card className="shadow-md mb-6">
                    <CardHeader className="bg-primary-50">
                        <CardTitle className="flex items-center text-primary-800">
                            <Plus className="h-5 w-5 mr-2" />
                            Add Sample to Entry
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Sample *
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                    value={currentSampleId || ''}
                                    onChange={(e) => setCurrentSampleId(Number(e.target.value) || null)}
                                    aria-label="Select Sample"
                                >
                                    <option value="">-- Select Sample --</option>
                                    {samples.map((sample) => (
                                        <option key={sample.id} value={sample.id}>
                                            {sample.category} - {sample.item} (Sample: {sample.sample_weight} kg)
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
                            onClick={addWeightToEntry}
                            variant="secondary"
                            className="w-full md:w-auto"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Weight Entry
                        </Button>
                    </CardContent>
                </Card>                {/* Weight Entries List */}
                {weightEntries.length > 0 && (
                    <Card className="shadow-md mb-6">
                        <CardHeader className="bg-gray-50">
                            <CardTitle className="flex items-center justify-between text-gray-800">
                                <span className="flex items-center">
                                    <Scale className="h-5 w-5 mr-2" />
                                    Weight Entries ({weightEntries.length})
                                </span>
                                <span className="text-sm font-medium text-primary-600">
                                    Total Weight: {totalWeight.toFixed(2)} kg
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {weightEntries.map((entry, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white p-3 border border-gray-200 rounded-md">
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-900">{entry.sampleName}</span>
                                            <span className="ml-2 text-primary-600 font-semibold">{entry.weight} kg</span>
                                            {entry.notes && (
                                                <span className="ml-2 text-gray-500 text-sm">({entry.notes})</span>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeWeightEntry(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}                {/* Batch Information and Submit */}
                <Card className="shadow-md">
                    <CardHeader className="bg-primary-50">
                        <CardTitle className="flex items-center text-primary-800">
                            <Scale className="h-5 w-5 mr-2" />
                            Batch Information & Submit
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleMultiWeightSubmit}>
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
                                        placeholder="Where samples came from"
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
                                        placeholder="Where samples are going"
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
                                    disabled={loading || weightEntries.length === 0}
                                >
                                    {loading ? 'Saving...' : `Submit ${weightEntries.length} Weight Record${weightEntries.length !== 1 ? 's' : ''}`}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
