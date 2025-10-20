import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RepaymentScheduleEntry {
  paymentNumber: number;
  dueDate: string;
  principalPortion: number;
  interestPortion: number;
  managementFeePortion: number;
  totalPayment: number;
  remainingBalance: number;
}

interface RepaymentScheduleTableProps {
  schedule: RepaymentScheduleEntry[];
  isExpanded: boolean;
  onToggle: () => void;
  loanId: string;
}

const RepaymentScheduleTable: React.FC<RepaymentScheduleTableProps> = ({
  schedule,
  isExpanded,
  onToggle,
  loanId
}) => {
  console.log('📊 RepaymentScheduleTable props:', { 
    loanId, 
    isExpanded, 
    scheduleLength: schedule.length 
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="border-t border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            Repayment Schedule ({schedule.length} payments)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200">
                      Payment #
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200">
                      Due Date
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                      Principal
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                      Interest
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                      Mgmt Fee
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                      Total Payment
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((entry, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-900">
                        {entry.paymentNumber}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {formatDate(entry.dueDate)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatCurrency(entry.principalPortion)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatCurrency(entry.interestPortion)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatCurrency(entry.managementFeePortion)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                        {formatCurrency(entry.totalPayment)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatCurrency(entry.remainingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepaymentScheduleTable;