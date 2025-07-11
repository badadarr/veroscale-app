import IoTService from './iot-service';
import apiClient from './api';

export class AutoSampleCreator {
  private static instance: AutoSampleCreator;
  private isActive = false;
  private lastProcessedWeight: string | null = null;

  static getInstance(): AutoSampleCreator {
    if (!AutoSampleCreator.instance) {
      AutoSampleCreator.instance = new AutoSampleCreator();
    }
    return AutoSampleCreator.instance;
  }

  // Auto-create samples when weight data comes from IoT
  enableAutoSampleCreation(defaultCategory: string = 'IoT Material', defaultItem: string = 'Auto Sample') {
    if (this.isActive) return;

    this.isActive = true;
    
    const unsubscribe = IoTService.subscribeToWeightData('esp32_timbangan_001', async (data) => {
      const currentWeight = parseFloat(data.berat_terakhir);
      
      // Only create sample if weight is significant and different from last processed
      if (currentWeight > 0.1 && data.berat_terakhir !== this.lastProcessedWeight) {
        try {
          await this.createAutoSample(currentWeight, defaultCategory, defaultItem);
          this.lastProcessedWeight = data.berat_terakhir;
        } catch (error) {
          console.error('Auto sample creation failed:', error);
        }
      }
    });

    return unsubscribe;
  }

  private async createAutoSample(weight: number, category: string, item: string) {
    const sampleData = {
      category,
      item: `${item} - ${new Date().toLocaleTimeString('id-ID')}`,
      sample_weight: weight
    };

    await apiClient.post('/api/samples', sampleData);
  }

  disable() {
    this.isActive = false;
  }
}

export default AutoSampleCreator.getInstance();