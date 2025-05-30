import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Scale, Plus } from 'lucide-react';
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

export default function WeightEntry() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [samples, setSamples] = useState<Sample[]>([]);

    // Form states for single entry
    const [selectedSampleId, setSelectedSampleId] = useState<number | null>(null);
    const [weight, setWeight] = useState<number | null>(null);
    const [notes, setNotes] = useState<string>('');
    const [source, setSource] = useState<string>('');
    const [destination, setDestination] = useState<string>('');

    // Fetch samples on component mount
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

    // Function to handle single weight record submission
    const handleWeightSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSampleId || !weight) {
            setError('Please select a sample and enter a weight value.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiClient.post('/api/weights', {
                sample_id: selectedSampleId,
                total_weight: weight,
                source,
                destination,
                notes,
                unit: 'kg'
            });

            setSuccess(true);
            toast.success('Weight record submitted successfully!');

            // Reset form after successful submission
            setTimeout(() => {
                setSuccess(false);
                setSelectedSampleId(null);
                setWeight(null);
                setNotes('');
                setSource('');
                setDestination('');

                // Navigate to my records page
                router.push('/operations/my-records');
            }, 2000);

        } catch (err) {
            console.error('Error submitting weight record:', err);
            setError('Failed to submit weight record. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="Weight Entry">
            <div className="max-w-2xl mx-auto">
                <StatusInfoCard role={user?.role} />

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Scale className="h-6 w-6 mr-2" />
                        Weight Entry
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Record the weight of a sample item (weight measured in kg)
                    </p>
                </div>

                {success && (
                    <div className="mb-6 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex">
                            <span className="font-medium">Weight record submitted successfully!</span>
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

                {/* Weight Entry Form */}
                <Card className="shadow-md">
                    <CardHeader className="bg-primary-50">
                        <CardTitle className="flex items-center text-primary-800">
                            <Plus className="h-5 w-5 mr-2" />
                            New Weight Record
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleWeightSubmit}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Sample *
                                    </label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                        value={selectedSampleId || ''}
                                        onChange={(e) => setSelectedSampleId(Number(e.target.value) || null)}
                                        aria-label="Select Sample"
                                        required
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
                                        value={weight || ''}
                                        onChange={(e) => setWeight(parseFloat(e.target.value) || null)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Source Location
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Where sample came from"
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
                                        placeholder="Where sample is going"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                        rows={3}
                                        placeholder="Additional notes about this weight record"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

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
                                    disabled={loading || !selectedSampleId || !weight}
                                >
                                    {loading ? 'Saving...' : 'Submit Weight Record'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
