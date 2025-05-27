import React from 'react';
import { Info } from 'lucide-react';

interface StatusInfoCardProps {
    role: string | undefined;
}

const StatusInfoCard: React.FC<StatusInfoCardProps> = ({ role }) => {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex">
                <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Status approval information</h3>
                    <div className="mt-2 text-sm text-blue-700">
                        {role === 'admin' || role === 'manager' ? (
                            <div>
                                <p>As a <strong>{role}</strong>, you can change the status of weight records:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>Use the <strong>Approve</strong> button to mark records as verified and approved</li>
                                    <li>Use the <strong>Reject</strong> button for records with issues or discrepancies</li>
                                    <li>Use the <strong>Pending</strong> button to reset status for records that need further review</li>
                                </ul>
                            </div>
                        ) : (
                            <div>
                                <p>
                                    Weight records status can only be changed by administrators and managers.
                                    Please contact them if you need to change the status of a record.
                                </p>
                                <p className="mt-1">
                                    <strong>Status meanings:</strong>
                                </p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li><strong>Pending:</strong> Waiting for approval</li>
                                    <li><strong>Approved:</strong> Verified and confirmed by a manager or admin</li>
                                    <li><strong>Rejected:</strong> Has issues or discrepancies that need to be fixed</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusInfoCard;
