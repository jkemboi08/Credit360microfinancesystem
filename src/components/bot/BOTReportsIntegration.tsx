// BOT Reports Integration Component
// Provides real-time integration with BOT regulatory reports

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useRealtimeData } from '../../hooks/useRealtimeData';

interface BOTReportsIntegrationProps {
  className?: string;
}

export const BOTReportsIntegration: React.FC<BOTReportsIntegrationProps> = ({ className = '' }) => {
  const { crossModuleData, lastUpdate, isConnected, forceSync } = useRealtimeData({
    events: ['expense_created', 'expense_updated', 'bot_report_updated'],
    autoSync: true,
    syncInterval: 2000
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await forceSync();
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getValidationStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!crossModuleData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">BOT Reports Integration</h3>
            <p className="text-sm text-gray-600">Real-time regulatory compliance</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 text-sm ${
            isConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Validation Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Validation Status</h4>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            getValidationStatusColor(crossModuleData.botReportData.validationStatus)
          }`}>
            {getValidationStatusIcon(crossModuleData.botReportData.validationStatus)}
            <span className="ml-1">{crossModuleData.botReportData.validationStatus.toUpperCase()}</span>
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Last sync: {crossModuleData.botReportData.lastSync.toLocaleString()}
        </div>
      </div>

      {/* MSP2_02 Income Statement Data */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4">MSP2_02 Income Statement</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-blue-900">Interest Expenses</h5>
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(crossModuleData.botReportData.msp202Data.interestExpenses)}
            </div>
            <div className="text-sm text-blue-700">D15-D20</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-green-900">Operating Expenses</h5>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(crossModuleData.botReportData.msp202Data.operatingExpenses)}
            </div>
            <div className="text-sm text-green-700">D25-D40</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-red-900">Tax Expenses</h5>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(crossModuleData.botReportData.msp202Data.taxExpenses)}
            </div>
            <div className="text-sm text-red-700">D41</div>
          </div>
        </div>
      </div>

      {/* Real-time Updates */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Real-time Updates</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Expense Data</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(crossModuleData.expenseData.totalExpenses)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Staff Expenses</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(crossModuleData.staffData.salaryExpenses + crossModuleData.staffData.benefitExpenses)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Budget Variance</span>
            <span className={`font-medium ${
              crossModuleData.budgetData.variancePercentage < 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {crossModuleData.budgetData.variancePercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Integration Status</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-medium">Active</span>
          </div>
        </div>
        {lastUpdate && (
          <div className="text-xs text-gray-500 mt-1">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default BOTReportsIntegration;




























