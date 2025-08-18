import { useState, useEffect } from 'react';
import { Play, Pause, Database, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import IoTWeightSync from '@/lib/iot-weight-sync';
import { toast } from 'react-hot-toast';

interface IoTAutoSyncProps {
  materialId?: number;
  materialName?: string;
}

export default function IoTAutoSync({ materialId, materialName }: IoTAutoSyncProps) {
  const [isAutoSyncActive, setIsAutoSyncActive] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const toggleAutoSync = () => {
    if (!materialId) {
      toast.error('Pilih material terlebih dahulu');
      return;
    }

    if (isAutoSyncActive) {
      IoTWeightSync.disableAutoSync();
      setIsAutoSyncActive(false);
      toast.success('Auto-sync dimatikan');
    } else {
      IoTWeightSync.enableAutoSync(materialId, 0.1);
      setIsAutoSyncActive(true);
      toast.success('Auto-sync diaktifkan');
    }
  };

  const manualSync = async () => {
    if (!materialId) {
      toast.error('Pilih material terlebih dahulu');
      return;
    }

    const success = await IoTWeightSync.syncCurrentWeight(materialId);
    if (success) {
      setSyncCount(prev => prev + 1);
      setLastSyncTime(new Date());
      toast.success('Data berat berhasil disinkronkan');
    } else {
      toast.error('Gagal sinkronisasi data');
    }
  };

  return (
    <Card className="border-2 border-dashed border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-orange-800">
          <Database className="h-5 w-5 mr-2" />
          Auto-Sync ke Database
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm">
            <div className="font-medium">Material: {materialName || 'Belum dipilih'}</div>
            <div className="text-gray-600">
              Status: {isAutoSyncActive ? 'Aktif' : 'Tidak aktif'}
            </div>
            {syncCount > 0 && (
              <div className="text-green-600 flex items-center mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                {syncCount} data tersinkronkan
              </div>
            )}
            {lastSyncTime && (
              <div className="text-xs text-gray-500 mt-1">
                Sync terakhir: {lastSyncTime.toLocaleTimeString('id-ID')}
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={toggleAutoSync}
              size="sm"
              variant={isAutoSyncActive ? "secondary" : "default"}
              className="flex-1"
            >
              {isAutoSyncActive ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Stop Auto-Sync
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Start Auto-Sync
                </>
              )}
            </Button>
            
            <Button
              onClick={manualSync}
              size="sm"
              variant="outline"
            >
              Sync Manual
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            Auto-sync akan menyimpan data berat ke database ketika ada perubahan ≥ 0.1 kg
          </div>
        </div>
      </CardContent>
    </Card>
  );
}