import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { database, ref, onValue } from "@/lib/firebase";

interface DebugResult {
  test: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
}

export default function IoTDebugPage() {
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [firebaseData, setFirebaseData] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDebugResults([]);
    const results: DebugResult[] = [];

    // Test 1: Firebase Connection
    try {
      const testRef = ref(database, ".info/connected");
      const connected = await new Promise((resolve) => {
        onValue(
          testRef,
          (snapshot) => {
            resolve(snapshot.val());
          },
          { onlyOnce: true }
        );
      });

      results.push({
        test: "Firebase Connection",
        status: connected ? "success" : "error",
        message: connected ? "Firebase terhubung" : "Firebase tidak terhubung",
        details: { connected },
      });
    } catch (error) {
      results.push({
        test: "Firebase Connection",
        status: "error",
        message: "Error saat cek koneksi Firebase",
        details: error,
      });
    }

    // Test 2: Check Firebase Database Structure
    try {
      const devicesRef = ref(database, "devices");
      const devicesData = await new Promise((resolve) => {
        onValue(
          devicesRef,
          (snapshot) => {
            resolve(snapshot.val());
          },
          { onlyOnce: true }
        );
      });

      results.push({
        test: "Database Structure - Devices",
        status: devicesData ? "success" : "warning",
        message: devicesData
          ? "Node devices ditemukan"
          : "Node devices tidak ada",
        details: devicesData,
      });
    } catch (error) {
      results.push({
        test: "Database Structure - Devices",
        status: "error",
        message: "Error saat mengakses node devices",
        details: error,
      });
    }

    // Test 3: Check Specific Device
    try {
      const deviceRef = ref(database, "devices/esp32_timbangan_001");
      const deviceData = await new Promise((resolve) => {
        onValue(
          deviceRef,
          (snapshot) => {
            resolve(snapshot.val());
          },
          { onlyOnce: true }
        );
      });

      results.push({
        test: "ESP32 Device Data",
        status: deviceData ? "success" : "error",
        message: deviceData
          ? "Data ESP32 ditemukan"
          : "Data ESP32 tidak ditemukan",
        details: deviceData,
      });
    } catch (error) {
      results.push({
        test: "ESP32 Device Data",
        status: "error",
        message: "Error saat mengakses data ESP32",
        details: error,
      });
    }

    // Test 4: Check Weight Data Path
    try {
      const weightRef = ref(
        database,
        "devices/esp32_timbangan_001/berat_terakhir"
      );
      const weightData = await new Promise((resolve) => {
        onValue(
          weightRef,
          (snapshot) => {
            resolve(snapshot.val());
          },
          { onlyOnce: true }
        );
      });

      results.push({
        test: "Weight Data Path",
        status: weightData !== null ? "success" : "warning",
        message:
          weightData !== null
            ? `Data berat: ${weightData}`
            : "Path berat_terakhir kosong",
        details: { berat_terakhir: weightData },
      });
    } catch (error) {
      results.push({
        test: "Weight Data Path",
        status: "error",
        message: "Error saat mengakses path berat_terakhir",
        details: error,
      });
    }

    // Test 5: API Endpoint Test
    try {
      const response = await fetch("/api/iot/current-weight");
      const data = await response.json();

      results.push({
        test: "API Endpoint",
        status: response.ok ? "success" : "error",
        message: response.ok ? "API endpoint berfungsi" : "API endpoint error",
        details: data,
      });
    } catch (error) {
      results.push({
        test: "API Endpoint",
        status: "error",
        message: "Error saat test API endpoint",
        details: error,
      });
    }

    // Test 6: Real-time Listener Test
    try {
      const weightRef = ref(
        database,
        "devices/esp32_timbangan_001/berat_terakhir"
      );
      let listenerWorks = false;

      const testPromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);

        const unsubscribe = onValue(weightRef, (snapshot) => {
          listenerWorks = true;
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        });
      });

      const works = await testPromise;

      results.push({
        test: "Real-time Listener",
        status: works ? "success" : "warning",
        message: works
          ? "Real-time listener berfungsi"
          : "Real-time listener tidak merespons dalam 5 detik",
        details: { listener_responsive: works },
      });
    } catch (error) {
      results.push({
        test: "Real-time Listener",
        status: "error",
        message: "Error saat test real-time listener",
        details: error,
      });
    }

    setDebugResults(results);
    setIsRunning(false);
  };

  // Live monitoring
  useEffect(() => {
    const weightRef = ref(database, "devices/esp32_timbangan_001");
    const unsubscribe = onValue(weightRef, (snapshot) => {
      setFirebaseData(snapshot.val());
    });

    return () => unsubscribe();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <WifiOff className="h-5 w-5 text-red-600" />;
      default:
        return <Wifi className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <DashboardLayout title="IoT Debugging">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Diagnosis Timbangan IoT</h1>
          <Button onClick={runDiagnostics} disabled={isRunning}>
            {isRunning ? "Running..." : "Run Diagnostics"}
          </Button>
        </div>

        {/* Live Data Monitor */}
        <Card>
          <CardHeader>
            <CardTitle>Live Data Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Current Firebase Data:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(firebaseData, null, 2) || "No data received"}
                </pre>
              </div>
              <div>
                <h3 className="font-medium mb-2">Data Structure Expected:</h3>
                <pre className="bg-blue-50 p-3 rounded text-sm">
                  {`{
  "berat_terakhir": "10.25",
  "timestamp": "2025-07-03T10:30:00Z",
  "status": "online"
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic Results */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent>
            {debugResults.length === 0 ? (
              <p className="text-gray-500">
                Klik "Run Diagnostics" untuk memulai analisis
              </p>
            ) : (
              <div className="space-y-4">
                {debugResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(result.status)}
                        <h3 className="font-medium">{result.test}</h3>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.status === "success"
                            ? "bg-green-100 text-green-800"
                            : result.status === "warning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {result.message}
                    </p>
                    {result.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600">
                          Show Details
                        </summary>
                        <pre className="mt-2 bg-gray-50 p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Troubleshooting Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-red-600 mb-2">
                  Jika Firebase Connection Error:
                </h3>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                  <li>Periksa koneksi internet</li>
                  <li>Verify Firebase config di lib/firebase.ts</li>
                  <li>Cek Firebase Console untuk status database</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-orange-600 mb-2">
                  Jika Device Data Tidak Ada:
                </h3>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                  <li>Pastikan ESP32 terhubung ke WiFi</li>
                  <li>
                    Cek kode ESP32 apakah mengirim data ke path yang benar
                  </li>
                  <li>Verify device ID: esp32_timbangan_001</li>
                  <li>Test manual write ke Firebase Console</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-blue-600 mb-2">
                  Path Firebase yang Diharapkan:
                </h3>
                <pre className="bg-gray-100 p-3 rounded text-sm">
                  {`devices/
  esp32_timbangan_001/
    berat_terakhir: "10.25"
    timestamp: "2025-07-03T10:30:00Z"
    status: "online"`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
