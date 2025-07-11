import { useState, useEffect } from 'react';
import { CreditCard, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import IoTService, { RFIDUser } from '@/lib/iot-service';

export default function RFIDUserDisplay() {
  const [rfidUsers, setRfidUsers] = useState<Record<string, RFIDUser>>({});
  const [lastScan, setLastScan] = useState<RFIDUser | null>(null);

  useEffect(() => {
    const unsubscribe = IoTService.subscribeToRFIDUsers((users) => {
      setRfidUsers(users);
      
      // Find the most recent scan
      const userEntries = Object.entries(users);
      if (userEntries.length > 0) {
        const mostRecent = userEntries.reduce((latest, [id, user]) => {
          const userTime = new Date(user.waktu).getTime();
          const latestTime = new Date(latest[1].waktu).getTime();
          return userTime > latestTime ? [id, user] : latest;
        });
        setLastScan(mostRecent[1]);
      }
    });

    return unsubscribe;
  }, []);

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString('id-ID');
    } catch {
      return timeString;
    }
  };

  const getRecentUsers = () => {
    const entries = Object.entries(rfidUsers);
    return entries
      .sort(([,a], [,b]) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime())
      .slice(0, 5);
  };

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-blue-800">
          <CreditCard className="h-5 w-5 mr-2" />
          RFID Users - Scan Terakhir
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lastScan ? (
          <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">
                  {lastScan.nama || 'Unknown User'}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(lastScan.waktu)}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Device: {lastScan.device_id}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            Belum ada scan RFID
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Riwayat Scan Terbaru:</h4>
          {getRecentUsers().length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {getRecentUsers().map(([id, user]) => (
                <div key={id} className="text-xs p-2 bg-white rounded border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{user.nama || 'Unknown'}</span>
                    <span className="text-gray-500">{formatTime(user.waktu)}</span>
                  </div>
                  <div className="text-gray-400">ID: {id}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-2">
              Tidak ada riwayat scan
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}