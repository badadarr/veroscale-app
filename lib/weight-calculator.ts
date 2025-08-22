import apiClient from "./api";

interface DeliveryData {
  id: number;
  item_name: string;
  [key: string]: unknown;
}

export interface SampleReference {
  id: number;
  category: string;
  item: string;
  sample_weight: number;
  source?: string;
  destination?: string;
  supplier_name?: string;
  delivery_id?: number;
}

export interface WeightCalculation {
  sample_id: number;
  sample_weight: number;
  actual_weight: number;
  quantity: number;
  variance: number;
  variance_percentage: number;
  status: "normal" | "over" | "under";
  delivery_id?: number;
}

export class WeightCalculator {
  static async getSamplesByCategory(
    category?: string
  ): Promise<SampleReference[]> {
    try {
      // Fetch all samples
      const { data: samplesData } = await apiClient.get(
        `/api/samples${category ? `?category=${category}` : ""}`
      );
      const allSamples = samplesData.samples || [];

      // Fetch deliveries with in_transit status
      const { data: deliveriesData } = await apiClient.get(
        "/api/deliveries?status=in_transit"
      );
      const inTransitDeliveries = deliveriesData.deliveries || [];

      // Filter samples that match item names in in_transit deliveries
      if (inTransitDeliveries.length > 0) {
        const inTransitItemNames = inTransitDeliveries.map(
          (d: DeliveryData) => d.item_name
        );
        const filteredSamples = allSamples.filter((sample: SampleReference) => {
          const sampleFullName = `${sample.category} - ${sample.item}`;
          return inTransitItemNames.includes(sampleFullName);
        });

        // Add delivery_id to samples
        return filteredSamples.map((sample: SampleReference) => {
          const sampleFullName = `${sample.category} - ${sample.item}`;
          const matchingDelivery = inTransitDeliveries.find(
            (d: DeliveryData) => d.item_name === sampleFullName
          );
          return {
            ...sample,
            delivery_id: matchingDelivery ? matchingDelivery.id : null,
          };
        });
      } else {
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch samples:", error);
      return [];
    }
  }

  static calculateWeight(
    sampleWeight: number,
    actualWeight: number,
    quantity: number = 1
  ): WeightCalculation {
    const expectedWeight = sampleWeight * quantity;
    const variance = actualWeight - expectedWeight;
    const variancePercentage = (variance / expectedWeight) * 100;

    let status: "normal" | "over" | "under" = "normal";
    if (Math.abs(variancePercentage) > 5) {
      status = variance > 0 ? "over" : "under";
    }

    return {
      sample_id: 0,
      sample_weight: sampleWeight,
      actual_weight: actualWeight,
      quantity,
      variance,
      variance_percentage: variancePercentage,
      status,
    };
  }

  static estimateQuantity(sampleWeight: number, totalWeight: number): number {
    return Math.round(totalWeight / sampleWeight);
  }

  static calculateBatchTotal(
    items: Array<{ sample_weight: number; quantity: number }>
  ): number {
    return items.reduce(
      (total, item) => total + item.sample_weight * item.quantity,
      0
    );
  }
}
