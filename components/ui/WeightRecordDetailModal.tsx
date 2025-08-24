import React, { useEffect } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Scale,
  Target,
  Activity,
  X,
  Printer,
} from "lucide-react";
import WeightVarianceDisplay from "./WeightVarianceDisplay";

interface WeightRecordDetailModalProps {
  record: {
    id: number;
    record_id: number;
    item_name: string;
    total_weight: number;
    iot_weight?: number;
    manager_weight?: number;
    weight_variance?: number;
    weight_variance_percentage?: number;
    variance_status?: "normal" | "warning" | "critical";
    iot_device_id?: string;
    verification_required?: boolean;
    timestamp: string;
    status: string;
    user_name?: string;
    notes?: string;
    unit?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const WeightRecordDetailModal: React.FC<WeightRecordDetailModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleEscPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscPress);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscPress);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle click outside modal to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Enhanced print function with better formatting
  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Weight Record Report - ${record.item_name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
              padding: 20px;
            }
            
            .report-container {
              max-width: 800px;
              margin: 0 auto;
            }
            
            .report-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
            }
            
            .company-logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            
            .report-title {
              font-size: 28px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 5px;
            }
            
            .report-subtitle {
              font-size: 16px;
              color: #6b7280;
              margin-bottom: 10px;
            }
            
            .report-date {
              font-size: 14px;
              color: #9ca3af;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            
            .info-card {
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              background: #f9fafb;
            }
            
            .info-card h3 {
              font-size: 16px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
            }
            
            .info-card .icon {
              width: 20px;
              height: 20px;
              margin-right: 8px;
              background: #2563eb;
              border-radius: 4px;
              display: inline-block;
            }
            
            .weight-display {
              font-size: 36px;
              font-weight: bold;
              color: #1f2937;
              text-align: center;
              margin: 20px 0;
            }
            
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            .details-table th,
            .details-table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .details-table th {
              background: #f3f4f6;
              font-weight: bold;
              color: #374151;
            }
            
            .status-badge {
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            
            .status-approved {
              background: #dcfce7;
              color: #166534;
            }
            
            .status-pending {
              background: #fef3c7;
              color: #92400e;
            }
            
            .variance-section {
              margin: 30px 0;
              padding: 20px;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              background: #f9fafb;
            }
            
            .variance-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            
            .variance-card {
              text-align: center;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #d1d5db;
              background: white;
            }
            
            .variance-card h4 {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            
            .variance-card .value {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
            }
            
            .variance-critical {
              border-color: #ef4444;
              background: #fef2f2;
            }
            
            .variance-warning {
              border-color: #f59e0b;
              background: #fffbeb;
            }
            
            .variance-normal {
              border-color: #10b981;
              background: #f0fdf4;
            }
            
            .notes-section {
              margin: 30px 0;
              padding: 20px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              background: #f9fafb;
            }
            
            .notes-section h3 {
              margin-bottom: 15px;
              color: #374151;
            }
            
            .report-footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              .report-container {
                max-width: none;
              }
              
              .info-grid {
                grid-template-columns: 1fr 1fr;
              }
              
              .variance-grid {
                grid-template-columns: repeat(3, 1fr);
              }
              
              @page {
                margin: 1in;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <!-- Header -->
            <div class="report-header">
              <div class="company-logo">🏭 VeroScale WeightTracker</div>
              <h1 class="report-title">Weight Record Report</h1>
              <p class="report-subtitle">${record.item_name}</p>
              <p class="report-date">Generated on ${new Date().toLocaleDateString(
                "id-ID",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}</p>
            </div>

            <!-- Basic Information -->
            <div class="info-grid">
              <div class="info-card">
                <h3><span class="icon"></span>IoT Scale Measurement</h3>
                <div class="weight-display">${record.total_weight} ${
      record.unit || "kg"
    }</div>
                <p style="text-align: center; color: #6b7280; font-size: 14px;">
                  Automated measurement from IoT scale
                </p>
              </div>
              
              <div class="info-card">
                <h3><span class="icon"></span>Record Information</h3>
                <table class="details-table">
                  <tr>
                    <th>Record ID</th>
                    <td>#${record.record_id}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>
                      <span class="status-badge ${
                        record.status === "approved"
                          ? "status-approved"
                          : "status-pending"
                      }">
                        ${record.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Timestamp</th>
                    <td>${new Date(record.timestamp).toLocaleString(
                      "id-ID"
                    )}</td>
                  </tr>
                  ${
                    record.user_name
                      ? `
                  <tr>
                    <th>Operator</th>
                    <td>${record.user_name}</td>
                  </tr>
                  `
                      : ""
                  }
                  ${
                    record.iot_device_id
                      ? `
                  <tr>
                    <th>IoT Device</th>
                    <td style="font-family: monospace; font-size: 12px;">${record.iot_device_id}</td>
                  </tr>
                  `
                      : ""
                  }
                </table>
              </div>
            </div>

            ${
              record.iot_weight || record.manager_weight
                ? `
            <!-- Variance Analysis -->
            <div class="variance-section">
              <h3 style="margin-bottom: 20px; color: #374151; font-size: 18px;">
                📊 Weight Variance Analysis
              </h3>
              
              <div class="variance-grid">
                ${
                  record.iot_weight
                    ? `
                <div class="variance-card">
                  <h4>IoT Scale Data</h4>
                  <div class="value" style="color: #059669;">${record.iot_weight} kg</div>
                  <p style="font-size: 11px; color: #6b7280; margin-top: 5px;">Same as recorded</p>
                </div>
                `
                    : ""
                }
                
                ${
                  record.manager_weight
                    ? `
                <div class="variance-card">
                  <h4>Target Weight</h4>
                  <div class="value" style="color: #d97706;">${record.manager_weight} kg</div>
                  <p style="font-size: 11px; color: #6b7280; margin-top: 5px;">Expected delivery</p>
                </div>
                `
                    : ""
                }
                
                ${
                  record.weight_variance !== undefined
                    ? `
                <div class="variance-card variance-${record.variance_status}">
                  <h4>Variance</h4>
                  <div class="value" style="color: ${
                    record.variance_status === "critical"
                      ? "#dc2626"
                      : record.variance_status === "warning"
                      ? "#d97706"
                      : "#059669"
                  };">
                    ${
                      record.weight_variance > 0 ? "+" : ""
                    }${record.weight_variance.toFixed(2)} kg
                  </div>
                  <p style="font-size: 11px; color: #6b7280; margin-top: 5px;">
                    ${
                      record.weight_variance_percentage !== undefined
                        ? `${
                            record.weight_variance_percentage > 0 ? "+" : ""
                          }${record.weight_variance_percentage.toFixed(1)}%`
                        : ""
                    }
                  </p>
                </div>
                `
                    : ""
                }
              </div>

              <!-- Analysis Summary -->
              <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #2563eb;">
                <h4 style="color: #374151; margin-bottom: 8px;">Analysis Summary:</h4>
                <p style="font-size: 14px; color: #4b5563;">
                  ${
                    record.variance_status === "critical"
                      ? "🔴 Critical variance detected (≥10%). The measured weight differs significantly from the expected target, suggesting a potential calibration, packaging/contents, or process issue. This record is automatically rejected. Please verify scale calibration, confirm item and packaging integrity, review recent process changes, and perform a reweigh if needed."
                      : record.variance_status === "warning"
                      ? "🟡 Warning variance detected (5–10%). The measured weight shows a moderate deviation from the expected target. For traceability, this record is automatically rejected. Check sampling method and tare (container/lining), ensure stable weighing conditions, and consider reweighing to confirm."
                      : "🟢 Normal variance detected (<5%). The measured weight aligns well with the expected target and is within tolerance. No further action is required."
                  }
                </p>
                ${
                  record.verification_required
                    ? `
                <div style="margin-top: 10px; padding: 10px; background: #fef3c7; border-radius: 4px;">
                  <strong style="color: #92400e;">⚠️ Manual Verification Required</strong>
                </div>
                `
                    : ""
                }
              </div>
            </div>
            `
                : ""
            }

            ${
              record.notes
                ? `
            <!-- Notes -->
            <div class="notes-section">
              <h3>📝 Additional Notes</h3>
              <p style="color: #4b5563;">${record.notes}</p>
            </div>
            `
                : ""
            }

            <!-- Footer -->
            <div class="report-footer">
              <p>This report was automatically generated by VeroScale WeightTracker System</p>
              <p>Report ID: WR-${record.record_id}-${Date.now()}</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-4xl mx-4 overflow-hidden bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Scale className="w-7 h-7 mr-3 text-blue-600" />
                Weight Record Details
              </h2>
              <p className="mt-1 text-lg font-medium text-blue-700">
                {record.item_name}
              </p>
              <p className="text-sm text-gray-600">
                Record #{record.record_id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 transition-all duration-200 rounded-full hover:bg-white/80 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Weight Information Grid - Enhanced */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Recorded Weight from IoT Scale */}
            <div className="p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-blue-600 rounded-lg mr-3">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Weight from IoT Scale
                  </h3>
                  <p className="text-sm text-blue-600">Automated measurement</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-800">
                {record.total_weight} {record.unit || "kg"}
              </div>
            </div>

            {/* Record Details */}
            <div className="p-6 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="mb-4 font-semibold text-gray-900 flex items-center">
                <div className="p-2 bg-gray-600 rounded-lg mr-3">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                Record Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Status:</span>
                  <span
                    className={`font-semibold px-3 py-1 rounded-full text-xs ${
                      record.status === "approved"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : record.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        : "bg-gray-100 text-gray-800 border border-gray-200"
                    }`}
                  >
                    {record.status.charAt(0).toUpperCase() +
                      record.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Timestamp:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(record.timestamp)}
                  </span>
                </div>
                {record.user_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Operator:</span>
                    <span className="font-medium text-gray-900">
                      {record.user_name}
                    </span>
                  </div>
                )}
                {record.iot_device_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">
                      IoT Device:
                    </span>
                    <span className="font-medium text-gray-900 font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                      {record.iot_device_id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comprehensive Weight Analysis */}
          {(record.iot_weight || record.manager_weight) && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="flex items-center mb-6 text-xl font-bold text-gray-900">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg mr-3">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                Comprehensive Weight Analysis
              </h3>

              {/* Weight Comparison Grid */}
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                {/* IoT Weight - Now same as recorded weight */}
                {record.iot_weight && (
                  <div className="p-5 border-2 border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-green-600 rounded-lg mr-2">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-green-800">
                        IoT Scale Data
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {record.iot_weight} kg
                    </div>
                    <p className="mt-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      Same as recorded weight (IoT only)
                    </p>
                  </div>
                )}

                {/* Target Weight */}
                {record.manager_weight && (
                  <div className="p-5 border-2 border-orange-200 rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-orange-600 rounded-lg mr-2">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-orange-800">
                        Target Weight (Expected)
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-orange-900">
                      {record.manager_weight} kg
                    </div>
                    <p className="mt-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      From delivery specifications
                    </p>
                  </div>
                )}

                {/* Variance */}
                {record.weight_variance !== undefined && (
                  <div
                    className={`p-5 rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-200 ${
                      record.variance_status === "critical"
                        ? "bg-gradient-to-br from-red-50 to-rose-100 border-red-200"
                        : record.variance_status === "warning"
                        ? "bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200"
                        : "bg-gradient-to-br from-green-50 to-emerald-100 border-green-200"
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <div
                        className={`p-2 rounded-lg mr-2 ${
                          record.variance_status === "critical"
                            ? "bg-red-600"
                            : record.variance_status === "warning"
                            ? "bg-yellow-600"
                            : "bg-green-600"
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          record.variance_status === "critical"
                            ? "text-red-800"
                            : record.variance_status === "warning"
                            ? "text-yellow-800"
                            : "text-green-800"
                        }`}
                      >
                        Weight Variance
                      </span>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        record.variance_status === "critical"
                          ? "text-red-900"
                          : record.variance_status === "warning"
                          ? "text-yellow-900"
                          : "text-green-900"
                      }`}
                    >
                      {record.weight_variance > 0 ? "+" : ""}
                      {record.weight_variance.toFixed(2)} kg
                    </div>
                    <p
                      className={`text-xs mt-2 px-2 py-1 rounded font-medium ${
                        record.variance_status === "critical"
                          ? "text-red-700 bg-red-100"
                          : record.variance_status === "warning"
                          ? "text-yellow-700 bg-yellow-100"
                          : "text-green-700 bg-green-100"
                      }`}
                    >
                      {record.weight_variance_percentage !== undefined &&
                        `${
                          record.weight_variance_percentage > 0 ? "+" : ""
                        }${record.weight_variance_percentage.toFixed(1)}%`}
                    </p>
                  </div>
                )}
              </div>

              {/* Detailed Analysis */}
              <div className="p-5 mb-6 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
                <h4 className="mb-4 font-bold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  Variance Analysis Details
                </h4>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium">
                      Absolute Difference:
                    </span>
                    <div className="text-lg font-bold text-gray-900 mt-1">
                      {record.weight_variance !== undefined
                        ? `${Math.abs(record.weight_variance).toFixed(2)} kg`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium">
                      Percentage Variance:
                    </span>
                    <div className="text-lg font-bold text-gray-900 mt-1">
                      {record.weight_variance_percentage !== undefined
                        ? `${Math.abs(
                            record.weight_variance_percentage
                          ).toFixed(2)}%`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium">
                      Variance Status:
                    </span>
                    <div className="mt-1">
                      <span
                        className={`font-bold px-3 py-1 rounded-full text-sm ${
                          record.variance_status === "critical"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : record.variance_status === "warning"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : "bg-green-100 text-green-800 border border-green-200"
                        }`}
                      >
                        {record.variance_status?.toUpperCase() || "NORMAL"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-600 font-medium">
                      Verification Required:
                    </span>
                    <div className="mt-1">
                      {record.verification_required ? (
                        <span className="font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full text-sm">
                          ⚠️ Yes
                        </span>
                      ) : (
                        <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full text-sm">
                          ✅ No
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variance Interpretation */}
                <div className="p-4 mt-6 bg-white border-l-4 border-blue-500 rounded-r-lg shadow-sm">
                  <h5 className="mb-2 font-bold text-gray-900 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Analysis & Interpretation:
                  </h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {record.variance_status === "critical"
                      ? "🔴 Critical variance detected (≥10%). The measured weight differs significantly from the expected target, suggesting a potential calibration, packaging/contents, or process issue. This record is automatically rejected. Please verify scale calibration, confirm item and packaging integrity, review recent process changes, and perform a reweigh if needed."
                      : record.variance_status === "warning"
                      ? "🟡 Warning variance detected (5–10%). The measured weight shows a moderate deviation from the expected target. For traceability, this record is automatically rejected. Check sampling method and tare (container/lining), ensure stable weighing conditions, and consider reweighing to confirm."
                      : "🟢 Normal variance detected (<5%). The measured weight aligns well with the expected target and is within tolerance. No further action is required."}
                  </p>
                </div>
              </div>

              {/* Enhanced Variance Display Component */}
              <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <WeightVarianceDisplay
                  iotWeight={record.iot_weight}
                  managerWeight={record.manager_weight}
                  variance={record.weight_variance}
                  variancePercentage={record.weight_variance_percentage}
                  varianceStatus={record.variance_status}
                  compact={false}
                />
              </div>

              {/* Verification Status Alert */}
              {record.verification_required && (
                <div className="p-4 border-2 border-yellow-300 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-yellow-800">
                        Manual Verification Required
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Significant weight variance detected. Please review and
                        investigate this measurement.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes Section */}
          {record.notes && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gray-600 rounded-lg mr-3">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                Additional Notes
              </h3>
              <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50">
                <p className="text-gray-700 leading-relaxed">{record.notes}</p>
              </div>
            </div>
          )}

          {/* No Variance Data Message */}
          {(!record.iot_weight || !record.manager_weight) && (
            <div className="p-5 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
              <div className="flex items-start text-blue-700">
                <div className="p-2 bg-blue-100 rounded-lg mr-3 flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">
                    Limited Variance Data Available
                  </h4>
                  <p className="text-sm text-blue-600">
                    Both IoT weight and expected weight from delivery are
                    required for comprehensive variance analysis. Some analysis
                    features may be limited.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Record created: {formatDate(record.timestamp)}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 font-medium bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                Close
              </button>
              <button
                onClick={handlePrintReport}
                className="px-6 py-3 text-white font-medium bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightRecordDetailModal;
