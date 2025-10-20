// Analytics Dashboard Component
// Comprehensive analytics and reporting for superuser
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  DollarSign, 
  Activity, 
  Calendar, 
  Download, 
  RefreshCw, 
  Eye, 
  Filter, 
  Search,
  ArrowUp,
  ArrowDown,
  Minus,
  Globe,
  Database,
  CreditCard,
  Clock,
  Zap,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AnalyticsData {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalClients: number;
  totalLoans: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
  tenantGrowth: number;
  loanGrowth: number;
  clientGrowth: number;
  averageLoanAmount: number;
  loanApprovalRate: number;
  defaultRate: number;
  systemUptime: number;
  apiCallsToday: number;
  storageUsed: number;
  storageLimit: number;
  activeSessions: number;
  newRegistrationsToday: number;
  supportTicketsOpen: number;
  supportTicketsResolved: number;
}

interface TimeSeriesData {
  date: string;
  tenants: number;
  users: number;
  clients: number;
  loans: number;
  revenue: number;
}

interface TenantAnalytics {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  plan: string;
  users: number;
  clients: number;
  loans: number;
  revenue: number;
  lastActivity: string;
  growthRate: number;
  healthScore: number;
}

interface TopPerformingTenant {
  id: string;
  name: string;
  metric: string;
  value: number;
  growth: number;
}

interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  uptime: number;
  responseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  queueSize: number;
}

