import { useState, useEffect } from 'react';
import { Scale, Zap, RefreshCw } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import IoTService from '@/lib/iot-service';

interface SmartWeightInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
}

export default function SmartWeightInput({ 
  value, 
  onChange, 
  error, 
  label = "Weight (kg)",
  placeholder = "Enter weight"
}: SmartWeightInputProps) {
  const [iotWeight, setIotWeight] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    const unsubscribe = IoTService.subscribeToWeightData('esp32_timbangan_001', (data) => {
      const weight = parseFloat(data.berat_terakhir);
      setIotWeight(weight);
      setIsConnected(true);
      
      // Show suggestion if weight is stable and different from current value
      if (weight > 0.05 && weight.toString() !== value) {
        setShowSuggestion(true);
      }
    });

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
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="relative">
        <div className="flex space-x-2">
          <Input
            type="number"
            step="0.01"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            className="flex-1"
          />
          
          <div className="flex items-center">
            {isConnected ? (
              <Scale className="h-4 w-4 text-green-600" />
            ) : (
              <Scale className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {showSuggestion && iotWeight && (
          <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-blue-600 mr-2" />
                <div>
                  <span className="text-sm text-blue-800">
                    Timbangan IoT: <strong>{iotWeight} kg</strong>
                  </span>
                  {(iotWeight < 0.05 || iotWeight > 1000) && (
                    <div className="text-xs text-orange-600">⚠️ Nilai tidak normal</div>
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