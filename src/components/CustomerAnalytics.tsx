import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Star, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LoyaltyTierDisplay from './LoyaltyTierDisplay';

interface CustomerAnalyticsProps {
  clientId: string;
  onClose?: () => void;
}

interface AnalyticsData {
  behavior_score: number;
  payment_patterns: {
    avg_delay_days: number;
    consistency_score: number;
    payment_frequency: number;
    risk_level: string;
  };
  loan_prediction: {
    predicted_amount: number;
    confidence: number;
    factors: any;
  };
  churn_assessment: {
    churn_score: number;
    churn_probability: number;
    risk_level: string;
    risk_factors: any;
  };
  recommendations: {
    action_required: boolean;
    suggested_loan_amount: number;
    risk_level: string;
    priority_level: string;
  };
}

interface CustomerData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  client_category: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({ clientId, onClose }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchCustomer();
  }, [clientId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Call the analytics function
      const { data, error } = await supabase.rpc('generate_customer_analytics', {
        client_uuid: clientId
      });

      if (error) throw error;
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load customer analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          status,
          client_category,
          created_at,
          updated_at
        `)
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (err) {
      console.error('Error fetching customer:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics || !customer) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Available</h3>
          <p className="text-gray-600">Analytics data not found for this customer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Customer Analytics</h2>
              <p className="text-blue-100">
                {customer.first_name} {customer.last_name} - Advanced Insights
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Customer Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoyaltyTierDisplay
            tier={customer.client_category}
            status={customer.status}
            performanceScore={0}
            lifetimeValue={0}
            totalLoans={0}
            compact={false}
          />
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Behavior Score</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {analytics.behavior_score}/100
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${analytics.behavior_score}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {analytics.behavior_score > 80 ? 'Excellent' : 
                 analytics.behavior_score > 60 ? 'Good' : 
                 analytics.behavior_score > 40 ? 'Fair' : 'Poor'} Performance
              </p>
            </div>
          </div>
        </div>

        {/* Payment Patterns */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Payment Patterns</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {analytics.payment_patterns.avg_delay_days.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Delay Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {analytics.payment_patterns.consistency_score.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Consistency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {analytics.payment_patterns.payment_frequency.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Loans/Year</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold px-3 py-1 rounded-full ${getRiskColor(analytics.payment_patterns.risk_level)}`}>
                {analytics.payment_patterns.risk_level.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">Risk Level</div>
            </div>
          </div>
        </div>

        {/* Loan Prediction */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Loan Prediction</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatCurrency(analytics.loan_prediction.predicted_amount)}
              </div>
              <div className="text-sm text-gray-600 mb-4">Suggested Loan Amount</div>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-600">Confidence:</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${analytics.loan_prediction.confidence}%` }}
                  ></div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {analytics.loan_prediction.confidence.toFixed(0)}%
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Prediction Factors</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lifetime Value:</span>
                  <span className="font-medium">{formatCurrency(analytics.loan_prediction.factors.lifetime_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Performance Score:</span>
                  <span className="font-medium">{analytics.loan_prediction.factors.performance_score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Client Category:</span>
                  <span className="font-medium">{customer.client_category?.toUpperCase() || 'NEW'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Loans:</span>
                  <span className="font-medium">{analytics.loan_prediction.factors.total_loans}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Churn Assessment */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Churn Risk Assessment</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {analytics.churn_assessment.churn_score}/100
              </div>
              <div className="text-sm text-gray-600 mb-4">Churn Risk Score</div>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-600">Probability:</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${analytics.churn_assessment.churn_probability}%` }}
                  ></div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {analytics.churn_assessment.churn_probability.toFixed(0)}%
                </div>
              </div>
            </div>
            <div>
              <div className={`text-2xl font-bold px-3 py-1 rounded-full ${getRiskColor(analytics.churn_assessment.risk_level)} mb-4`}>
                {analytics.churn_assessment.risk_level.toUpperCase()}
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Risk Factors</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Performance:</span>
                  <span className="font-medium">{analytics.churn_assessment.risk_factors.payment_performance}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Client Status:</span>
                  <span className="font-medium">{customer.status?.toUpperCase() || 'ACTIVE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Client Category:</span>
                  <span className="font-medium">{customer.client_category?.toUpperCase() || 'NEW'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Contact:</span>
                  <span className="font-medium">{analytics.churn_assessment.risk_factors.last_contact_days_ago} days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Recommendations</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {formatCurrency(analytics.recommendations.suggested_loan_amount)}
              </div>
              <div className="text-sm text-gray-600 mb-4">Recommended Loan Amount</div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(analytics.recommendations.priority_level)}`}>
                {analytics.recommendations.priority_level.toUpperCase()} PRIORITY
              </div>
            </div>
            <div>
              <div className={`text-2xl font-bold px-3 py-1 rounded-full ${getRiskColor(analytics.recommendations.risk_level)} mb-4`}>
                {analytics.recommendations.risk_level.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600 mb-2">Risk Level</div>
              {analytics.recommendations.action_required && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Action Required</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;

