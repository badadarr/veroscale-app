// Variance classification using percentage-only thresholds for consistency with DB triggers
// - Approve (auto_approved) if abs(variance%) < 5%
// - Warning (pending) if 5% <= abs(variance%) <= 10%
// - Critical (auto_rejected) if abs(variance%) > 10%

const THRESHOLD_PERCENT_APPROVE = 5.0; // <5%
const THRESHOLD_PERCENT_WARNING = 10.0; // 5-10%

export type VarianceStatus = "auto_approved" | "auto_rejected" | "pending";

export interface VarianceAnalysis {
  varianceKg: number;
  variancePercentage: number;
  status: VarianceStatus;
  reason: string;
  withinThreshold: boolean;
}

/**
 * Simple auto-approval based on fixed thresholds
 */
export function analyzeWeightVariance(
  iotWeight: number,
  expectedWeight: number
): VarianceAnalysis {
  // Skip very small weights
  if (expectedWeight < 0.1) {
    return {
      varianceKg: 0,
      variancePercentage: 0,
      status: "auto_approved",
      reason: "Sample too small for variance check",
      withinThreshold: true,
    };
  }

  const varianceKg = Math.abs(iotWeight - expectedWeight);
  const variancePercentage = Math.abs((varianceKg / expectedWeight) * 100);
  
  // Approve
  if (variancePercentage < THRESHOLD_PERCENT_APPROVE) {
    return {
      varianceKg,
      variancePercentage,
      status: "auto_approved",
      reason: `Variance OK: ${variancePercentage.toFixed(1)}% / ${varianceKg.toFixed(2)}kg (<${THRESHOLD_PERCENT_APPROVE}%)`,
      withinThreshold: true,
    };
  }

  // Warning (pending verification)
  if (variancePercentage <= THRESHOLD_PERCENT_WARNING) {
    return {
      varianceKg,
      variancePercentage,
      status: "pending",
      reason: `Warning: ${variancePercentage.toFixed(1)}% / ${varianceKg.toFixed(2)}kg (${THRESHOLD_PERCENT_APPROVE}-${THRESHOLD_PERCENT_WARNING}%)`,
      withinThreshold: false,
    };
  }

  // Critical (reject)
  return {
    varianceKg,
    variancePercentage,
    status: "auto_rejected",
    reason: `Critical variance: ${variancePercentage.toFixed(1)}% / ${varianceKg.toFixed(2)}kg (> ${THRESHOLD_PERCENT_WARNING}%)`,
    withinThreshold: false,
  };
}

/**
 * Get status color for UI
 */
export function getVarianceStatusColor(status: VarianceStatus): string {
  switch (status) {
    case "auto_approved":
      return "text-green-600 bg-green-50 border-green-200";
    case "auto_rejected":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

/**
 * Get status icon
 */
export function getVarianceStatusIcon(status: VarianceStatus): string {
  switch (status) {
    case "auto_approved":
      return "✅";
    case "auto_rejected":
      return "❌";
    default:
      return "⏳";
  }
}

/**
 * Format variance display
 */
export function formatVarianceDisplay(analysis: VarianceAnalysis): string {
  return `${analysis.varianceKg.toFixed(2)}kg (${analysis.variancePercentage.toFixed(1)}%)`;
}
