import React from "react";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

interface WeightVarianceDisplayProps {
  iotWeight?: number;
  managerWeight?: number;
  variance?: number;
  variancePercentage?: number;
  varianceStatus?: "normal" | "warning" | "critical";
  compact?: boolean;
}

const WeightVarianceDisplay: React.FC<WeightVarianceDisplayProps> = ({
  iotWeight,
  managerWeight,
  variance,
  variancePercentage,
  varianceStatus,
  compact = false,
}) => {
  // Calculate values if not provided
  const calculatedVariance =
    variance ?? (iotWeight && managerWeight ? iotWeight - managerWeight : null);
  const calculatedPercentage =
    variancePercentage ??
    (calculatedVariance !== null && managerWeight && managerWeight !== 0
      ? (calculatedVariance / managerWeight) * 100
      : null);

  const status =
    varianceStatus ??
    (calculatedPercentage !== null
      ? Math.abs(calculatedPercentage) >= 10
        ? "critical"
        : Math.abs(calculatedPercentage) >= 5
        ? "warning"
        : "normal"
      : "normal");

  // If no variance data available, don't render
  if (!iotWeight || !managerWeight || calculatedVariance === null) {
    return null;
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "critical":
        return {
          icon: AlertTriangle,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          badgeColor: "bg-red-100 text-red-700",
        };
      case "warning":
        return {
          icon: AlertCircle,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
          badgeColor: "bg-yellow-100 text-yellow-700",
        };
      default:
        return {
          icon: CheckCircle,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
          badgeColor: "bg-green-100 text-green-700",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center px-2 py-1 rounded text-xs ${config.badgeColor}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {calculatedVariance > 0 ? "+" : ""}
        {calculatedVariance.toFixed(2)}kg (
        {calculatedPercentage && calculatedPercentage > 0 ? "+" : ""}
        {calculatedPercentage?.toFixed(1)}%)
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} ${config.textColor}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Icon className="w-4 h-4 mr-2" />
          <span className="font-medium text-sm">Weight Variance</span>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${config.badgeColor}`}
        >
          {status.toUpperCase()}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs opacity-75">IoT Weight</div>
          <div className="font-medium">{iotWeight.toFixed(2)} kg</div>
        </div>
        <div>
          <div className="text-xs opacity-75">Manager Weight</div>
          <div className="font-medium">{managerWeight.toFixed(2)} kg</div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-current border-opacity-20">
        <div className="text-sm">
          <span className="font-medium">Variance:</span>{" "}
          {calculatedVariance > 0 ? "+" : ""}
          {calculatedVariance.toFixed(2)} kg (
          {calculatedPercentage && calculatedPercentage > 0 ? "+" : ""}
          {calculatedPercentage?.toFixed(1)}%)
        </div>
        {Math.abs(calculatedPercentage || 0) >= 5 && (
          <div className="text-xs mt-1 opacity-75">
            ⚠️ Manual verification recommended
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightVarianceDisplay;
