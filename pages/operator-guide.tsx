import { BookOpen, Scale, Barcode, ClipboardList, AlertOctagon } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import ApprovalStatusGuide from '@/components/ui/ApprovalStatusGuide';
import { useRouter } from 'next/router';

export default function OperatorGuide() {
  const router = useRouter();

  return (
    <DashboardLayout title="Operator Guide">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Operator Guide</h1>
          <p className="text-gray-600 mt-2">
            Reference guide for daily material weight management operations
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="bg-primary-50">
            <CardTitle className="flex items-center text-primary-800">
              <BookOpen className="h-5 w-5 mr-2" />
              Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-gray-700">
              As an operator, you are responsible for accurately recording material weights and managing basic operations
              in the system. This guide will help you navigate through the main tasks you'll perform on a daily basis.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-primary-50">
            <CardTitle className="flex items-center text-primary-800">
              <Scale className="h-5 w-5 mr-2" />
              Recording Material Weights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Access Weight Entry</h3>
              <p className="text-gray-700">
                Navigate to <span className="text-primary-600 font-medium">"Operations" → "Weight Entry"</span>
              </p>
              <button
                onClick={() => router.push('/operations/weight-entry')}
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-md text-sm hover:bg-primary-200 transition-colors"
              >
                Go to Weight Entry
              </button>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-800 mb-2">New Weight Record:</h3>
              <ol className="list-decimal ml-5 space-y-2 text-gray-700">
                <li>Click "New Weight Entry"</li>
                <li>Select the material from the dropdown</li>
                <li>Enter the weight value</li>
                <li>Select the unit of measurement</li>
                <li>Add batch number if applicable</li>
                <li>Enter source and destination information</li>
                <li>Click "Save Record"</li>
              </ol>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Batch Entry Mode:</h3>
              <ol className="list-decimal ml-5 space-y-2 text-gray-700">
                <li>For multiple similar entries, click "Batch Mode"</li>
                <li>Enter common information once</li>
                <li>Add multiple weight values quickly</li>
                <li>Click "Save Batch"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-primary-50">
            <CardTitle className="flex items-center text-primary-800">
              <Barcode className="h-5 w-5 mr-2" />
              Scanning Barcodes/QR Codes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <ol className="list-decimal ml-5 space-y-2 text-gray-700">
              <li>Navigate to <span className="text-primary-600 font-medium">"Operations" → "Scan Entry"</span></li>
              <li>Click "Start Scanner" to activate the camera</li>
              <li>Scan the material barcode or QR code</li>
              <li>Verify the detected information</li>
              <li>Enter the weight and additional details</li>
              <li>Click "Save Record"</li>
            </ol>

            <button
              onClick={() => router.push('/operations/scan-entry')}
              className="px-3 py-1 bg-primary-100 text-primary-700 rounded-md text-sm hover:bg-primary-200 transition-colors"
            >
              Go to Scan Entry
            </button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-primary-50">
            <CardTitle className="flex items-center text-primary-800">
              <ClipboardList className="h-5 w-5 mr-2" />
              Viewing Your Records
            </CardTitle>
          </CardHeader>          <CardContent className="pt-4 space-y-4">
            <ol className="list-decimal ml-5 space-y-2 text-gray-700">
              <li>Navigate to <span className="text-primary-600 font-medium">"My Records"</span> in the sidebar</li>
              <li>View all records you've entered with advanced filtering options</li>
              <li>Filter by date, material, or status using the search and filter tools</li>
              <li>Click on any record to view details or report issues if needed</li>
            </ol>
            <button
              onClick={() => router.push('/operations/my-records')}
              className="px-3 py-1 bg-primary-100 text-primary-700 rounded-md text-sm hover:bg-primary-200 transition-colors"
            >
              Go to My Records
            </button>

            <button
              onClick={() => router.push('/operations/my-records')}
              className="px-3 py-1 bg-primary-100 text-primary-700 rounded-md text-sm hover:bg-primary-200 transition-colors"
            >
              View My Records
            </button>          </CardContent>
        </Card>

        <ApprovalStatusGuide />

        <Card className="shadow-md">
          <CardHeader className="bg-primary-50">
            <CardTitle className="flex items-center text-primary-800">
              <AlertOctagon className="h-5 w-5 mr-2" />
              Reporting Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <p className="text-gray-700">
              If you encounter a problem with a weight record:
            </p>
            <ol className="list-decimal ml-5 space-y-2 text-gray-700">
              <li>Navigate to the record details</li>
              <li>Click "Report Issue"</li>
              <li>Select the issue type</li>
              <li>Add a description</li>
              <li>Click "Submit"</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
