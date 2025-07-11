import { useState } from 'react';
import { Check, X } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import RFIDWeightEntry from '@/components/ui/RFIDWeightEntry';

export default function ScanEntry() {
    const { user } = useAuth();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle successful record save
    const handleRecordSaved = (record: any) => {
        setSuccess(true);
        setError(null);
        
        // Reset success message after 3 seconds
        setTimeout(() => {
            setSuccess(false);
        }, 3000);
    };



    return (
        <DashboardLayout title="Scan Entry">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">RFID Scan Entry</h1>
                    <p className="text-gray-600 mt-1">
                        Process RFID scan requests and record weights from IoT scale
                    </p>
                </div>

                {success && (
                    <div className="mb-6 bg-success-100 border border-success-300 text-success-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex items-center">
                            <Check className="h-5 w-5 mr-2" />
                            <span className="font-medium">Weight record submitted successfully!</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-error-100 border border-error-300 text-error-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex items-center">
                            <X className="h-5 w-5 mr-2" />
                            <span className="font-medium">{error}</span>
                        </div>
                    </div>
                )}

                <RFIDWeightEntry 
                    onRecordSaved={handleRecordSaved}
                    userId={user?.id}
                />
            </div>
        </DashboardLayout>
    );
}
