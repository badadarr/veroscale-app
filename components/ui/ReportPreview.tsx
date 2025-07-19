import React, { useState, useEffect, useMemo } from 'react';
import { X, Download, FileText, BarChart2, Table as TableIcon, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';

interface ReportPreviewProps {
  reportData: any;
  onClose: () => void;
  onDownload: (format: string) => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ 
  reportData, 
  onClose,
  onDownload
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'data' | 'charts'>('summary');
  const [isLoading, setIsLoading] = useState(true);
  
  // Format timestamps in the report data
  const formattedReportData = useMemo(() => {
    if (!reportData) return null;
    
    const formatted = {...reportData};
    
    // Format timestamps in records
    if (formatted.records && Array.isArray(formatted.records)) {
      formatted.records = formatted.records.map(record => {
        const newRecord = {...record};
        if (newRecord.timestamp) {
          try {
            newRecord.timestamp = new Date(newRecord.timestamp).toLocaleString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
          } catch (e) {
            // Keep original if parsing fails
          }
        }
        return newRecord;
      });
    }
    
    // Format date ranges for weekly reports
    if (formatted.dateRange) {
      try {
        if (formatted.dateRange.from) {
          const fromDate = new Date(formatted.dateRange.from);
          if (!isNaN(fromDate.getTime())) {
            formatted.dateRange.from = fromDate.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          }
        }
        if (formatted.dateRange.to) {
          const toDate = new Date(formatted.dateRange.to);
          if (!isNaN(toDate.getTime())) {
            formatted.dateRange.to = toDate.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          }
        }
      } catch (e) {
        console.error('Error formatting date range:', e);
        // Keep original if parsing fails
      }
    }
    
    // Format date for daily reports
    if (formatted.date) {
      try {
        formatted.date = new Date(formatted.date).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch (e) {
        // Keep original if parsing fails
      }
    }
    
    // Format month for monthly reports
    if (formatted.month) {
      try {
        // If month is in YYYY-MM format, convert to month name and year
        if (/^\d{4}-\d{2}$/.test(formatted.month)) {
          const [year, month] = formatted.month.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
          formatted.month = date.toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric'
          });
        }
      } catch (e) {
        // Keep original if parsing fails
      }
    }
    
    return formatted;
  }, [reportData]);
  
  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!formattedReportData) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-4xl max-h-[95vh] bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{formattedReportData.title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex overflow-x-auto border-b border-gray-200">
          <button
            className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'summary' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('summary')}
          >
            <FileText className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Summary
          </button>
          <button
            className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'data' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('data')}
          >
            <TableIcon className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Data
          </button>
          <button
            className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'charts' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('charts')}
          >
            <BarChart2 className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Charts
          </button>
        </div>
        
        <div className="p-2 sm:p-4 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 120px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-10 h-10 mx-auto text-primary-500 animate-spin" />
                <p className="mt-4 text-gray-500">Loading report preview...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Report Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {formattedReportData.date && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Date</p>
                            <p className="text-lg">{formattedReportData.date}</p>
                          </div>
                        )}
                        {formattedReportData.dateRange && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Date Range</p>
                            <p className="text-lg">
                              {formattedReportData.dateRange.from || 'N/A'} to {formattedReportData.dateRange.to || 'N/A'}
                            </p>
                          </div>
                        )}
                        {formattedReportData.month && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Month</p>
                            <p className="text-lg">{formattedReportData.month}</p>
                          </div>
                        )}
                      </div>
                      
                      {formattedReportData.summary && (
                        <div className="mt-4">
                          <h3 className="mb-2 text-lg font-medium">Key Metrics</h3>
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {formattedReportData.summary.totalRecords !== undefined && (
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-700">Total Records</p>
                                <p className="text-2xl font-bold text-blue-900">{formattedReportData.summary.totalRecords}</p>
                              </div>
                            )}
                            {formattedReportData.summary.totalWeight !== undefined && (
                              <div className="p-3 bg-green-50 rounded-lg">
                                <p className="text-sm font-medium text-green-700">Total Weight</p>
                                <p className="text-2xl font-bold text-green-900">{formattedReportData.summary.totalWeight.toFixed(2)} kg</p>
                              </div>
                            )}
                            {formattedReportData.summary.avgWeight !== undefined && (
                              <div className="p-3 bg-yellow-50 rounded-lg">
                                <p className="text-sm font-medium text-yellow-700">Average Weight</p>
                                <p className="text-2xl font-bold text-yellow-900">{formattedReportData.summary.avgWeight.toFixed(2)} kg</p>
                              </div>
                            )}
                            {formattedReportData.summary.totalUsers !== undefined && (
                              <div className="p-3 bg-purple-50 rounded-lg">
                                <p className="text-sm font-medium text-purple-700">Total Users</p>
                                <p className="text-2xl font-bold text-purple-900">{formattedReportData.summary.totalUsers}</p>
                              </div>
                            )}
                            {formattedReportData.summary.totalItems !== undefined && (
                              <div className="p-3 bg-indigo-50 rounded-lg">
                                <p className="text-sm font-medium text-indigo-700">Total Items</p>
                                <p className="text-2xl font-bold text-indigo-900">{formattedReportData.summary.totalItems}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {formattedReportData.summary?.statusCounts && (
                        <div className="mt-4">
                          <h3 className="mb-2 text-lg font-medium">Status Distribution</h3>
                          <div className="grid grid-cols-3 gap-4">
                            {Object.entries(formattedReportData.summary.statusCounts).map(([status, count]: [string, any]) => (
                              <div key={status} className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-700">{status.charAt(0).toUpperCase() + status.slice(1)}</p>
                                <p className="text-2xl font-bold text-gray-900">{count}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {activeTab === 'data' && (
                <div className="space-y-4">
                  {formattedReportData.records && formattedReportData.records.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Records</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {Object.keys(formattedReportData.records[0]).map((header) => (
                                  <TableHead key={header}>{header}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formattedReportData.records.slice(0, 50).map((record: any, index: number) => (
                                <TableRow key={index}>
                                  {Object.values(record).map((value: any, i: number) => (
                                    <TableCell key={i}>
                                      {typeof value === 'object' ? JSON.stringify(value) : value}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {formattedReportData.records.length > 50 && (
                            <p className="mt-2 text-sm text-gray-500">
                              Showing 50 of {formattedReportData.records.length} records
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {formattedReportData.userActivity && formattedReportData.userActivity.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>User Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Records</TableHead>
                                <TableHead>Total Weight</TableHead>
                                <TableHead>Status Distribution</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formattedReportData.userActivity.map((user: any) => (
                                <TableRow key={user.userId}>
                                  <TableCell>{user.userName}</TableCell>
                                  <TableCell>{user.recordCount}</TableCell>
                                  <TableCell>{user.totalWeight.toFixed(2)} kg</TableCell>
                                  <TableCell>
                                    {Object.entries(user.statuses).map(([status, count]: [string, any]) => (
                                      <span key={status} className="inline-block px-2 py-1 mr-1 text-xs rounded-full bg-gray-100">
                                        {status}: {count}
                                      </span>
                                    ))}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {formattedReportData.itemStats && formattedReportData.itemStats.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Item Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Records</TableHead>
                                <TableHead>Total Weight</TableHead>
                                <TableHead>Average Weight</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formattedReportData.itemStats.map((item: any) => (
                                <TableRow key={item.itemId}>
                                  <TableCell>{item.itemName}</TableCell>
                                  <TableCell>{item.recordCount}</TableCell>
                                  <TableCell>{item.totalWeight.toFixed(2)} kg</TableCell>
                                  <TableCell>{item.avgWeight.toFixed(2)} kg</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              
              {activeTab === 'charts' && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BarChart2 className="w-16 h-16 mx-auto text-gray-300" />
                    <p className="mt-2 text-gray-500">
                      Charts would be displayed here in a real implementation.
                    </p>
                    <p className="text-sm text-gray-400">
                      You would use libraries like Chart.js or Recharts to visualize the data.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="flex items-center justify-end p-2 sm:p-4 border-t">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onDownload('csv')}>
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Download</span> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDownload('excel')}>
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Download</span> Excel
            </Button>
            <Button size="sm" onClick={() => onDownload('pdf')}>
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Download</span> PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};