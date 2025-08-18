import { useState, useEffect, useCallback } from "react";
import { Scale, Wifi, WifiOff, RefreshCw, Bug, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Button } from "./Button";
import IoTService, { IoTWeightData } from "@/lib/iot-service";

interface IoTWeightDisplayProps {
  deviceId?: string;
  onWeightSelect?: (weight: number) => void;
  showSelectButton?: boolean;
}

export default function IoTWeightDisplay({
  deviceId = "esp32_timbangan_001",
  onWeightSelect,
  showSelectButton = false,
}: IoTWeightDisplayProps) {
  const [weightData, setWeightData] = useState<IoTWeightData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [connectionLog, setConnectionLog] = useState<string[]>([]);
  const [dataHistory, setDataHistory] = useState<
    { weight: string; time: string }[]
  >([]);

  // Add to connection log
  const addToLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString("id-ID");
    setConnectionLog((prev) => [...prev.slice(-9), `${timestamp}: ${message}`]);
  }, []);

  useEffect(() => {
    addToLog("Memulai koneksi IoT...");

    const unsubscribe = IoTService.subscribeToWeightData(deviceId, (data) => {
      setWeightData(data);
      setIsConnected(true);
      const now = new Date();
      setLastUpdate(now);

      // Add to data history
      setDataHistory((prev) => [
        ...prev.slice(-9),
        {
          weight: data.weight,
          time: now.toLocaleTimeString("id-ID"),
        },
      ]);

      addToLog(`Data diterima: ${data.weight} kg`);
    });

    // Check connection status
    const connectionTimer = setInterval(() => {
      setIsConnected((prevConnected) => {
        if (lastUpdate && Date.now() - lastUpdate.getTime() > 10000) {
          if (prevConnected) {
            addToLog("Koneksi terputus (timeout 10s)");
            return false;
          }
        }
        return prevConnected;
      });
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(connectionTimer);
      addToLog("Koneksi ditutup");
    };
  }, [deviceId, lastUpdate, addToLog]);

  const handleSelectWeight = () => {
    if (weightData && onWeightSelect) {
      const weight = parseFloat(weightData.weight);
      if (!isNaN(weight)) {
        onWeightSelect(weight);
        addToLog(`Berat dipilih: ${weight} kg`);
      }
    }
  };

  // Test connection manually
  const testConnection = async () => {
    addToLog("Test koneksi manual...");
    try {
      const currentWeight = await IoTService.getCurrentWeight(deviceId);
      if (currentWeight) {
        addToLog(`Test berhasil: ${currentWeight.weight} kg`);
        setWeightData(currentWeight);
        setIsConnected(true);
        setLastUpdate(new Date());
      } else {
        addToLog("Test gagal: Tidak ada data");
      }
    } catch (error) {
      addToLog(
        `Test error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const formatWeight = (weight: string) => {
    const num = parseFloat(weight);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  return (
    <Card className="border-2 border-dashed border-primary-200 bg-primary-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-primary-800">
          <div className="flex items-center">
            <Scale className="w-5 h-5 mr-2" />
            Timbangan IoT Real-time
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className="p-1"
            >
              <Bug className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={testConnection}
              className="p-1"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`ml-1 text-xs ${
                isConnected ? "text-green-600" : "text-red-600"
              }`}
            >
              {isConnected ? "Terhubung" : "Terputus"}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="mb-2 text-4xl font-bold text-primary-900">
            {weightData ? formatWeight(weightData.weight) : "---.--"}
            <span className="ml-2 text-lg text-gray-600">kg</span>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Device: {deviceId}
            {lastUpdate && (
              <div className="mt-1 text-xs">
                Update terakhir: {lastUpdate.toLocaleTimeString("id-ID")}
              </div>
            )}
          </div>

          {showSelectButton && weightData && (
            <Button
              onClick={handleSelectWeight}
              size="sm"
              className="w-full mb-3"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Gunakan Berat Ini ({formatWeight(weightData.weight)} kg)
            </Button>
          )}

          {!isConnected && (
            <div className="mt-2 text-xs text-red-600">
              Periksa koneksi timbangan IoT
            </div>
          )}

          {/* Debug Panel */}
          {debugMode && (
            <div className="pt-4 mt-4 border-t">
              <div className="text-left">
                <h4 className="flex items-center mb-2 text-sm font-medium">
                  <Activity className="w-4 h-4 mr-1" />
                  Debug Info
                </h4>

                {/* Connection Log */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-700">
                    Connection Log:
                  </div>
                  <div className="h-24 p-2 overflow-y-auto font-mono text-xs text-green-400 bg-gray-900 rounded">
                    {connectionLog.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>

                {/* Data History */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-700">
                    Data History:
                  </div>
                  <div className="p-2 overflow-y-auto text-xs rounded bg-blue-50 max-h-20">
                    {dataHistory.map((entry, i) => (
                      <div key={i}>
                        {entry.time}: {entry.weight} kg
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    {isConnected ? "🟢 Online" : "🔴 Offline"}
                  </div>
                  <div>
                    <span className="font-medium">Data Count:</span>{" "}
                    {dataHistory.length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
