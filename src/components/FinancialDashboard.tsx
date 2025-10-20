import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  AlertTriangle,
  Brain,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { AIAnalyticsService, PredictionData, MonthlyData } from '../services/aiAnalyticsService';

interface FinancialDashboardProps {
  className?: string;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ className = '' }) => {
  const [activePeriod, setActivePeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [historicalData, setHistoricalData] = useState<MonthlyData[]>([]);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load historical data on mount
  useEffect(() => {
    loadHistoricalData();
  }, []);

  // Load prediction data when period changes
  useEffect(() => {
    if (activePeriod !== 'month') {
      loadPredictionData();
    }
  }, [activePeriod]);

  const loadHistoricalData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await AIAnalyticsService.getHistoricalFinancialData();
      if (error) {
        setError(error);
      } else if (data) {
        setHistoricalData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPredictionData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await AIAnalyticsService.generatePredictiveAnalytics(activePeriod);
      if (error) {
        setError(error);
      } else if (data) {
        setPredictionData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate predictions');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getCurrentMetrics = () => {
    if (historicalData.length === 0) return null;
    const latest = historicalData[historicalData.length - 1];
    return {
      totalCapital: latest.totalCapital,
      loanPortfolio: latest.loanPortfolio,
      par30: latest.par30,
      liquidityRatio: latest.liquidityRatio,
      netIncome: latest.netIncome
    };
  };

  const currentMetrics = getCurrentMetrics();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Time Period Buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Financial Performance Dashboard</h2>
            <p className="text-gray-600 mt-1">YTD Analysis & AI-Powered Predictions</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActivePeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activePeriod === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2 inline" />
              Current Month
            </button>
            <button
              onClick={() => setActivePeriod('quarter')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activePeriod === 'quarter'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Brain className="w-4 h-4 mr-2 inline" />
              Next Quarter (AI)
            </button>
            <button
              onClick={() => setActivePeriod('year')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activePeriod === 'year'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2 inline" />
              End of Year (AI)
            </button>
          </div>
        </div>
      </div>

      {/* Current Metrics Cards */}
      {currentMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Capital</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentMetrics.totalCapital)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Loan Portfolio</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentMetrics.loanPortfolio)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PAR 30</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(currentMetrics.par30)}</p>
                <p className="text-xs text-gray-500">BoT Target: &lt;5%</p>
              </div>
              <div className={`p-3 rounded-lg ${currentMetrics.par30 < 5 ? 'bg-green-100' : 'bg-red-100'}`}>
                <AlertTriangle className={`w-6 h-6 ${currentMetrics.par30 < 5 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Liquidity Ratio</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(currentMetrics.liquidityRatio)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentMetrics.netIncome)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Predictions Section */}
      {activePeriod !== 'month' && predictionData && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center mb-4">
            <Brain className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">
              AI Predictive Analytics - {activePeriod === 'quarter' ? 'Next Quarter' : 'End of Year'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Projected Metrics</h4>
              {activePeriod === 'quarter' && predictionData.predictions.nextQuarter && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Total Capital</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(predictionData.predictions.nextQuarter.totalCapital)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Loan Portfolio</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(predictionData.predictions.nextQuarter.loanPortfolio)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-gray-600">PAR 30</span>
                    <span className="font-bold text-gray-900">
                      {formatPercentage(predictionData.predictions.nextQuarter.par30)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Liquidity Ratio</span>
                    <span className="font-bold text-gray-900">
                      {formatPercentage(predictionData.predictions.nextQuarter.liquidityRatio)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Confidence Level</span>
                    <span className="font-bold text-green-600">
                      {predictionData.predictions.nextQuarter.confidence.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
              
              {activePeriod === 'year' && predictionData.predictions.endOfYear && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Total Capital</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(predictionData.predictions.endOfYear.totalCapital)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Loan Portfolio</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(predictionData.predictions.endOfYear.loanPortfolio)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-gray-600">PAR 30</span>
                    <span className="font-bold text-gray-900">
                      {formatPercentage(predictionData.predictions.endOfYear.par30)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Liquidity Ratio</span>
                    <span className="font-bold text-gray-900">
                      {formatPercentage(predictionData.predictions.endOfYear.liquidityRatio)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Confidence Level</span>
                    <span className="font-bold text-green-600">
                      {predictionData.predictions.endOfYear.confidence.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Key Insights */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Key Insights</h4>
              <div className="space-y-2">
                {((activePeriod === 'quarter' && predictionData.predictions.nextQuarter?.keyInsights) ||
                  (activePeriod === 'year' && predictionData.predictions.endOfYear?.keyInsights))?.map((insight, index) => (
                  <div key={index} className="flex items-start p-3 bg-white rounded-lg">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Capital Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Capital (YTD)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Total Capital']} />
              <Area type="monotone" dataKey="totalCapital" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Loan Portfolio Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Portfolio (YTD)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Loan Portfolio']} />
              <Bar dataKey="loanPortfolio" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PAR 30 Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">PAR 30 Trend (YTD)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatPercentage(value as number), 'PAR 30']} />
              <Line type="monotone" dataKey="par30" stroke="#EF4444" strokeWidth={3} />
              <Line type="monotone" dataKey="5" stroke="#6B7280" strokeDasharray="5 5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2">Dashed line shows BoT threshold (5%)</p>
        </div>

        {/* Liquidity Ratio Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Liquidity Ratio (YTD)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatPercentage(value as number), 'Liquidity Ratio']} />
              <Line type="monotone" dataKey="liquidityRatio" stroke="#8B5CF6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Recommendations */}
      {predictionData && predictionData.recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Brain className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictionData.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">
            {activePeriod === 'month' ? 'Loading historical data...' : 'Generating AI predictions...'}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;





















