import React from 'react';
import { CheckCircle, Clock, XCircle, ChevronRight, Users, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

const StatusWorkflowGuide: React.FC = () => {
    return (
        <Card className="mb-6">
            <CardHeader className="bg-primary-50">
                <CardTitle className="text-primary-800">Weight Record Approval Process</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <p className="mb-4 text-gray-700">
                    The material weight approval process ensures data quality and accuracy in the system.
                    Below is an explanation of the status workflow and who can change status:
                </p>

                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Status Workflow</h3>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between max-w-3xl">
                        <div className="flex flex-col items-center p-3 mb-4 md:mb-0">
                            <div className="bg-warning-100 text-warning-800 rounded-full p-2 mb-2">
                                <Clock className="h-6 w-6" />
                            </div>
                            <span className="font-medium text-warning-800">Pending</span>
                            <span className="text-xs text-gray-500 text-center mt-1">Initial status when record is created</span>
                        </div>

                        <ChevronRight className="hidden md:block h-6 w-6 text-gray-400" />
                        <div className="h-6 md:hidden border-l border-gray-300 my-2"></div>

                        <div className="flex flex-col items-center p-3 mb-4 md:mb-0">
                            <div className="bg-success-100 text-success-800 rounded-full p-2 mb-2">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <span className="font-medium text-success-800">Approved</span>
                            <span className="text-xs text-gray-500 text-center mt-1">Verified by manager or admin</span>
                        </div>

                        <ChevronRight className="hidden md:block h-6 w-6 text-gray-400" />
                        <div className="h-6 md:hidden border-l border-gray-300 my-2"></div>

                        <div className="flex flex-col items-center p-3">
                            <div className="bg-error-100 text-error-800 rounded-full p-2 mb-2">
                                <XCircle className="h-6 w-6" />
                            </div>
                            <span className="font-medium text-error-800">Rejected</span>
                            <span className="text-xs text-gray-500 text-center mt-1">Has issues, requires correction</span>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Who Can Change Status</h3>
                    <div className="space-y-3">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-blue-100 text-blue-700 rounded-full p-2 mr-3">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Administrators</h4>
                                <p className="text-gray-600 text-sm">
                                    Administrators have full control over all weight records and can change status between
                                    pending, approved, and rejected at any time.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-indigo-100 text-indigo-700 rounded-full p-2 mr-3">
                                <UserCog className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Managers</h4>
                                <p className="text-gray-600 text-sm">
                                    Managers can review and change the status of all weight records. They are typically responsible
                                    for approving records submitted by operators.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-gray-100 text-gray-700 rounded-full p-2 mr-3">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Operators</h4>
                                <p className="text-gray-600 text-sm">
                                    Operators can create weight records (which start as "pending"), but cannot change
                                    the status once created. They must contact a manager or administrator for status changes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Why This Process Matters</h3>
                    <p className="text-gray-600 text-sm">
                        This approval workflow ensures data quality by requiring verification of weight records before they become
                        officially approved in the system. Rejected records can be fixed or marked for follow-up, ensuring
                        all material data is accurate for inventory management and reporting.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default StatusWorkflowGuide;
