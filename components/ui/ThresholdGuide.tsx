import React from "react";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

export type ThresholdGuideProps = {
  // Current variance percentage to highlight the zone (optional)
  variancePercentage?: number | null;
  className?: string;
};

// UI-only guide. Thresholds mirror lib/weight-variance-config.ts:
// - Safe: < 5%
// - Warning: 5% - 10%
// - Critical: > 10%
export default function ThresholdGuide({
  variancePercentage,
  className = "",
}: ThresholdGuideProps) {
  const SAFE_MAX = 5;
  const WARN_MAX = 10;

  const zone = (() => {
    if (variancePercentage == null || isNaN(variancePercentage)) return null;
    if (variancePercentage < SAFE_MAX) return "safe" as const;
    if (variancePercentage <= WARN_MAX) return "warning" as const;
    return "critical" as const;
  })();

  return (
    <div className={`rounded-lg border bg-white ${className}`}>
      <div className="flex items-center px-4 py-3 border-b">
        <Info className="w-4 h-4 mr-2 text-blue-600" />
        <h4 className="text-sm font-semibold text-gray-900">
          Weight Variance Thresholds
        </h4>
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
        <div
          className={`rounded-md border p-3 ${
            zone === "safe"
              ? "border-green-300 bg-green-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center mb-1">
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            <span className="text-sm font-medium text-green-800">Safe</span>
          </div>
          <div className="text-xs text-gray-700">Variance &lt; 5%</div>
          {zone === "safe" && variancePercentage != null && (
            <div className="mt-2 text-xs font-medium text-green-700">
              Current: {variancePercentage.toFixed(1)}%
            </div>
          )}
        </div>
        <div
          className={`rounded-md border p-3 ${
            zone === "warning"
              ? "border-yellow-300 bg-yellow-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center mb-1">
            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Warning</span>
          </div>
          <div className="text-xs text-gray-700">Variance 5% - 10%</div>
          {zone === "warning" && variancePercentage != null && (
            <div className="mt-2 text-xs font-medium text-yellow-700">
              Current: {variancePercentage.toFixed(1)}%
            </div>
          )}
        </div>
        <div
          className={`rounded-md border p-3 ${
            zone === "critical"
              ? "border-red-300 bg-red-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center mb-1">
            <XCircle className="w-4 h-4 mr-2 text-red-600" />
            <span className="text-sm font-medium text-red-800">Critical</span>
          </div>
          <div className="text-xs text-gray-700">Variance &gt; 10%</div>
          {zone === "critical" && variancePercentage != null && (
            <div className="mt-2 text-xs font-medium text-red-700">
              Current: {variancePercentage.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
