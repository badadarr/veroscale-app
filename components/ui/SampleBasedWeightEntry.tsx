import { useState, useEffect } from 'react';
import { Calculator, Package, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { WeightCalculator, SampleReference, WeightCalculation } from '@/lib/weight-calculator';
import { toast } from 'react-hot-toast';

interface SampleBasedWeightEntryProps {
  onWeightCalculated?: (calculation: WeightCalculation) => void;
}

export default function SampleBasedWeightEntry({ onWeightCalculated }: SampleBasedWeightEntryProps) {
  const [samples, setSamples] = useState<SampleReference[]>([]);
  const [selectedSample, setSelectedSample] = useState<SampleReference | null>(null);
  const [actualWeight, setActualWeight] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [calculation, setCalculation] = useState<WeightCalculation | null>(null);

  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    const sampleData = await WeightCalculator.getSamplesByCategory();
    setSamples(sampleData);
  };

  const handleCalculate = () => {
    if (!selectedSample || !actualWeight) {
      toast.error('Pilih sample dan masukkan berat aktual');
      return;
    }

    const qty = parseInt(quantity) || 1;
    const weight = parseFloat(actualWeight);
    
    const calc = WeightCalculator.calculateWeight(
      selectedSample.sample_weight,
      weight,
      qty
    );
    
    calc.sample_id = selectedSample.id;
    setCalculation(calc);
    
    if (onWeightCalculated) {
      onWeightCalculated(calc);
    }
  };

  const handleEstimateQuantity = () => {
    if (!selectedSample || !actualWeight) return;
    
    const estimatedQty = WeightCalculator.estimateQuantity(
      selectedSample.sample_weight,
      parseFloat(actualWeight)
    );
    
    setQuantity(estimatedQty.toString());
    toast.success(`Estimasi quantity: ${estimatedQty} unit`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-orange-600';
      case 'under': return 'text-red-600';
      default: return 'text-green-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over': return <TrendingUp className="h-4 w-4" />;
      case 'under': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-blue-800">
          <Calculator className="h-5 w-5 mr-2" />
          Sample-Based Weight Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Sample Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Sample Reference
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={selectedSample?.id || ''}
              onChange={(e) => {
                const sample = samples.find(s => s.id === parseInt(e.target.value));
                setSelectedSample(sample || null);
              }}
            >
              <option value="">-- Select Sample --</option>
              {samples.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.category} - {sample.item} ({sample.sample_weight} kg)
                </option>
              ))}
            </select>
          </div>

          {/* Weight and Quantity Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Weight (kg)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter actual weight"
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEstimateQuantity}
                  disabled={!selectedSample || !actualWeight}
                >
                  Est
                </Button>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            disabled={!selectedSample || !actualWeight}
            className="w-full"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Weight
          </Button>

          {/* Calculation Results */}
          {calculation && (
            <div className="mt-4 p-3 bg-white rounded border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Calculation Results</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Expected Weight:</div>
                  <div className="font-medium">{(calculation.sample_weight * calculation.quantity).toFixed(2)} kg</div>
                </div>
                <div>
                  <div className="text-gray-600">Actual Weight:</div>
                  <div className="font-medium">{calculation.actual_weight.toFixed(2)} kg</div>
                </div>
                <div>
                  <div className="text-gray-600">Variance:</div>
                  <div className={`font-medium flex items-center ${getStatusColor(calculation.status)}`}>
                    {getStatusIcon(calculation.status)}
                    <span className="ml-1">{calculation.variance.toFixed(2)} kg</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Variance %:</div>
                  <div className={`font-medium ${getStatusColor(calculation.status)}`}>
                    {calculation.variance_percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Status: <span className={`font-medium ${getStatusColor(calculation.status)}`}>
                  {calculation.status.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}