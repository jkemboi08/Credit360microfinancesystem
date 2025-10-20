import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { GroupService, Group } from '../services/groupService';
import {
  BarChart3, TrendingUp, TrendingDown, Users, DollarSign, Shield,
  Calendar, Download, RefreshCw, Eye, FileText, AlertTriangle
} from 'lucide-react';

interface GroupPerformanceMetrics {
  group_id: string;
  group_name: string;
  period: string;
  total_members: number;
  active_members: number;
  total_loans: number;
  total_loan_amount: number;
  total_repayments: number;
  repayment_rate: number;
  default_rate: number;
  savings_collected: number;
  guarantee_utilization: number;
  group_health_score: number;
  performance_rank: number;
}

interface PerformanceTrend {
  date: string;
  loan_amount: number;
  repayments: number;
  defaults: number;
  savings: number;
  health_score: number;
}

const GroupPerformanceAnalytics: React.FC = () => {
  const { t, language } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<GroupPerformanceMetrics | null>(null);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const result = await GroupService.getGroups();
      
      if (result.success && result.data) {
        setGroups(result.data);
        if (result.data.length > 0) {
          setSelectedGroup(result.data[0]);
          loadPerformanceData(result.data[0].id);
        }
      } else {
        setError(result.error || 'Failed to load groups');
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async (groupId: string) => {
    try {
      // Mock data - in real app, this would come from Supabase
      const mockMetrics: GroupPerformanceMetrics = {
        group_id: groupId,
        group_name: 'Women Entrepreneurs Group',
        period: 'January 2025',
        total_members: 8,
        active_members: 7,
        total_loans: 12,
        total_loan_amount: 2400000,
        total_repayments: 1800000,
        repayment_rate: 85.5,
        default_rate: 8.3,
        savings_collected: 320000,
        guarantee_utilization: 15.2,
        group_health_score: 78.5,
        performance_rank: 3
      };
      
      const mockTrends: PerformanceTrend[] = [
        { date: '2024-10-01', loan_amount: 1800000, repayments: 1500000, defaults: 120000, savings: 280000, health_score: 72 },
        { date: '2024-11-01', loan_amount: 2000000, repayments: 1650000, defaults: 150000, savings: 300000, health_score: 75 },
        { date: '2024-12-01', loan_amount: 2200000, repayments: 1700000, defaults: 180000, savings: 310000, health_score: 76 },
        { date: '2025-01-01', loan_amount: 2400000, repayments: 1800000, defaults: 200000, savings: 320000, health_score: 78.5 }
      ];
      
      setPerformanceMetrics(mockMetrics);
      setPerformanceTrends(mockTrends);
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

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
      month: 'short'
    });
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceRankColor = (rank: number) => {
    if (rank <= 3) return 'text-green-600 bg-green-100';
    if (rank <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading Performance Analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Group Performance Analytics</h1>
            <p className="text-gray-600">Comprehensive group performance metrics and insights</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {/* Group Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Group</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedGroup(group);
                  loadPerformanceData(group.id);
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedGroup?.id === group.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <h4 className="font-medium text-gray-900">{group.name}</h4>
                <p className="text-sm text-gray-600">{group.total_members} members</p>
                <p className="text-xs text-gray-500 mt-1">
                  Guarantee: {formatCurrency(group.current_guarantee_balance)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Performance Overview */}
        {performanceMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceMetrics.active_members}/{performanceMetrics.total_members}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((performanceMetrics.active_members / performanceMetrics.total_members) * 100).toFixed(1)}% active
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Loans</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(performanceMetrics.total_loan_amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {performanceMetrics.total_loans} loans
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Repayment Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceMetrics.repayment_rate}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(performanceMetrics.total_repayments)} repaid
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Group Health</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceMetrics.group_health_score}%
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getHealthScoreColor(performanceMetrics.group_health_score)}`}>
                    Rank #{performanceMetrics.performance_rank}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Trends Chart */}
        {performanceTrends.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
            
            <div className="space-y-4">
              {performanceTrends.map((trend, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900">{formatDate(trend.date)}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthScoreColor(trend.health_score)}`}>
                      Health: {trend.health_score}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Loan Amount</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(trend.loan_amount)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Repayments</p>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(trend.repayments)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Defaults</p>
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(trend.defaults)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Savings</p>
                      <p className="text-lg font-semibold text-blue-600">{formatCurrency(trend.savings)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Metrics */}
        {performanceMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Performance</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Loan Amount</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(performanceMetrics.total_loan_amount)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Repayments</span>
                  <span className="font-semibold text-green-600">{formatCurrency(performanceMetrics.total_repayments)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Outstanding Amount</span>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(performanceMetrics.total_loan_amount - performanceMetrics.total_repayments)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Savings Collected</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(performanceMetrics.savings_collected)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Guarantee Utilization</span>
                  <span className="font-semibold text-purple-600">{performanceMetrics.guarantee_utilization}%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Metrics</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Repayment Rate</span>
                  <span className="font-semibold text-green-600">{performanceMetrics.repayment_rate}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Default Rate</span>
                  <span className="font-semibold text-red-600">{performanceMetrics.default_rate}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Group Health Score</span>
                  <span className={`font-semibold ${getHealthScoreColor(performanceMetrics.group_health_score).split(' ')[0]}`}>
                    {performanceMetrics.group_health_score}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Performance Rank</span>
                  <span className={`font-semibold ${getPerformanceRankColor(performanceMetrics.performance_rank).split(' ')[0]}`}>
                    #{performanceMetrics.performance_rank}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Members</span>
                  <span className="font-semibold text-blue-600">
                    {performanceMetrics.active_members}/{performanceMetrics.total_members}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Recommendations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Strong Repayment Performance</h4>
                  <p className="text-sm text-green-700">
                    Your group maintains a healthy repayment rate of {performanceMetrics?.repayment_rate}%. 
                    Consider increasing loan amounts for qualified members.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Monitor Default Rate</h4>
                  <p className="text-sm text-yellow-700">
                    Default rate of {performanceMetrics?.default_rate}% is above optimal. 
                    Consider implementing stricter screening or additional support for at-risk members.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <TrendingUp className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Savings Growth Opportunity</h4>
                  <p className="text-sm text-blue-700">
                    Current savings of {formatCurrency(performanceMetrics?.savings_collected || 0)} show good potential. 
                    Consider introducing savings incentives to boost member engagement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GroupPerformanceAnalytics;




































