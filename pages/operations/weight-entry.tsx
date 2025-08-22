import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Scale, Plus } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api";
import IoTWeightDisplay from "@/components/ui/IoTWeightDisplay";
import { toast } from "react-hot-toast";
import {
  analyzeWeightVariance,
  getVarianceStatusColor,
  getVarianceStatusIcon,
  formatVarianceDisplay,
  VarianceAnalysis,
} from "@/lib/weight-variance-config";

interface Sample {
  id: number;
  category: string;
  item: string;
  sample_weight: number;
  expected_weight: number;
  source?: string;
  destination?: string;
  supplier_name?: string;
  delivery_id?: number;
}

interface Delivery {
  id: number;
  item_name: string;
  status: string;
  expected_weight: number;
  delivery_status?: string;
}

export default function WeightEntry() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);

  // Form states for single entry
  const [selectedSampleId, setSelectedSampleId] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [iotWeight, setIotWeight] = useState<number | null>(null);
  const [expectedWeight, setExpectedWeight] = useState<number | null>(null);
  const [iotDeviceId, setIotDeviceId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [deliveryId, setDeliveryId] = useState<number | null>(null);
  const [varianceAnalysis, setVarianceAnalysis] =
    useState<VarianceAnalysis | null>(null);

  // Fetch samples on component mount
  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      // Fetch all samples
      const samplesResponse = await apiClient.get("/api/samples");
      const allSamples = samplesResponse.data.samples || [];
      console.log("All samples:", allSamples.length);

      // Fetch deliveries with in_transit status
      const deliveriesResponse = await apiClient.get(
        "/api/deliveries?status=in_transit"
      );
      const inTransitDeliveries = deliveriesResponse.data.deliveries || [];
      console.log(
        "In transit deliveries:",
        inTransitDeliveries.length,
        inTransitDeliveries
      );

      // Debug: Log expected_weight data
      inTransitDeliveries.forEach((delivery: Delivery, index: number) => {
        console.log(`Delivery ${index}:`, {
          item_name: delivery.item_name,
          expected_weight: delivery.expected_weight,
          delivery_status: delivery.status,
        });
      });

      // Filter samples that match item names in in_transit deliveries
      if (inTransitDeliveries.length > 0) {
        const inTransitItemNames = inTransitDeliveries.map(
          (d: Delivery) => d.item_name
        );
        console.log("In transit item names:", inTransitItemNames);

        const filteredSamples = allSamples.filter((sample: Sample) => {
          const sampleFullName = `${sample.category} - ${sample.item}`;
          const isIncluded = inTransitItemNames.includes(sampleFullName);
          console.log(`Sample "${sampleFullName}" - Included: ${isIncluded}`);
          return isIncluded;
        });

        console.log("Filtered samples:", filteredSamples.length);

        // Add delivery_id to samples and get expected_weight from deliveries
        const samplesWithDeliveryId = filteredSamples.map((sample: Sample) => {
          const sampleFullName = `${sample.category} - ${sample.item}`;
          const matchingDelivery = inTransitDeliveries.find(
            (d: Delivery) => d.item_name === sampleFullName
          );
          return {
            ...sample,
            delivery_id: matchingDelivery ? matchingDelivery.id : null,
            expected_weight: matchingDelivery
              ? matchingDelivery.expected_weight
              : sample.sample_weight || 0,
          };
        });

        setSamples(samplesWithDeliveryId);
      } else {
        console.log("No in-transit deliveries found, setting empty samples");
        setSamples([]);
      }
    } catch (error) {
      console.error("Error fetching samples:", error);
      toast.error("Failed to load samples");
    }
  };

  // Function to handle single weight record submission
  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSampleId || !weight) {
      setError("Please select a sample and enter a weight value.");
      return;
    }

    // Get selected sample to check expected weight
    const selectedSample = samples.find((s) => s.id === selectedSampleId);
    const sampleExpectedWeight = selectedSample?.expected_weight || 0;

    // Analyze variance if IoT weight and expected weight are available
    let analysis: VarianceAnalysis | null = null;
    if (iotWeight && sampleExpectedWeight > 0) {
      analysis = analyzeWeightVariance(iotWeight, sampleExpectedWeight);
      setVarianceAnalysis(analysis);

      // Auto-reject if variance exceeds thresholds
      if (analysis.status === "auto_rejected") {
        setError(
          `Weight rejected automatically: ${analysis.reason}. Please check the scale calibration and try again.`
        );
        toast.error(`Rejected: ${analysis.reason}`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const submissionData = {
        sample_id: selectedSampleId,
        total_weight: weight,
        iot_weight: iotWeight,
        expected_weight: sampleExpectedWeight,
        iot_device_id: iotDeviceId || null,
        notes,
        unit: "kg",
        delivery_id: deliveryId,
        // Include variance analysis results
        variance_status: analysis?.status || "processed",
        auto_approved: analysis?.status === "auto_approved",
        variance_reason: analysis?.reason || null,
      };

      await apiClient.post("/api/weights", submissionData);

      setSuccess(true);

      // Show appropriate success message based on variance analysis
      if (analysis) {
        const statusIcon = getVarianceStatusIcon(analysis.status);
        const varianceDisplay = formatVarianceDisplay(analysis);

        if (analysis.status === "auto_approved") {
          toast.success(
            `${statusIcon} Weight approved automatically! Variance: ${varianceDisplay}`,
            { duration: 4000 }
          );
        } else if (analysis.status === "auto_rejected") {
          toast.error(
            `${statusIcon} Weight rejected automatically. Variance: ${varianceDisplay}`,
            { duration: 4000 }
          );
        }
      } else {
        toast.success("Weight record processed successfully!");
      }

      setTimeout(() => {
        setSuccess(false);
        setSelectedSampleId(null);
        setWeight(null);
        setIotWeight(null);
        setExpectedWeight(null);
        setIotDeviceId("");
        setNotes("");
        setDeliveryId(null);
        setVarianceAnalysis(null);

        // Navigate to my records page
        router.push("/operations/my-records");
      }, 2000);
    } catch (err) {
      console.error("Error submitting weight record:", err);
      setError("Failed to submit weight record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleIoTWeightSelect = (iotWeightValue: number) => {
    setIotWeight(iotWeightValue);
    setWeight(iotWeightValue); // Set as primary weight (same as IoT weight)
    setIotDeviceId("IoT_Scale_001"); // You can make this dynamic
    toast.success(`IoT Weight ${iotWeightValue} kg captured`);

    // Get selected sample to check expected weight and analyze variance
    const selectedSample = samples.find((s) => s.id === selectedSampleId);
    const sampleExpectedWeight = selectedSample?.expected_weight || 0;

    if (sampleExpectedWeight > 0) {
      const analysis = analyzeWeightVariance(
        iotWeightValue,
        sampleExpectedWeight
      );
      setVarianceAnalysis(analysis);
      setExpectedWeight(sampleExpectedWeight);
    }
  };

  // Update sample selection to capture expected weight
  const handleSampleSelect = (sampleId: number) => {
    setSelectedSampleId(sampleId);
    const selectedSample = samples.find((s) => s.id === sampleId);
    if (selectedSample) {
      setExpectedWeight(selectedSample.expected_weight);
      setDeliveryId(selectedSample.delivery_id || null);

      // Re-analyze variance if IoT weight is already set
      if (iotWeight && selectedSample.expected_weight > 0) {
        const analysis = analyzeWeightVariance(
          iotWeight,
          selectedSample.expected_weight
        );
        setVarianceAnalysis(analysis);
      }
    }
  };

  return (
    <DashboardLayout title="Weight Entry">
      <div className="max-w-2xl mx-auto">
        {/* IoT Integration Section */}
        <div className="grid-cols-1 gap-6 mb-6 ">
          <IoTWeightDisplay
            showSelectButton={true}
            onWeightSelect={handleIoTWeightSelect}
          />
        </div>

        <div className="mb-6">
          <h1 className="flex items-center text-2xl font-bold text-gray-900">
            <Scale className="w-6 h-6 mr-2" />
            Weight Entry
          </h1>
          <p className="mt-1 text-gray-600">
            Record the weight of a sample item (weight measured in kg)
          </p>
        </div>

        {success && (
          <div
            className="relative px-4 py-3 mb-6 text-green-700 bg-green-100 border border-green-300 rounded"
            role="alert"
          >
            <div className="flex">
              <span className="font-medium">
                Weight record submitted successfully!
              </span>
            </div>
          </div>
        )}

        {error && (
          <div
            className="relative px-4 py-3 mb-6 text-red-700 bg-red-100 border border-red-300 rounded"
            role="alert"
          >
            <div className="flex">
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Weight Entry Form */}
        <Card className="shadow-md">
          <CardHeader className="bg-primary-50">
            <CardTitle className="flex items-center text-primary-800">
              <Plus className="w-5 h-5 mr-2" />
              New Weight Record
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleWeightSubmit}>
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Select Sample *
                    <span className="ml-1 text-xs text-gray-500">
                      (target weight will auto-fill)
                    </span>
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    value={selectedSampleId || ""}
                    onChange={(e) => {
                      const sampleId = Number(e.target.value) || null;
                      if (sampleId) {
                        handleSampleSelect(sampleId);
                      }

                      // Auto-fill manager weight with sample weight from marketing data
                      if (sampleId) {
                        const selectedSample = samples.find(
                          (s) => s.id === sampleId
                        );
                        if (selectedSample) {
                          // Set delivery ID
                          setDeliveryId(selectedSample.delivery_id || null);

                          console.log("Selected sample:", selectedSample);
                          console.log(
                            "Expected weight from delivery:",
                            selectedSample.expected_weight
                          );
                        }
                      }
                    }}
                    aria-label="Select Sample"
                    required
                  >
                    <option value="">-- Select Sample --</option>
                    {samples.map((sample) => (
                      <option key={sample.id} value={sample.id}>
                        {sample.category} - {sample.item} (Expected:{" "}
                        {sample.expected_weight || sample.sample_weight || 0}{" "}
                        kg){" "}
                        {sample.supplier_name
                          ? `- From: ${sample.supplier_name}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {samples.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      No samples available for weighing.
                    </p>
                  )}
                </div>

                {/* Delivery Detail Card - Appears when sample is selected */}
                {selectedSampleId && expectedWeight && (
                  <div className="p-4 transition-all duration-200 border border-blue-200 rounded-lg shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center mb-3">
                      <div className="flex items-center justify-center w-8 h-8 mr-3 text-blue-600 bg-white rounded-full shadow-sm">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900">
                          📦 Delivery Reference
                        </h4>
                        <p className="text-sm text-blue-600">
                          Target specifications for weighing process
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <h5 className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                          Item Details
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Product:</span>
                            <span className="font-medium text-right text-gray-900">
                              {
                                samples.find((s) => s.id === selectedSampleId)
                                  ?.category
                              }{" "}
                              -{" "}
                              {
                                samples.find((s) => s.id === selectedSampleId)
                                  ?.item
                              }
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 text-sm border-t">
                            <span className="text-gray-600">
                              Expected Weight:
                            </span>
                            <span className="text-lg font-bold text-blue-700">
                              {expectedWeight} kg
                            </span>
                          </div>
                          {samples.find((s) => s.id === selectedSampleId)
                            ?.supplier_name && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Supplier:</span>
                              <span className="font-medium text-gray-900">
                                {
                                  samples.find((s) => s.id === selectedSampleId)
                                    ?.supplier_name
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <h5 className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                          Delivery Info
                        </h5>
                        <div className="space-y-2">
                          {deliveryId && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Delivery ID:
                              </span>
                              <span className="font-mono font-medium text-gray-900">
                                #{deliveryId}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Status:</span>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                              🚛 In Transit
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Data Source:</span>
                            <span className="font-medium text-gray-900">
                              {samples.find((s) => s.id === selectedSampleId)
                                ?.source || "Marketing Data"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start p-3 mt-4 text-sm text-blue-800 bg-blue-100 border border-blue-200 rounded-lg">
                      <span className="mr-2 text-base">💡</span>
                      <div>
                        <p className="mb-1 font-medium">Weighing Guidelines:</p>
                        <p>
                          Use this target weight as reference. Variance ≥5% will
                          trigger review, ≥10% requires manager approval.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Weight from IoT Scale (kg) *
                    <span className="ml-1 text-xs text-gray-500">
                      (captured from automated scale only)
                    </span>
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="Use 'Get from IoT' button to capture weight"
                      value={weight || ""}
                      readOnly
                      required
                      className="flex-1 bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            "/api/iot/current-weight"
                          );
                          const data = await response.json();
                          if (data.weight && data.weight > 0) {
                            handleIoTWeightSelect(data.weight);
                          } else {
                            toast.error("Invalid IoT data");
                          }
                        } catch {
                          toast.error("IoT not available");
                        }
                      }}
                      className="px-3 text-white bg-blue-500 hover:bg-blue-600"
                    >
                      Get from IoT
                    </Button>
                    <span className="flex items-center px-3 text-gray-500">
                      kg
                    </span>
                  </div>
                  {/* {weight && (
                    <p className="mt-1 text-xs text-green-600">
                      ✅ Weight captured from IoT Scale: {weight} kg
                    </p>
                  )} */}
                </div>

                {/* Expected Weight Display */}
                {selectedSampleId && expectedWeight && (
                  <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">
                          Expected Weight
                        </h4>
                        <p className="text-sm text-blue-700">
                          Target from delivery specification
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-800">
                          {Number(expectedWeight).toFixed(3)} kg
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Variance Analysis Display */}
                {varianceAnalysis && (
                  <div
                    className={`p-4 rounded-lg border ${getVarianceStatusColor(
                      varianceAnalysis.status
                    )}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">
                          {getVarianceStatusIcon(varianceAnalysis.status)}
                        </span>
                        <h4 className="font-medium">
                          Weight Variance Analysis
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">
                          {formatVarianceDisplay(varianceAnalysis)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm">{varianceAnalysis.reason}</p>
                    {varianceAnalysis.status === "auto_rejected" && (
                      <div className="p-2 mt-2 text-sm text-red-800 bg-red-100 border border-red-300 rounded">
                        <strong>Weight Rejected:</strong> Variance exceeds
                        acceptable limits. Please check scale calibration.
                      </div>
                    )}
                    {varianceAnalysis.status === "auto_approved" && (
                      <div className="p-2 mt-2 text-sm text-green-800 bg-green-100 border border-green-300 rounded">
                        <strong>Weight Approved:</strong> Variance within
                        acceptable limits.
                      </div>
                    )}
                  </div>
                )}

                {/* Notes section */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Additional notes about this weight record"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/operations/my-records")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !selectedSampleId || !weight}
                >
                  {loading ? "Saving..." : "Submit Weight Record"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
