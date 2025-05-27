import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const ApprovalStatusGuide: React.FC = () => {
    return (
        <Card className="shadow-md">
            <CardHeader className="bg-primary-50">
                <CardTitle className="flex items-center text-primary-800">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Understanding Approval Status
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
                <p className="text-gray-700">
                    When you record material weights, each entry has an approval status that indicates whether it has been verified by a manager or administrator. Here's what you need to know about the different statuses:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
                        <div className="flex items-center mb-2">
                            <Clock className="h-5 w-5 text-warning-700 mr-2" />
                            <h3 className="font-semibold text-warning-800">Pending</h3>
                        </div>
                        <p className="text-sm text-gray-700">
                            When you first create a weight record, it will be in the "Pending" status. This means it's waiting for review by a manager or administrator.
                        </p>
                    </div>

                    <div className="bg-success-50 rounded-lg p-4 border border-success-200">
                        <div className="flex items-center mb-2">
                            <CheckCircle className="h-5 w-5 text-success-700 mr-2" />
                            <h3 className="font-semibold text-success-800">Approved</h3>
                        </div>
                        <p className="text-sm text-gray-700">
                            An "Approved" status means your record has been verified and confirmed by a manager or administrator as accurate.
                        </p>
                    </div>

                    <div className="bg-error-50 rounded-lg p-4 border border-error-200">
                        <div className="flex items-center mb-2">
                            <XCircle className="h-5 w-5 text-error-700 mr-2" />
                            <h3 className="font-semibold text-error-800">Rejected</h3>
                        </div>
                        <p className="text-sm text-gray-700">
                            If your record has issues or discrepancies, it may be marked as "Rejected". You should check with your manager for instructions on how to correct it.
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <h3 className="font-semibold text-gray-800 mb-2">Who Can Change Status?</h3>
                    <p className="text-gray-700 text-sm">
                        As an operator, you <span className="font-semibold">cannot change the status</span> of your weight records after they've been created. Only managers and administrators have permission to approve or reject weight records. If you need a status changed, please contact your manager.
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-2">What to do if a record is rejected?</h3>
                    <p className="text-gray-700 text-sm mb-2">
                        If one of your records is rejected, follow these steps:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                        <li>Check your "My Records" page to see which record was rejected</li>
                        <li>Speak with your manager to understand the reason for rejection</li>
                        <li>If needed, create a new weight record with the correct information</li>
                        <li>Make note of any feedback to avoid similar issues in the future</li>
                    </ol>
                </div>
            </CardContent>
        </Card>
    );
};

export default ApprovalStatusGuide;
