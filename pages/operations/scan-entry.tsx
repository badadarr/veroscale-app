import { useState, useRef, useEffect } from 'react';
import { Barcode, Scale, Check, X, Camera, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

interface ScannedMaterial {
    id: number;
    name: string;
    standard_weight: number;
    batch?: string;
    code: string;
}

export default function ScanEntry() {
    const { user } = useAuth();
    const [scanActive, setScanActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scannedMaterial, setScannedMaterial] = useState<ScannedMaterial | null>(null);
    const [weight, setWeight] = useState<number | null>(null);
    const [unit, setUnit] = useState<string>('kg');
    const [source, setSource] = useState<string>('');
    const [destination, setDestination] = useState<string>('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const scannerRef = useRef<HTMLDivElement>(null);

    // Function to simulate scanning a QR code
    const simulateScan = () => {
        // In a real implementation, this would be handled by a barcode/QR scanner library
        // like zxing or quagga.js
        setLoading(true);

        // Simulate delay for scanning
        setTimeout(() => {
            const materials = [
                { id: 1, name: 'Metal Sheet', standard_weight: 12.5, code: 'METAL-SHEET-001', batch: 'B2025-05-01' },
                { id: 2, name: 'Steel Rod Bundle', standard_weight: 35.5, code: 'STEEL-ROD-002' },
                { id: 3, name: 'Concrete Block', standard_weight: 22.7, code: 'CONCRETE-BLOCK-003' },
            ];

            // Randomly select a material to simulate scanning
            const randomMaterial = materials[Math.floor(Math.random() * materials.length)];
            setScannedMaterial(randomMaterial);
            setLoading(false);

            // Automatically set standard weight as default
            setWeight(randomMaterial.standard_weight);

            // If batch info is in QR, populate batch field
            if (randomMaterial.batch) {
                // This would be handled in a real implementation
            }

            // Stop camera after successful scan
            setScanActive(false);
            stopCamera();
        }, 2000);
    };

    // Function to start the camera for scanning
    const startCamera = async () => {
        if (videoRef.current) {
            try {
                const constraints = {
                    video: {
                        facingMode: 'environment', // Use back camera on mobile devices
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                videoRef.current.srcObject = stream;
                setScanActive(true);

                // In a real implementation, you would initialize your scanner library here
                // For example, with ZXing:
                // const codeReader = new BrowserMultiFormatReader();
                // codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
                //   if (result) {
                //     // Handle the scanned QR code result
                //     handleScannedCode(result.getText());
                //   }
                // });

                // For this demo, we'll just simulate a scan after a delay
                setTimeout(simulateScan, 3000);

            } catch (err) {
                console.error('Error accessing camera:', err);
                setError('Could not access camera. Please check permissions and try again.');
            }
        }
    };

    // Function to stop the camera
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();

            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setScanActive(false);
        }
    };

    // Function to handle saving the record
    const handleSaveRecord = async () => {
        if (!scannedMaterial || !weight) {
            setError('Please scan a material and enter a weight.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // In a real implementation, this would call your API
            // await apiClient.post('/api/weights', {
            //   item_id: scannedMaterial.id,
            //   total_weight: weight,
            //   unit,
            //   source,
            //   destination,
            //   barcode: scannedMaterial.code
            // });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSuccess(true);

            // Reset form after successful submission
            setTimeout(() => {
                setSuccess(false);
                setScannedMaterial(null);
                setWeight(null);
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

    // Clean up camera when component unmounts
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <DashboardLayout title="Scan Entry">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Barcode/QR Code Scanner</h1>
                    <p className="text-gray-600 mt-1">
                        Scan material barcodes or QR codes to quickly enter weight records
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-md">
                        <CardHeader className="bg-primary-50">
                            <CardTitle className="flex items-center text-primary-800">
                                <Camera className="h-5 w-5 mr-2" />
                                Scanner
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div
                                ref={scannerRef}
                                className="relative w-full h-64 md:h-80 bg-gray-100 rounded-md overflow-hidden mb-4"
                            >
                                {scanActive ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            className="absolute top-0 left-0 w-full h-full object-cover"
                                            autoPlay
                                            playsInline
                                        ></video>
                                        <div className="absolute inset-0 border-2 border-primary-500 opacity-50 pointer-events-none"></div>
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary-500 pointer-events-none"></div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <Barcode className="h-16 w-16 text-gray-400 mb-4" />
                                        <p className="text-gray-500">
                                            {scannedMaterial ? 'Scan completed' : 'Camera inactive'}
                                        </p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center">
                                {!scanActive ? (
                                    <Button
                                        onClick={startCamera}
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        <Barcode className="h-4 w-4 mr-2" />
                                        Start Scanner
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={stopCamera}
                                        variant="secondary"
                                        className="w-full"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel Scan
                                    </Button>
                                )}
                            </div>

                            {!scanActive && !scannedMaterial && (
                                <div className="mt-4 p-3 bg-info-50 border border-info-200 rounded-md text-info-800 text-sm">
                                    <p>
                                        <strong>Tip:</strong> Position the barcode or QR code within the scanning area when the scanner is active.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-md">
                        <CardHeader className="bg-primary-50">
                            <CardTitle className="flex items-center text-primary-800">
                                <Scale className="h-5 w-5 mr-2" />
                                Scanned Material Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {!scannedMaterial ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No material scanned yet</p>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Start the scanner to scan a barcode or QR code
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-xs text-gray-500">Material ID</p>
                                                <p className="font-medium">{scannedMaterial.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Code</p>
                                                <p className="font-medium">{scannedMaterial.code}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500">Material Name</p>
                                            <p className="font-bold text-lg">{scannedMaterial.name}</p>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500">Standard Weight</p>
                                            <p className="font-medium">{scannedMaterial.standard_weight} kg</p>
                                        </div>
                                        {scannedMaterial.batch && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500">Batch Number</p>
                                                <p className="font-medium">{scannedMaterial.batch}</p>
                                            </div>
                                        )}
                                    </div>

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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Source
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="Source location"
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
                                                placeholder="Destination"
                                                value={destination}
                                                onChange={(e) => setDestination(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between mt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setScannedMaterial(null);
                                                setWeight(null);
                                            }}
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Scan Another
                                        </Button>
                                        <Button
                                            onClick={handleSaveRecord}
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : 'Save Record'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
