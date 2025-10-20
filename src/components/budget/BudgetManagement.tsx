// Budget Management Component
// Comprehensive budget management interface

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Plus,
  Edit,
  Save,
  Trash2,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  Users,
  Settings
} from 'lucide-react';
import { budgetService } from '../../services/budgetService';
import { BudgetItem, BudgetVariance, BudgetForecast, BudgetReport, BudgetAnalysis } from '../../types/budget';

interface BudgetManagementProps {
  className?: string;
}

export const BudgetManagement: React.FC<BudgetManagementProps> = ({ className = '' }) => {
  const [budgetData, setBudgetData] = useState<BudgetAnalysis | null>(null);
  const [budgetReport, setBudgetReport] = useState<BudgetReport | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const analysis = budgetService.getBudgetAnalysis();
      const report = budgetService.createBudgetReport();
      
      setBudgetData(analysis);
      setBudgetReport(report);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getVarianceColor = (variance: number) => {
    if (variance < -10) return 'text-green-600';
    if (variance < 0) return 'text-green-500';
    if (variance < 10) return 'text-yellow-500';
    if (variance < 20) return 'text-orange-500';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleEditBudget = (item: BudgetItem) => {
    setEditingItem(item);
    setIsEditing(true);
  };

  const handleSaveBudget = () => {
    if (editingItem) {
      budgetService.updateBudgetItem(editingItem.id, editingItem);
      loadBudgetData();
    }
    setIsEditing(false);
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!budgetData || !budgetReport) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">No budget data available</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Target className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Budget Management</h3>
            <p className="text-sm text-gray-600">Operating expenses budget control</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadBudgetData}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900">Total Budget</h4>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(budgetData.totalBudget)}
          </div>
          <div className="text-sm text-blue-700">Annual budget</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-green-900">Total Spent</h4>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(budgetData.totalActual)}
          </div>
          <div className="text-sm text-green-700">
            {formatPercentage(budgetData.utilizationRate)} utilized
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-orange-900">Available</h4>
            <TrendingDown className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(budgetData.totalAvailable)}
          </div>
          <div className="text-sm text-orange-700">Remaining budget</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-purple-900">Variance</h4>
            <AlertTriangle className="h-5 w-5 text-purple-600" />
          </div>
          <div className={`text-2xl font-bold ${getVarianceColor(budgetReport.variancePercentage)}`}>
            {formatPercentage(budgetReport.variancePercentage)}
          </div>
          <div className="text-sm text-purple-700">vs budget</div>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4">Budget Categories</h4>
        <div className="space-y-3">
          {budgetReport.categories.map((category) => (
            <div key={category.categoryId} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h5 className="font-medium text-gray-900">{category.categoryName}</h5>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getSeverityColor(category.severity)
                  }`}>
                    {category.severity.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditBudget({
                      id: `budget-${category.categoryId}`,
                      categoryId: category.categoryId,
                      categoryName: category.categoryName,
                      budgetPeriodId: 'current-year',
                      budgetedAmount: category.budgetedAmount,
                      actualAmount: category.actualAmount,
                      committedAmount: 0,
                      availableAmount: category.budgetedAmount - category.actualAmount,
                      varianceAmount: category.varianceAmount,
                      variancePercentage: category.variancePercentage,
                      isOverBudget: category.varianceAmount > 0,
                      lastUpdated: new Date(),
                      updatedBy: 'system'
                    })}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Budgeted</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(category.budgetedAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Actual</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(category.actualAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Variance</div>
                  <div className={`font-semibold ${getVarianceColor(category.variancePercentage)}`}>
                    {formatCurrency(category.varianceAmount)} ({formatPercentage(category.variancePercentage)})
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Utilization</span>
                  <span>{formatPercentage((category.actualAmount / category.budgetedAmount) * 100)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      category.varianceAmount > 0 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((category.actualAmount / category.budgetedAmount) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Forecast */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4">Budget Forecast</h4>
        <div className="space-y-3">
          {budgetData.forecastAnalysis.map((forecast) => (
            <div key={forecast.categoryId} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{forecast.categoryName}</h5>
                {forecast.projectedOverspend && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    OVERSPEND RISK
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Current Spend</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(forecast.currentSpend)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Projected</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(forecast.projectedSpend)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Remaining</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(forecast.budgetRemaining)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Burn Rate</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(forecast.burnRate)}/day
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {budgetData.recommendations.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-2">
            {budgetData.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <span className="text-gray-700">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Budget Item</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editingItem.categoryName}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budgeted Amount
                </label>
                <input
                  type="number"
                  value={editingItem.budgetedAmount}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    budgetedAmount: parseFloat(e.target.value) || 0
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;




























