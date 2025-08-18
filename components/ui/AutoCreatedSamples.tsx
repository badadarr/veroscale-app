import { useState, useEffect } from 'react';
import { Package, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import apiClient from '@/lib/api';

interface AutoSample {
  id: number;
  category: string;
  item: string;
  sample_weight: number;
  created_at: string;
}

export default function AutoCreatedSamples() {
  const [autoSamples, setAutoSamples] = useState<AutoSample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAutoSamples();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchAutoSamples, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAutoSamples = async () => {
    try {
      const { data } = await apiClient.get('/api/samples?category=IoT&limit=5');
      setAutoSamples(data.samples || []);
    } catch (error) {
      console.error('Failed to fetch auto samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('id-ID');
  };

  return (
    <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-indigo-800">
          <Zap className="h-5 w-5 mr-2" />
          Auto-Created Samples
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : autoSamples.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {autoSamples.map((sample) => (
              <div key={sample.id} className="bg-white p-3 rounded border border-indigo-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-indigo-900">
                      {sample.item}
                    </div>
                    <div className="text-sm text-gray-600">
                      {sample.category} • {sample.sample_weight} kg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-xs text-indigo-600">
                      <Package className="h-3 w-3 mr-1" />
                      #{sample.id}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(sample.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Belum ada auto samples</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}