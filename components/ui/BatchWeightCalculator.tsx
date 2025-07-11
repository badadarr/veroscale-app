import { useState, useEffect } from 'react';
import { Package2, Plus, Trash2, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { WeightCalculator, SampleReference } from '@/lib/weight-calculator';
import { toast } from 'react-hot-toast';

interface BatchItem {
  id: string;
  sample_id: number;
  sample_name: string;
  sample_weight: number;
  quantity: number;
  total_weight: number;
}

export default function BatchWeightCalculator() {
  const [samples, setSamples] = useState<SampleReference[]>([]);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [selectedSample, setSelectedSample] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<string>('1');

  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    const sampleData = await WeightCalculator.getSamplesByCategory();
    setSamples(sampleData);
  };

  const addToBatch = () => {
    if (!selectedSample) {
      toast.error('Pilih sample terlebih dahulu');
      return;
    }

    const sample = samples.find(s => s.id === selectedSample);
    const qty = parseInt(quantity) || 1;

    if (!sample) return;

    const newItem: BatchItem = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sample_id: sample.id,
      sample_name: `${sample.category} - ${sample.item}`,
      sample_weight: sample.sample_weight,
      quantity: qty,
      total_weight: sample.sample_weight * qty
    };

    setBatchItems([...batchItems, newItem]);
    setQuantity('1');
    toast.success(`Ditambahkan: ${newItem.sample_name} x${qty}`);
  };

  const removeFromBatch = (id: string) => {
    setBatchItems(batchItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    setBatchItems(batchItems.map(item => 
      item.id === id 
        ? { ...item, quantity: newQuantity, total_weight: item.sample_weight * newQuantity }
        : item
    ));
  };

  const getTotalWeight = () => {
    return batchItems.reduce((total, item) => total + item.total_weight, 0);
  };

  const clearBatch = () => {
    setBatchItems([]);
    toast.success('Batch dikosongkan');
  };

  return (
    <Card className="border-2 border-dashed border-purple-200 bg-purple-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-purple-800">
          <div className="flex items-center">
            <Package2 className="h-5 w-5 mr-2" />
            Batch Weight Calculator
          </div>
          {batchItems.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearBatch}>
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add Item Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select
              className="p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
              value={selectedSample || ''}
              onChange={(e) => setSelectedSample(parseInt(e.target.value) || null)}
            >
              <option value="">-- Select Sample --</option>
              {samples.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.category} - {sample.item} ({sample.sample_weight}kg)
                </option>
              ))}
            </select>
            
            <Input
              type="number"
              placeholder="Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="text-sm"
            />
            
            <Button
              onClick={addToBatch}
              disabled={!selectedSample}
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Batch Items */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {batchItems.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Package2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Belum ada item di batch</div>
              </div>
            ) : (
              batchItems.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-purple-900">
                        {item.sample_name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.sample_weight} kg × {item.quantity} = {item.total_weight.toFixed(2)} kg
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-sm"
                        min="1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromBatch(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          {batchItems.length > 0 && (
            <div className="bg-white p-3 rounded border-2 border-purple-300">
              <div className="flex justify-between items-center">
                <div className="font-medium text-purple-900">
                  Total Estimasi Berat:
                </div>
                <div className="text-lg font-bold text-purple-900">
                  {getTotalWeight().toFixed(2)} kg
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {batchItems.length} item(s) dalam batch
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}