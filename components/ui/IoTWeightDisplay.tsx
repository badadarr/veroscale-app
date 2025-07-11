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
          weight: data.berat_terakhir,
          time: now.toLocaleTimeString("id-ID"),
        },
      ]);

      addToLog(`Data diterima: ${data.berat_terakhir} kg`);
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
      const weight = parseFloat(weightData.berat_terakhir);
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
        addToLog(`Test berhasil: ${currentWeight.berat_terakhir} kg`);
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
            <Scale className="h-5 w-5 mr-2" />
            Timbangan IoT Real-time
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className="p-1"
            >
              <Bug className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={testConnection}
              className="p-1"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
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
          <div className="text-4xl font-bold text-primary-900 mb-2">
            {weightData ? formatWeight(weightData.berat_terakhir) : "---.--"}
            <span className="text-lg ml-2 text-gray-600">kg</span>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Device: {deviceId}
            {lastUpdate && (
              <div className="text-xs mt-1">
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
              <RefreshCw className="h-4 w-4 mr-2" />
              Gunakan Berat Ini ({formatWeight(weightData.berat_terakhir)} kg)
            </Button>
          )}

          {!isConnected && (
            <div className="text-xs text-red-600 mt-2">
              Periksa koneksi timbangan IoT
            </div>
          )}

          {/* Debug Panel */}
          {debugMode && (
            <div className="mt-4 border-t pt-4">
              <div className="text-left">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  Debug Info
                </h4>

                {/* Connection Log */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-700">
                    Connection Log:
                  </div>
                  <div className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono h-24 overflow-y-auto">
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
                  <div className="bg-blue-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
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
