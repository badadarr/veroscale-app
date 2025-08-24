import { useState, useEffect, useRef } from "react";
import { Scale, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Button } from "./Button";
import IoTService, { IoTWeightData } from "@/lib/iot-service";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const lastUpdateRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = IoTService.subscribeToWeightData(deviceId, (data) => {
      setWeightData(data);
      setIsConnected(true);
      const now = new Date();
      setLastUpdate(now);
      lastUpdateRef.current = now.getTime();
    });
    return () => {
      unsubscribe();
    };
  }, [deviceId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const last = lastUpdateRef.current;
      if (!last) return;
      const offline = Date.now() - last > 10000;
      setIsConnected((prev) => (offline ? false : prev || true));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectWeight = () => {
    if (weightData && onWeightSelect) {
      const weight = parseFloat(weightData.weight);
      if (!isNaN(weight)) onWeightSelect(weight);
    }
  };

  const formatWeight = (weight: string) => {
    const num = parseFloat(weight);
    return isNaN(num) ? "0.000" : num.toFixed(3);
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
              {isConnected ? "Connected" : "Disconnected"}
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

          <div className="mb-1 text-sm text-gray-600">Device: {deviceId}</div>
          <div className="mb-4 text-xs text-gray-600">
            Accessed By: {user ? `${user.name} (${user.role})` : "—"}
            {lastUpdate && (
              <div className="mt-1">
                Current Time: {lastUpdate.toLocaleTimeString("id-ID")}
              </div>
            )}
          </div>

          {showSelectButton && weightData && (
            <Button
              onClick={handleSelectWeight}
              size="sm"
              className="w-full mb-3"
            >
              Get This Weight ({formatWeight(weightData.weight)} kg)
            </Button>
          )}

          {!isConnected && (
            <div className="mt-2 text-xs text-red-600">
              Check Connection IOT
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
