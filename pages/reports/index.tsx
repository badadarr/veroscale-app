import { BarChart2, Download, FileText } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function Reports() {
  const reports = [
    {
      id: 1,
      name: 'Daily Weight Summary',
      description: 'Summary of all weight measurements for the current day',
      type: 'PDF'
    },
    {
      id: 2,
      name: 'Weekly Activity Report',
      description: 'Detailed report of all activities from the past week',
      type: 'Excel'
    },
    {
      id: 3,
      name: 'Monthly Statistics',
      description: 'Statistical analysis of weight measurements for the month',
      type: 'PDF'
    }
  ];

  const handleDownload = (reportId: number) => {
    // Implement download logic here
    console.log(`Downloading report ${reportId}`);
  };

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <FileText className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{report.name}</h3>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(report.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {report.type}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
