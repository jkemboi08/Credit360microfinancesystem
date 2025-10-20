// Staff Management Integration Component
// Provides real-time integration with staff management module

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  UserPlus,
  GraduationCap,
  Heart
} from 'lucide-react';
import { useRealtimeData } from '../../hooks/useRealtimeData';

interface StaffManagementIntegrationProps {
  className?: string;
}

export const StaffManagementIntegration: React.FC<StaffManagementIntegrationProps> = ({ className = '' }) => {
  const { crossModuleData, lastUpdate, isConnected, forceSync } = useRealtimeData({
    events: ['staff_salary_updated', 'staff_benefit_updated', 'expense_created'],
    autoSync: true,
    syncInterval: 3000
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

  if (!crossModuleData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const staffData = crossModuleData.staffData;
  const totalStaffExpenses = staffData.salaryExpenses + staffData.benefitExpenses + staffData.trainingExpenses;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Staff Management Integration</h3>
            <p className="text-sm text-gray-600">Real-time staff expense tracking</p>
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
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Staff Overview */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4">Staff Overview</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-green-900">Total Staff</h5>
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {staffData.totalStaff}
            </div>
            <div className="text-sm text-green-700">Active employees</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-blue-900">Total Staff Expenses</h5>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalStaffExpenses)}
            </div>
            <div className="text-sm text-blue-700">Monthly total</div>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4">Expense Breakdown</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Salaries</div>
                <div className="text-sm text-gray-600">Basic salaries and wages</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {formatCurrency(staffData.salaryExpenses)}
              </div>
              <div className="text-sm text-gray-600">
                {((staffData.salaryExpenses / totalStaffExpenses) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Heart className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium text-gray-900">Benefits</div>
                <div className="text-sm text-gray-600">Health, insurance, allowances</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {formatCurrency(staffData.benefitExpenses)}
              </div>
              <div className="text-sm text-gray-600">
                {((staffData.benefitExpenses / totalStaffExpenses) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Training</div>
                <div className="text-sm text-gray-600">Professional development</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {formatCurrency(staffData.trainingExpenses)}
              </div>
              <div className="text-sm text-gray-600">
                {((staffData.trainingExpenses / totalStaffExpenses) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Integration */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Real-time Integration</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Expense Integration</span>
            <span className="font-medium text-green-600">Active</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">BOT Report Sync</span>
            <span className="font-medium text-green-600">Active</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Budget Tracking</span>
            <span className="font-medium text-green-600">Active</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-4 pt-4 border-t">
        <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
        <div className="space-y-2">
          {staffData.recentHires.length > 0 ? (
            staffData.recentHires.map((hire, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <UserPlus className="h-4 w-4 text-green-600" />
                <span className="text-gray-600">New hire: {hire.name}</span>
                <span className="text-gray-500">{hire.date}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No recent activity</div>
          )}
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

export default StaffManagementIntegration;




























