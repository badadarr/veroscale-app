import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Scale, Truck, Package } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import StatusInfoCard from '@/components/ui/StatusInfoCard';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import IoTWeightDisplay from '@/components/ui/IoTWeightDisplay';
import RFIDUserDisplay from '@/components/ui/RFIDUserDisplay';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

interface Delivery {
    id: number;
    item_name: string;
    expected_quantity: number;
    expected_weight: number;
    scheduled_date: string;
    delivery_status: string;
    suppliers?: { name: string };
}

export default function WeightEntry() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);
    const [actualWeight, setActualWeight] = useState<number | null>(null);
    const [notes, setNotes] = useState<string>('');

    // Load deliveries
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [selectedDeliveryData, setSelectedDeliveryData] = useState<Delivery | null>(null);

    useEffect(() => {
        loadDeliveries();
    }, []);

    const loadDeliveries = async () => {
        try {
            const { data } = await apiClient.get('/api/deliveries');
            const shippedDeliveries = data.deliveries?.filter((delivery: Delivery) => 
                delivery.delivery_status === 'in_transit'
            ) || [];
            setDeliveries(shippedDeliveries);
        } catch (error) {
            console.error('Failed to load deliveries:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedDelivery || !actualWeight) {
            setError('Please select a delivery and enter actual weight.');
            return;
        }

        // Check if delivery can be weighed today
        if (selectedDeliveryData) {
            const today = new Date().toISOString().split('T')[0];
            const scheduled = new Date(selectedDeliveryData.scheduled_date).toISOString().split('T')[0];
            
            if (today < scheduled) {
                toast.error('Cannot weigh delivery before scheduled date');
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            // Update delivery status to delivered and add weight record
            await apiClient.put(`/api/deliveries/${selectedDelivery}`, {
                delivery_status: 'delivered',
                actual_delivery_date: new Date().toISOString().split('T')[0]
            });

            // Add weight record
            await apiClient.post('/api/weights', {
                delivery_id: selectedDelivery,
                item_name: selectedDeliveryData?.item_name,
                total_weight: actualWeight,
                notes
            });

            setSuccess(true);
            toast.success('Delivery weighed and recorded successfully!');

            setTimeout(() => {
                router.push('/weights');
            }, 2000);

        } catch (err) {
            console.error('Error submitting weight record:', err);
            setError('Failed to submit weight record. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeliverySelect = (deliveryId: number | null) => {
        setSelectedDelivery(deliveryId);
        const delivery = deliveries.find(d => d.id === deliveryId) || null;
        setSelectedDeliveryData(delivery);
    };

    const handleIoTWeightSelect = (iotWeight: number) => {
        setActualWeight(iotWeight);
        toast.success(`Weight ${iotWeight} kg taken from IoT scale`);
    }; return (
        <DashboardLayout title="Weight Entry">
            <div className="max-w-4xl mx-auto">
                <StatusInfoCard role={user?.role} />

                {/* IoT Integration Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <IoTWeightDisplay 
                        showSelectButton={true} 
                        onWeightSelect={handleIoTWeightSelect}
                    />
                    <RFIDUserDisplay />
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Delivery Weight Entry</h1>
                    <p className="text-gray-600 mt-1">Weigh delivered items from suppliers</p>
                </div>

                {success && (
                    <div className="mb-6 bg-success-100 border border-success-300 text-success-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex">
                            <span className="font-medium">Delivery weighed successfully!</span>
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
                            Delivery Weight Entry
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Delivery to Weigh *
                                    </label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                        value={selectedDelivery || ''}
                                        onChange={(e) => handleDeliverySelect(Number(e.target.value) || null)}
                                        required
                                    >
                                        <option value="">-- Select Delivery --</option>
                                        {deliveries.map((delivery) => (
                                            <option key={delivery.id} value={delivery.id}>
                                                {delivery.item_name} - {delivery.suppliers?.name} (Expected: {delivery.expected_weight || 'N/A'} kg)
                                            </option>
                                        ))}
                                    </select>
                                    {deliveries.length === 0 && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            No deliveries available for weighing. Only shipped deliveries can be weighed.
                                        </p>
                                    )}
                                </div>

                                {selectedDeliveryData && (
                                    <div className="bg-gray-50 p-4 rounded-md">
                                        <h3 className="font-medium text-gray-900 mb-2">Delivery Details</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Item:</span>
                                                <span className="ml-2 font-medium">{selectedDeliveryData.item_name}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Supplier:</span>
                                                <span className="ml-2 font-medium">{selectedDeliveryData.suppliers?.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Expected Qty:</span>
                                                <span className="ml-2 font-medium">{selectedDeliveryData.expected_quantity}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Expected Weight:</span>
                                                <span className="ml-2 font-medium">{selectedDeliveryData.expected_weight || 'N/A'} kg</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Scheduled:</span>
                                                <span className="ml-2 font-medium">{formatDate(selectedDeliveryData.scheduled_date)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Status:</span>
                                                <span className="ml-2 font-medium text-blue-600">{selectedDeliveryData.delivery_status}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Actual Weight *
                                    </label>
                                    <div className="flex space-x-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Enter actual weight"
                                            value={actualWeight || ''}
                                            onChange={(e) => setActualWeight(parseFloat(e.target.value) || null)}
                                            required
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch('/api/iot/current-weight');
                                                    const data = await response.json();
                                                    if (data.weight && data.weight > 0) {
                                                        setActualWeight(data.weight);
                                                        toast.success(`IoT: ${data.weight} kg`);
                                                    } else {
                                                        toast.error('Invalid IoT data');
                                                    }
                                                } catch {
                                                    toast.error('IoT not available');
                                                }
                                            }}
                                            className="px-3"
                                        >
                                            IoT
                                        </Button>
                                        <span className="flex items-center px-3 text-gray-500">kg</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                        rows={3}
                                        placeholder="Any notes about the weighing process..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>



                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/deliveries')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || !selectedDelivery}
                                >
                                    {loading ? 'Processing...' : 'Complete Weighing'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
