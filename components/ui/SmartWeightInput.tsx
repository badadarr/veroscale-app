import { useState, useEffect } from "react";
import { Scale, Zap } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import IoTService from "@/lib/iot-service";

interface SmartWeightInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  iotOnly?: boolean; // New prop to enforce IoT-only input
}

export default function SmartWeightInput({
  value,
  onChange,
  error,
  label = "Weight from IoT Scale (kg)",
  placeholder = "Use 'Get from IoT' to capture weight",
  iotOnly = true, // Default to IoT-only
}: SmartWeightInputProps) {
  const [iotWeight, setIotWeight] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    const unsubscribe = IoTService.subscribeToWeightData(
      "esp32_timbangan_001",
      (data) => {
        const weight = parseFloat(data.weight);
        setIotWeight(weight);
        setIsConnected(true);

        // Show suggestion if weight is stable and different from current value
        if (weight > 0.05 && weight.toString() !== value) {
          setShowSuggestion(true);
        }
      }
    );

    return unsubscribe;
  }, [value]);

  const useIoTWeight = () => {
    if (iotWeight) {
      onChange(iotWeight.toString());
      setShowSuggestion(false);
    }
  };

  const dismissSuggestion = () => {
    setShowSuggestion(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="relative">
        <div className="flex space-x-2">
          <Input
            type="number"
            step="0.01"
            placeholder={placeholder}
            value={value}
            onChange={iotOnly ? undefined : (e) => onChange(e.target.value)}
            readOnly={iotOnly}
            error={error}
            className={`flex-1 ${iotOnly ? "bg-gray-50" : ""}`}
          />

          <Button
            type="button"
            onClick={useIoTWeight}
            variant="outline"
            className="px-3 text-white bg-blue-500 hover:bg-blue-600"
            disabled={!iotWeight || iotWeight < 0.01}
          >
            From IoT
          </Button>

          <div className="flex items-center">
            {isConnected ? (
              <Scale className="w-4 h-4 text-green-600" />
            ) : (
              <Scale className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {iotOnly && value && (
          <div className="mt-1 text-xs text-green-600">
            ✅ Weight captured from IoT Scale: {value} kg
          </div>
        )}

        {showSuggestion && iotWeight && !iotOnly && (
          <div className="absolute left-0 right-0 z-10 p-3 mt-1 border border-blue-200 rounded-md shadow-sm top-full bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-blue-600" />
                <div>
                  <span className="text-sm text-blue-800">
                    Timbangan IoT: <strong>{iotWeight} kg</strong>
                  </span>
                  {(iotWeight < 0.05 || iotWeight > 1000) && (
                    <div className="text-xs text-orange-600">
                      ⚠️ Nilai tidak normal
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={useIoTWeight}
                  className="text-xs"
                  disabled={iotWeight < 0.01 || iotWeight > 1000}
                >
                  Gunakan
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={dismissSuggestion}
                  className="text-xs"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isConnected && iotWeight && (
        <div className="text-xs text-gray-500">
          Live: {iotWeight} kg dari timbangan IoT
        </div>
      )}
    </div>
  );
}
