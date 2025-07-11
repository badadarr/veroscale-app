import { useState, useEffect } from 'react';
import { Clock, Scale, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import apiClient from '@/lib/api';

interface IoTWeightRecord {
  id: number;
  total_weight: number;
  unit: string;
  source: string;
  created_at: string;
  batch_number: string;
}

export default function IoTWeightHistory() {
  const [iotRecords, setIotRecords] = useState<IoTWeightRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIoTRecords();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchIoTRecords, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchIoTRecords = async () => {
    try {
      const { data } = await apiClient.get('/api/weights?source=IoT&limit=10');
      setIotRecords(data.weights || []);
    } catch (error) {
      console.error('Failed to fetch IoT records:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('id-ID');
  };

  return (
    <Card className="border-2 border-dashed border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-green-800">
          <Scale className="h-5 w-5 mr-2" />
          Riwayat Data IoT
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            <div className="text-sm text-gray-600 mt-2">Memuat data...</div>
          </div>
        ) : iotRecords.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {iotRecords.map((record) => (
              <div key={record.id} className="bg-white p-3 rounded border border-green-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-green-900">
                      {record.total_weight} {record.unit}
                    </div>
                    <div className="text-xs text-gray-600">
                      Batch: {record.batch_number}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-xs text-green-600">
                      <Wifi className="h-3 w-3 mr-1" />
                      {record.source}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(record.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Belum ada data dari IoT</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}