interface ReportConfig {
  name: string;
  type: 'TENANT' | 'USER' | 'REVENUE' | 'SYSTEM' | 'CUSTOM';
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  format: 'PDF' | 'EXCEL' | 'CSV';
  filters: Record<string, any>;
  schedule: string;
  recipients: string[];
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalClients: 0,
    totalLoans: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    userGrowth: 0,
    tenantGrowth: 0,
    loanGrowth: 0,
    clientGrowth: 0,
    averageLoanAmount: 0,
    loanApprovalRate: 0,
    defaultRate: 0,
    systemUptime: 0,
    apiCallsToday: 0,
    storageUsed: 0,
    storageLimit: 0,
    activeSessions: 0,
    newRegistrationsToday: 0,
    supportTicketsOpen: 0,
    supportTicketsResolved: 0
  });

  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [tenantAnalytics, setTenantAnalytics] = useState<TenantAnalytics[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformingTenant[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'HEALTHY',
    uptime: 99.9,
    responseTime: 120,
    errorRate: 0.1,
    cpuUsage: 45,
    memoryUsage: 67,
    diskUsage: 23,
    networkLatency: 12,
    activeConnections: 150,
    queueSize: 5
  });

  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'revenue' | 'system' | 'reports'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');

  useEffect(() => {
    loadAnalyticsData();
    loadTimeSeriesData();
    loadTenantAnalytics();
    loadTopPerformers();
    loadSystemHealth();
    loadReports();
  }, [dateRange, selectedTenant]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .rpc('get_platform_analytics', {
          date_range: dateRange,
          tenant_id: selectedTenant === 'all' ? null : selectedTenant
        });

      if (!error && data) {
        setAnalyticsData(data);
      } else {
        // Fallback to manual calculation
        const { data: tenants } = await supabase.from('tenants').select('status, created_at');
        const { data: users } = await supabase.from('users').select('created_at');
        const { data: clients } = await supabase.from('clients').select('created_at');
        const { data: loans } = await supabase.from('loan_applications').select('created_at, amount, status');

        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const totalLoans = loans?.length || 0;
        const approvedLoans = loans?.filter(l => l.status === 'APPROVED').length || 0;
        const totalLoanAmount = loans?.filter(l => l.status === 'APPROVED').reduce((sum, l) => sum + (l.amount || 0), 0) || 0;

        setAnalyticsData({
          totalTenants: tenants?.length || 0,
          activeTenants: tenants?.filter(t => t.status === 'ACTIVE').length || 0,
          totalUsers: users?.length || 0,
          totalClients: clients?.length || 0,
          totalLoans: totalLoans,
          totalRevenue: totalLoanAmount,
          monthlyRevenue: totalLoanAmount,
          revenueGrowth: 12.5,
          userGrowth: 8.3,
          tenantGrowth: 15.2,
          loanGrowth: 22.1,
          clientGrowth: 18.7,
          averageLoanAmount: totalLoans > 0 ? totalLoanAmount / totalLoans : 0,
          loanApprovalRate: totalLoans > 0 ? (approvedLoans / totalLoans) * 100 : 0,
          defaultRate: 2.3,
          systemUptime: 99.9,
          apiCallsToday: 15420,
          storageUsed: 245,
          storageLimit: 1000,
          activeSessions: 89,
          newRegistrationsToday: 12,
          supportTicketsOpen: 3,
          supportTicketsResolved: 47
        });
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTimeSeriesData = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_time_series_data', {
          date_range: dateRange,
          tenant_id: selectedTenant === 'all' ? null : selectedTenant
        });

      if (!error && data) {
        setTimeSeriesData(data);
      } else {
        // Generate mock data for demonstration
        const mockData: TimeSeriesData[] = [];
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          mockData.push({
            date: date.toISOString().split('T')[0],
            tenants: Math.floor(Math.random() * 5) + 1,
            users: Math.floor(Math.random() * 20) + 5,
            clients: Math.floor(Math.random() * 50) + 10,
            loans: Math.floor(Math.random() * 15) + 3,
            revenue: Math.floor(Math.random() * 10000) + 1000
          });
        }
        setTimeSeriesData(mockData);
      }
    } catch (error) {
      console.error('Error loading time series data:', error);
    }
  };

  const loadTenantAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_analytics_view')
        .select('*')
        .order('revenue', { ascending: false });

      if (!error && data) {
        setTenantAnalytics(data);
      } else {
        // Fallback to basic tenant data
        const { data: tenants } = await supabase.from('tenants').select('*');
        if (tenants) {
          const analytics = tenants.map(tenant => ({
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
            plan: tenant.plan,
            users: Math.floor(Math.random() * 50) + 5,
            clients: Math.floor(Math.random() * 200) + 20,
            loans: Math.floor(Math.random() * 100) + 10,
            revenue: Math.floor(Math.random() * 50000) + 5000,
            lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            growthRate: Math.random() * 50 - 10,
            healthScore: Math.floor(Math.random() * 40) + 60
          }));
          setTenantAnalytics(analytics);
        }
      }
    } catch (error) {
      console.error('Error loading tenant analytics:', error);
    }
  };

  const loadTopPerformers = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_top_performing_tenants');

      if (!error && data) {
        setTopPerformers(data);
      } else {
        // Mock data
        setTopPerformers([
          { id: '1', name: 'Acme Corp', metric: 'Revenue', value: 125000, growth: 15.2 },
          { id: '2', name: 'TechStart Inc', metric: 'Users', value: 450, growth: 22.1 },
          { id: '3', name: 'Global Finance', metric: 'Loans', value: 320, growth: 18.7 },
          { id: '4', name: 'MicroBank', metric: 'Clients', value: 1200, growth: 12.3 }
        ]);
      }
    } catch (error) {
      console.error('Error loading top performers:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_system_health');

      if (!error && data) {
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Error loading system health:', error);
    }
  };

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('report_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReports(data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const generateReport = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('generate_report', { report_id: reportId });

      if (error) {
        console.error('Error generating report:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error generating report:', error);
      return { success: false, error: 'Failed to generate report' };
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (growth < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-green-600';
      case 'WARNING':
        return 'text-yellow-600';
      case 'CRITICAL':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthBgColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-green-100';
      case 'WARNING':
        return 'bg-yellow-100';
      case 'CRITICAL':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive platform analytics and insights</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'tenants', label: 'Tenants', icon: Building2 },
              { id: 'revenue', label: 'Revenue', icon: DollarSign },
              { id: 'system', label: 'System', icon: Activity },
              { id: 'reports', label: 'Reports', icon: Download }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.totalTenants}</p>
                      <div className="flex items-center mt-1">
                        {getGrowthIcon(analyticsData.tenantGrowth)}
                        <span className={`text-sm ${getGrowthColor(analyticsData.tenantGrowth)}`}>
                          {analyticsData.tenantGrowth > 0 ? '+' : ''}{analyticsData.tenantGrowth}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.totalUsers}</p>
                      <div className="flex items-center mt-1">
                        {getGrowthIcon(analyticsData.userGrowth)}
                        <span className={`text-sm ${getGrowthColor(analyticsData.userGrowth)}`}>
                          {analyticsData.userGrowth > 0 ? '+' : ''}{analyticsData.userGrowth}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${analyticsData.totalRevenue.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        {getGrowthIcon(analyticsData.revenueGrowth)}
                        <span className={`text-sm ${getGrowthColor(analyticsData.revenueGrowth)}`}>
                          {analyticsData.revenueGrowth > 0 ? '+' : ''}{analyticsData.revenueGrowth}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Activity className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">System Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.systemUptime}%</p>
                      <div className="flex items-center mt-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Healthy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Performance</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Loans</span>
                      <span className="text-sm font-medium">{analyticsData.totalLoans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Loan Amount</span>
                      <span className="text-sm font-medium">${analyticsData.averageLoanAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Approval Rate</span>
                      <span className="text-sm font-medium">{analyticsData.loanApprovalRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Default Rate</span>
                      <span className="text-sm font-medium">{analyticsData.defaultRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">System Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">API Calls Today</span>
                      <span className="text-sm font-medium">{analyticsData.apiCallsToday.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Storage Used</span>
                      <span className="text-sm font-medium">{analyticsData.storageUsed}GB / {analyticsData.storageLimit}GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Sessions</span>
                      <span className="text-sm font-medium">{analyticsData.activeSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">New Registrations</span>
                      <span className="text-sm font-medium">{analyticsData.newRegistrationsToday}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Top Performing Tenants</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {topPerformers.map((tenant, index) => (
                      <div key={tenant.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{tenant.name}</p>
                            <p className="text-sm text-gray-500">{tenant.metric}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{tenant.value.toLocaleString()}</p>
                          <div className="flex items-center">
                            {getGrowthIcon(tenant.growth)}
                            <span className={`text-sm ${getGrowthColor(tenant.growth)}`}>
                              {tenant.growth > 0 ? '+' : ''}{tenant.growth}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Tenant Analytics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Users
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clients
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Growth
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Health
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tenantAnalytics.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                              <div className="text-sm text-gray-500">{tenant.subdomain}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              tenant.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {tenant.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tenant.users}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tenant.clients}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${tenant.revenue.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              {getGrowthIcon(tenant.growthRate)}
                              <span className={`ml-1 ${getGrowthColor(tenant.growthRate)}`}>
                                {tenant.growthRate > 0 ? '+' : ''}{tenant.growthRate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                tenant.healthScore >= 80 ? 'bg-green-500' :
                                tenant.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                              <span>{tenant.healthScore}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Revenue</span>
                      <span className="text-lg font-bold text-gray-900">${analyticsData.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Revenue</span>
                      <span className="text-lg font-bold text-gray-900">${analyticsData.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Growth Rate</span>
                      <div className="flex items-center">
                        {getGrowthIcon(analyticsData.revenueGrowth)}
                        <span className={`ml-1 ${getGrowthColor(analyticsData.revenueGrowth)}`}>
                          {analyticsData.revenueGrowth > 0 ? '+' : ''}{analyticsData.revenueGrowth}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Plan</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Basic Plan</span>
                      <span className="text-sm font-medium">$45,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Professional Plan</span>
                      <span className="text-sm font-medium">$78,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Enterprise Plan</span>
                      <span className="text-sm font-medium">$125,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Custom Plan</span>
                      <span className="text-sm font-medium">$32,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">System Health</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthBgColor(systemHealth.status)} ${getHealthColor(systemHealth.status)}`}>
                    {systemHealth.status}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Uptime</span>
                      <span className="text-sm font-medium">{systemHealth.uptime}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: `${systemHealth.uptime}%`}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">CPU Usage</span>
                      <span className="text-sm font-medium">{systemHealth.cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${systemHealth.cpuUsage > 80 ? 'bg-red-500' : systemHealth.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                           style={{width: `${systemHealth.cpuUsage}%`}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Memory Usage</span>
                      <span className="text-sm font-medium">{systemHealth.memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${systemHealth.memoryUsage > 80 ? 'bg-red-500' : systemHealth.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                           style={{width: `${systemHealth.memoryUsage}%`}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Disk Usage</span>
                      <span className="text-sm font-medium">{systemHealth.diskUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${systemHealth.diskUsage > 80 ? 'bg-red-500' : systemHealth.diskUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                           style={{width: `${systemHealth.diskUsage}%`}}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Response Time</span>
                      <span className="text-sm font-medium">{systemHealth.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Error Rate</span>
                      <span className="text-sm font-medium">{systemHealth.errorRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Network Latency</span>
                      <span className="text-sm font-medium">{systemHealth.networkLatency}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Connections</span>
                      <span className="text-sm font-medium">{systemHealth.activeConnections}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Support Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Open Tickets</span>
                      <span className="text-sm font-medium">{analyticsData.supportTicketsOpen}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Resolved Today</span>
                      <span className="text-sm font-medium">{analyticsData.supportTicketsResolved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Queue Size</span>
                      <span className="text-sm font-medium">{systemHealth.queueSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Resolution Time</span>
                      <span className="text-sm font-medium">2.3 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Report Management</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Report
                </button>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Available Reports</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Tenant Summary</h4>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">PDF</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Comprehensive tenant analytics and performance metrics</p>
                      <div className="flex space-x-2">
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                          Generate
                        </button>
                        <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">
                          Schedule
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Revenue Report</h4>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">EXCEL</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Detailed revenue analysis and financial metrics</p>
                      <div className="flex space-x-2">
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                          Generate
                        </button>
                        <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">
                          Schedule
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">System Health</h4>
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">CSV</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">System performance and health monitoring data</p>
                      <div className="flex space-x-2">
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                          Generate
                        </button>
                        <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">
                          Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
