import { useState, useEffect } from 'react';
import {
  BarChart2,
  Download,
  FileText,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  Mail,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  type: string;
  schedule?: string;
  recipients?: string[];
  createdAt?: string;
}

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'templates' | 'configuration'>('available');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{
    id: number | null;
    name: string;
    description: string;
    type: string;
    schedule: string;
    recipients: string;
    includeCharts: boolean;
    includeRawData: boolean;
  }>({
    id: null,
    name: '',
    description: '',
    type: 'PDF',
    schedule: 'daily',
    recipients: '',
    includeCharts: true,
    includeRawData: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Redirect if not admin or manager
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'manager') {
      window.location.href = '/dashboard';
    }
  }, [user]);

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

  const reportTemplates: ReportTemplate[] = [
    {
      id: 1,
      name: 'Weekly Department Summary',
      description: 'Summarizes weight data by department',
      type: 'PDF',
      schedule: 'Weekly (Monday 8:00 AM)',
      recipients: ['managers@example.com', 'admin@example.com'],
      createdAt: '2023-09-15'
    },
    {
      id: 2,
      name: 'Monthly Performance Report',
      description: 'Analyzes operator performance and throughput',
      type: 'Excel',
      schedule: 'Monthly (1st day, 9:00 AM)',
      recipients: ['admin@example.com'],
      createdAt: '2023-10-02'
    }
  ];

  const handleDownload = (reportId: number) => {
    // Implement download logic here
    toast.success(`Report download started`);
    console.log(`Downloading report ${reportId}`);
  };
  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'available' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('available')}
          >
            Available Reports
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'templates' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('templates')}
          >
            Report Templates
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'configuration' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('configuration')}
          >
            Report Configuration
          </button>
        </div>

        {activeTab === 'available' && (
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
        )}

        {activeTab === 'templates' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Report Templates</CardTitle>
                <Button onClick={() => {
                  setFormData({
                    id: null,
                    name: '',
                    description: '',
                    type: 'PDF',
                    schedule: 'daily',
                    recipients: '',
                    includeCharts: true,
                    includeRawData: false,
                  });
                  setFormErrors({});
                  setShowForm(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showForm && (
                <Card className="mb-6 border border-primary-200 bg-primary-50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle>{formData.id ? 'Edit Report Template' : 'Create Report Template'}</CardTitle>
                      <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Template Name
                          </label>
                          <Input
                            id="template-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={formErrors.name}
                          />
                        </div>
                        <div>
                          <label htmlFor="template-type" className="block text-sm font-medium text-gray-700 mb-1">
                            Report Type
                          </label>
                          <select
                            id="template-type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          >
                            <option value="PDF">PDF</option>
                            <option value="Excel">Excel</option>
                            <option value="CSV">CSV</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <Input
                            id="template-description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            error={formErrors.description}
                          />
                        </div>
                        <div>
                          <label htmlFor="template-schedule" className="block text-sm font-medium text-gray-700 mb-1">
                            Schedule
                          </label>
                          <select
                            id="template-schedule"
                            value={formData.schedule}
                            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="manual">Manual Only</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="template-recipients" className="block text-sm font-medium text-gray-700 mb-1">
                            Recipients (comma separated)
                          </label>
                          <Input
                            id="template-recipients"
                            value={formData.recipients}
                            onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                            placeholder="email1@example.com, email2@example.com"
                            error={formErrors.recipients}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Include Charts
                          </label>
                          <div className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              id="include-charts"
                              checked={formData.includeCharts}
                              onChange={(e) => setFormData({ ...formData, includeCharts: e.target.checked })}
                              className="h-4 w-4 text-primary-600 rounded border-gray-300"
                            />
                            <label htmlFor="include-charts" className="ml-2 text-sm text-gray-600">
                              Include charts and visualizations
                            </label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Include Raw Data
                            </label>
                            <div className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                id="include-raw-data"
                                checked={formData.includeRawData}
                                onChange={(e) => setFormData({ ...formData, includeRawData: e.target.checked })}
                                className="h-4 w-4 text-primary-600 rounded border-gray-300"
                              />
                              <label htmlFor="include-raw-data" className="ml-2 text-sm text-gray-600">
                                Include raw data tables
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            toast.success(`Report template ${formData.id ? 'updated' : 'created'} successfully`);
                            setShowForm(false);
                          }}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {formData.id ? 'Update Template' : 'Create Template'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{template.schedule}</span>
                        </div>
                      </TableCell>
                      <TableCell>{template.type}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setFormData({
                              id: template.id,
                              name: template.name,
                              description: template.description,
                              type: template.type,
                              schedule: 'weekly', // Placeholder
                              recipients: template.recipients?.join(', ') || '',
                              includeCharts: true,
                              includeRawData: false,
                            });
                            setFormErrors({});
                            setShowForm(true);
                          }}
                          className="mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this template?')) {
                              toast.success('Template deleted successfully');
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-error-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'configuration' && (
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <Input
                      id="company-name"
                      defaultValue="Weight Management System Ltd."
                      placeholder="Company name to appear on reports"
                    />
                  </div>

                  <div>
                    <label htmlFor="company-logo" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Logo
                    </label>
                    <Input
                      id="company-logo"
                      type="file"
                      accept="image/*"
                    />
                  </div>

                  <div>
                    <label htmlFor="report-footer" className="block text-sm font-medium text-gray-700 mb-1">
                      Report Footer Text
                    </label>
                    <Input
                      id="report-footer"
                      defaultValue="Confidential - For Internal Use Only"
                      placeholder="Text to appear in the footer of reports"
                    />
                  </div>

                  <div>
                    <label htmlFor="default-report-format" className="block text-sm font-medium text-gray-700 mb-1">
                      Default Report Format
                    </label>
                    <select
                      id="default-report-format"
                      defaultValue="PDF"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="PDF">PDF</option>
                      <option value="Excel">Excel</option>
                      <option value="CSV">CSV</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Notification Settings
                    </label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notify-admin"
                          defaultChecked
                          className="h-4 w-4 text-primary-600 rounded border-gray-300"
                        />
                        <label htmlFor="notify-admin" className="ml-2 text-sm text-gray-600">
                          Notify administrators when reports are generated
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notify-fail"
                          defaultChecked
                          className="h-4 w-4 text-primary-600 rounded border-gray-300"
                        />
                        <label htmlFor="notify-fail" className="ml-2 text-sm text-gray-600">
                          Send notification on failed report generation
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => toast.success('Report configuration saved')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
