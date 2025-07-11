import IoTService, { IoTWeightData } from './iot-service';
import apiClient from './api';

export class IoTWeightSync {
  private static instance: IoTWeightSync;
  private isAutoSyncEnabled = false;
  private lastSyncedWeight: string | null = null;

  static getInstance(): IoTWeightSync {
    if (!IoTWeightSync.instance) {
      IoTWeightSync.instance = new IoTWeightSync();
    }
    return IoTWeightSync.instance;
  }

  // Auto sync weight data to database when weight changes significantly
  enableAutoSync(materialId: number, threshold: number = 0.1) {
    if (this.isAutoSyncEnabled) return;

    this.isAutoSyncEnabled = true;
    
    const unsubscribe = IoTService.subscribeToWeightData('esp32_timbangan_001', async (data) => {
      const currentWeight = parseFloat(data.berat_terakhir);
      const lastWeight = this.lastSyncedWeight ? parseFloat(this.lastSyncedWeight) : 0;
      
      // Only sync if weight change is significant
      if (Math.abs(currentWeight - lastWeight) >= threshold && currentWeight > 0.05) {
        try {
          await this.syncWeightToDatabase(materialId, currentWeight);
          this.lastSyncedWeight = data.berat_terakhir;
        } catch (error) {
          console.error('Auto sync failed:', error);
        }
      }
    });

    return unsubscribe;
  }

  // Manually sync current weight to database
  async syncCurrentWeight(materialId: number): Promise<boolean> {
    try {
      const weightData = await IoTService.getCurrentWeight('esp32_timbangan_001');
      if (weightData) {
        const weight = parseFloat(weightData.berat_terakhir);
        if (weight > 0) {
          await this.syncWeightToDatabase(materialId, weight);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    }
  }

  // Sync weight data to weights table
  private async syncWeightToDatabase(materialId: number, weight: number) {
    const weightRecord = {
      item_id: materialId,
      total_weight: weight,
      unit: 'kg',
      source: 'IoT_ESP32',
      destination: 'Warehouse',
      batch_number: `IOT_${Date.now()}`,
      notes: 'Auto-synced from IoT scale',
      recorded_by: 'IoT_System'
    };

    await apiClient.post('/api/weights', weightRecord);
  }

  disableAutoSync() {
    this.isAutoSyncEnabled = false;
  }
}

export default IoTWeightSync.getInstance();