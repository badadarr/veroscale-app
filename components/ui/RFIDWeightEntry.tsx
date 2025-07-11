import { useState, useEffect } from 'react';
import { CreditCard, Scale, Check, X, RefreshCw, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import IoTService, { RFIDRequest, IoTWeightData } from '@/lib/iot-service';

interface RFIDWeightEntryProps {
  onRecordSaved?: (record: any) => void;
  userId?: number;
}

interface RFIDEntry {
  device_id: string;
  waktu: string;
  weight?: number;
  processed: boolean;
  id?: string;
}

export default function RFIDWeightEntry({ onRecordSaved, userId }: RFIDWeightEntryProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rfidRequests, setRfidRequests] = useState<Record<string, RFIDRequest>>({});
  const [selectedEntry, setSelectedEntry] = useState<RFIDEntry | null>(null);
  const [currentWeight, setCurrentWeight] = useState<IoTWeightData | null>(null);
  const [manualWeight, setManualWeight] = useState<number | null>(null);
  const [unit, setUnit] = useState<string>('kg');
  const [source, setSource] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [deviceId] = useState<string>('ESP32_001');

  // Subscribe to RFID requests and weight data
  useEffect(() => {
    const unsubscribeRFID = IoTService.subscribeToRFIDRequests((requests) => {
      setRfidRequests(requests);
    });

    const unsubscribeWeight = IoTService.subscribeToWeightData(deviceId, (weightData) => {
      setCurrentWeight(weightData);
    });

    return () => {
      unsubscribeRFID();
      unsubscribeWeight();
    };
  }, [deviceId]);

  // Get recent RFID requests
  const getRecentRequests = () => {
    const entries = Object.entries(rfidRequests);
    return entries
      .map(([id, request]) => ({
        device_id: request.device_id,
        waktu: request.waktu,
        processed: request.processed || false,
        id
      }))
      .sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime())
      .slice(0, 10);
  };

  // Handle selecting an RFID entry
  const handleSelectEntry = (entry: RFIDEntry) => {
    setSelectedEntry(entry);
    // Auto-fill weight from current IoT data if available
    if (currentWeight) {
      setManualWeight(parseFloat(currentWeight.berat_terakhir));
    }
    setError(null);
  };

  // Format timestamp
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString('id-ID');
    } catch {
      return timeString;
    }
  };

  // Handle saving the record
  const handleSaveRecord = async () => {
    if (!selectedEntry || !manualWeight) {
      setError('Please select an RFID entry and enter a weight.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/weights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rfid_device_id: selectedEntry.device_id,
          total_weight: manualWeight,
          unit,
          source,
          destination,
          scan_time: selectedEntry.waktu,
          operator_id: userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save record');
      }

      const result = await response.json();
      setSuccess(true);

      // Mark RFID request as processed if we have the ID
      if (selectedEntry.id) {
        try {
          await IoTService.markRFIDRequestProcessed(selectedEntry.id);
        } catch (err) {
          console.warn('Could not mark RFID request as processed:', err);
        }
      }

      // Call callback if provided
      if (onRecordSaved) {
        onRecordSaved(result.record);
      }

      // Reset form after successful submission
      setTimeout(() => {
        setSuccess(false);
        setSelectedEntry(null);
        setManualWeight(null);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* RFID Requests Panel */}
      <Card className="shadow-md">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center text-blue-800">
            <CreditCard className="h-5 w-5 mr-2" />
            RFID Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {currentWeight && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Current Weight:</span>
                <span className="text-lg font-bold text-green-900">
                  {currentWeight.berat_terakhir} kg
                </span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                Device: {deviceId} • {formatTime(currentWeight.timestamp || '')}
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getRecentRequests().length > 0 ? (
              getRecentRequests().map((entry, index) => (
                <div
                  key={entry.id || index}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedEntry?.device_id === entry.device_id && selectedEntry?.waktu === entry.waktu
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectEntry(entry)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="font-medium">{entry.device_id}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(entry.waktu)}
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      entry.processed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.processed ? 'Processed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No RFID requests found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Waiting for RFID scans...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weight Entry Panel */}
      <Card className="shadow-md">
        <CardHeader className="bg-primary-50">
          <CardTitle className="flex items-center text-primary-800">
            <Scale className="h-5 w-5 mr-2" />
            Weight Entry Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {success && (
            <div className="mb-4 bg-success-100 border border-success-300 text-success-700 px-4 py-3 rounded relative">
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2" />
                <span className="font-medium">Weight record submitted successfully!</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-error-100 border border-error-300 text-error-700 px-4 py-3 rounded relative">
              <div className="flex items-center">
                <X className="h-5 w-5 mr-2" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {!selectedEntry ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No RFID entry selected</p>
              <p className="text-sm text-gray-400 mt-2">
                Select an RFID request from the list to process
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Device ID</p>
                    <p className="font-medium">{selectedEntry.device_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Scan Time</p>
                    <p className="font-medium">{formatTime(selectedEntry.waktu)}</p>
                  </div>
                </div>
                {currentWeight && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">IoT Scale Reading</p>
                    <p className="font-bold text-lg text-green-600">{currentWeight.berat_terakhir} kg</p>
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
                    value={manualWeight || ''}
                    onChange={(e) => setManualWeight(parseFloat(e.target.value) || null)}
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
                {currentWeight && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setManualWeight(parseFloat(currentWeight.berat_terakhir))}
                  >
                    Use IoT Reading ({currentWeight.berat_terakhir} kg)
                  </Button>
                )}
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
                    setSelectedEntry(null);
                    setManualWeight(null);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Selection
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
  );
}