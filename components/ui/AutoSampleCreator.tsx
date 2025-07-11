import { useState } from 'react';
import { Play, Pause, Package, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import AutoSampleCreatorService from '@/lib/auto-sample-creator';
import { toast } from 'react-hot-toast';

export default function AutoSampleCreator() {
  const [isActive, setIsActive] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState('IoT Material');
  const [defaultItem, setDefaultItem] = useState('Auto Sample');
  const [showSettings, setShowSettings] = useState(false);

  const toggleAutoCreation = () => {
    if (isActive) {
      AutoSampleCreatorService.disable();
      setIsActive(false);
      toast.success('Auto-create samples dimatikan');
    } else {
      AutoSampleCreatorService.enableAutoSampleCreation(defaultCategory, defaultItem);
      setIsActive(true);
      toast.success('Auto-create samples diaktifkan');
    }
  };

  return (
    <Card className="border-2 border-dashed border-purple-200 bg-purple-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-purple-800">
          <div className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Auto-Create Samples
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showSettings && (
            <div className="space-y-3 p-3 bg-white rounded border">
              <Input
                label="Default Category"
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                placeholder="Category untuk auto samples"
              />
              <Input
                label="Default Item Prefix"
                value={defaultItem}
                onChange={(e) => setDefaultItem(e.target.value)}
                placeholder="Prefix nama item"
              />
            </div>
          )}

          <div className="text-sm">
            <div className="font-medium">Status: {isActive ? 'Aktif' : 'Tidak aktif'}</div>
            <div className="text-gray-600 text-xs mt-1">
              Otomatis buat sample ketika ada data berat dari IoT
            </div>
          </div>

          <Button
            onClick={toggleAutoCreation}
            size="sm"
            variant={isActive ? "secondary" : "default"}
            className="w-full"
          >
            {isActive ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Stop Auto-Create
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Start Auto-Create
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500">
            Sample akan dibuat otomatis dengan format: "{defaultItem} - [waktu]"
          </div>
        </div>
      </CardContent>
    </Card>
  );
}