import React from 'react';
import { Zap, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useTopUpStatistics } from '../../hooks/useTopUp';
import { formatCurrency } from '../../utils/topUpCalculations';

const TopUpRequestsWidget: React.FC = () => {
  const { statistics, loading, error } = useTopUpStatistics();

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center text-red-600">
          <XCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">Failed to load top-up statistics</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-blue-600" />
          Top-Up Requests
        </h3>
        <span className="text-sm text-gray-500">
          {statistics.totalRequests} total
        </span>
      </div>

      <div className="space-y-4">
        {/* Pending Requests */}
        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-yellow-800">Pending</span>
          </div>
          <span className="text-lg font-bold text-yellow-900">
            {statistics.pendingRequests}
          </span>
        </div>

        {/* Approved Requests */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">Approved</span>
          </div>
          <span className="text-lg font-bold text-green-900">
            {statistics.approvedRequests}
          </span>
        </div>

        {/* Disbursed Requests */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <Zap className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">Disbursed</span>
          </div>
          <span className="text-lg font-bold text-blue-900">
            {statistics.disbursedRequests}
          </span>
        </div>

        {/* Rejected Requests */}
        {statistics.rejectedRequests > 0 && (
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center">
              <XCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">Rejected</span>
            </div>
            <span className="text-lg font-bold text-red-900">
              {statistics.rejectedRequests}
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            View All
          </button>
          <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
            New Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopUpRequestsWidget;







