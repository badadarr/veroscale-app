import apiClient from './api';

export interface SampleReference {
  id: number;
  category: string;
  item: string;
  sample_weight: number;
}

export interface WeightCalculation {
  sample_id: number;
  sample_weight: number;
  actual_weight: number;
  quantity: number;
  variance: number;
  variance_percentage: number;
  status: 'normal' | 'over' | 'under';
}

export class WeightCalculator {
  static async getSamplesByCategory(category?: string): Promise<SampleReference[]> {
    try {
      const { data } = await apiClient.get(`/api/samples${category ? `?category=${category}` : ''}`);
      return data.samples || [];
    } catch (error) {
      console.error('Failed to fetch samples:', error);
      return [];
    }
  }

  static calculateWeight(sampleWeight: number, actualWeight: number, quantity: number = 1): WeightCalculation {
    const expectedWeight = sampleWeight * quantity;
    const variance = actualWeight - expectedWeight;
    const variancePercentage = (variance / expectedWeight) * 100;
    
    let status: 'normal' | 'over' | 'under' = 'normal';
    if (Math.abs(variancePercentage) > 5) {
      status = variance > 0 ? 'over' : 'under';
    }

    return {
      sample_id: 0,
      sample_weight: sampleWeight,
      actual_weight: actualWeight,
      quantity,
      variance,
      variance_percentage: variancePercentage,
      status
    };
  }

  static estimateQuantity(sampleWeight: number, totalWeight: number): number {
    return Math.round(totalWeight / sampleWeight);
  }

  static calculateBatchTotal(items: Array<{ sample_weight: number; quantity: number }>): number {
    return items.reduce((total, item) => total + (item.sample_weight * item.quantity), 0);
  }
}