// Billing Management Component
// Comprehensive billing and subscription management for superuser
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Users, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Upload, 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Mail, 
  Phone, 
  Globe, 
  Lock, 
  Unlock, 
  Zap, 
  Shield,
  Activity,
  BarChart3,
  FileText,
  Receipt,
  Wallet,
  Banknote,
  Coins
} from 'lucide-react';

interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: 'MONTHLY' | 'YEARLY' | 'QUARTERLY';
  max_users: number;
  max_clients: number;
  storage_limit_gb: number;
  api_calls_limit: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  tenant_id: string;
  tenant_name: string;
  plan_id: string;
  plan_name: string;
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIAL' | 'SUSPENDED';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  amount: number;
  currency: string;
  billing_cycle: string;
  next_billing_date: string;
  last_payment_date?: string;
  last_payment_amount?: number;
  payment_method: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: string;
  subscription_id: string;
  tenant_id: string;
  tenant_name: string;
  invoice_number: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  amount: number;
  currency: string;
  tax_amount: number;
  total_amount: number;
  due_date: string;
  paid_date?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  subscription_id: string;
  tenant_id: string;
  tenant_name: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  payment_method: string;
  transaction_id: string;
  gateway: string;
  created_at: string;
  updated_at: string;
}

interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  yearlyRevenue: number;
  revenueGrowth: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  overdueSubscriptions: number;
  averageRevenuePerUser: number;
  churnRate: number;
  lifetimeValue: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
}

interface PaymentMethod {
  id: string;
  tenant_id: string;
  type: 'CARD' | 'BANK_ACCOUNT' | 'WALLET' | 'OTHER';
  last_four: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  created_at: string;
}

const BillingManagement: React.FC = () => {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    quarterlyRevenue: 0,
    yearlyRevenue: 0,
    revenueGrowth: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    cancelledSubscriptions: 0,
    overdueSubscriptions: 0,
    averageRevenuePerUser: 0,
    churnRate: 0,
    lifetimeValue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'invoices' | 'payments' | 'plans' | 'methods'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    loadBillingData();
  }, [dateRange, filterStatus, filterPlan]);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadPlans(),
        loadSubscriptions(),
        loadInvoices(),
        loadPayments(),
        loadPaymentMethods(),
        loadBillingStats()
      ]);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_plans')
        .select('*')
        .order('price', { ascending: true });

      if (!error && data) {
        setPlans(data);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSubscriptions(data);
      } else {
        // Fallback to basic subscriptions table
        const { data: basicSubs, error: basicError } = await supabase
          .from('subscriptions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!basicError && basicSubs) {
          setSubscriptions(basicSubs);
        }
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPayments(data);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPaymentMethods(data);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadBillingStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_billing_stats', {
          date_range: dateRange
        });

      if (!error && data) {
        setStats(data);
      } else {
        // Mock data for demonstration
        setStats({
          totalRevenue: 1250000,
          monthlyRevenue: 125000,
          quarterlyRevenue: 375000,
          yearlyRevenue: 1250000,
          revenueGrowth: 15.2,
          activeSubscriptions: 45,
          trialSubscriptions: 8,
          cancelledSubscriptions: 12,
          overdueSubscriptions: 3,
          averageRevenuePerUser: 2777,
          churnRate: 2.1,
          lifetimeValue: 12500,
          totalInvoices: 156,
          paidInvoices: 142,
          overdueInvoices: 14,
          totalPayments: 142,
          successfulPayments: 138,
          failedPayments: 4
        });
      }
    } catch (error) {
      console.error('Error loading billing stats:', error);
    }
  };

  const createPlan = async (planData: Partial<BillingPlan>) => {
    try {
      const { data, error } = await supabase
        .from('billing_plans')
        .insert(planData)
        .select()
        .single();

      if (error) {
        console.error('Error creating plan:', error);
        return { success: false, error: error.message };
      }

      await loadPlans();
      setShowCreatePlan(false);
      return { success: true, data };
    } catch (error) {
      console.error('Error creating plan:', error);
      return { success: false, error: 'Failed to create plan' };
    }
  };

  const updateSubscription = async (subscriptionId: string, updates: Partial<Subscription>) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId);

      if (error) {
        console.error('Error updating subscription:', error);
        return { success: false, error: error.message };
      }

      await loadSubscriptions();
      return { success: true };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: 'Failed to update subscription' };
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    return await updateSubscription(subscriptionId, { 
      status: 'CANCELLED',
      cancel_at_period_end: true 
    });
  };

  const suspendSubscription = async (subscriptionId: string) => {
    return await updateSubscription(subscriptionId, { status: 'SUSPENDED' });
  };

  const activateSubscription = async (subscriptionId: string) => {
    return await updateSubscription(subscriptionId, { status: 'ACTIVE' });
  };

  const createInvoice = async (invoiceData: Partial<Invoice>) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) {
        console.error('Error creating invoice:', error);
        return { success: false, error: error.message };
      }

      await loadInvoices();
      setShowCreateInvoice(false);
      return { success: true, data };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { success: false, error: 'Failed to create invoice' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'PAID':
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'CANCELLED':
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'TRIAL':
      case 'PENDING':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'PAST_DUE':
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'SUSPENDED':
        return <Lock className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'PAID':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'TRIAL':
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      case 'PAST_DUE':
      case 'OVERDUE':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.plan_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || sub.plan_id === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing Management</h2>
          <p className="text-gray-600">Manage subscriptions, invoices, and payments</p>
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
            onClick={loadBillingData}
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
              { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
              { id: 'invoices', label: 'Invoices', icon: Receipt },
              { id: 'payments', label: 'Payments', icon: Banknote },
              { id: 'plans', label: 'Plans', icon: Shield },
              { id: 'methods', label: 'Payment Methods', icon: Wallet }
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
              {/* Revenue Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        {getGrowthIcon(stats.revenueGrowth)}
                        <span className={`text-sm ${getGrowthColor(stats.revenueGrowth)}`}>
                          {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                      <p className="text-sm text-gray-500">{stats.trialSubscriptions} trials</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Receipt className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.paidInvoices}</p>
                      <p className="text-sm text-gray-500">{stats.overdueInvoices} overdue</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Users className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">ARPU</p>
                      <p className="text-2xl font-bold text-gray-900">${stats.averageRevenuePerUser}</p>
                      <p className="text-sm text-gray-500">Churn: {stats.churnRate}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Period</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Revenue</span>
                      <span className="text-sm font-medium">${stats.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Quarterly Revenue</span>
                      <span className="text-sm font-medium">${stats.quarterlyRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Yearly Revenue</span>
                      <span className="text-sm font-medium">${stats.yearlyRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Health</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Subscriptions</span>
                      <span className="text-sm font-medium text-green-600">{stats.activeSubscriptions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Trial Subscriptions</span>
                      <span className="text-sm font-medium text-blue-600">{stats.trialSubscriptions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cancelled Subscriptions</span>
                      <span className="text-sm font-medium text-red-600">{stats.cancelledSubscriptions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Overdue Subscriptions</span>
                      <span className="text-sm font-medium text-yellow-600">{stats.overdueSubscriptions}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search subscriptions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="TRIAL">Trial</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="PAST_DUE">Past Due</option>
                    </select>
                    <select
                      value={filterPlan}
                      onChange={(e) => setFilterPlan(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Plans</option>
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Subscriptions Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Subscriptions ({filteredSubscriptions.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Next Billing
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSubscriptions.map((subscription) => (
                        <tr key={subscription.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{subscription.tenant_name}</div>
                              <div className="text-sm text-gray-500">{subscription.tenant_id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{subscription.plan_name}</div>
                            <div className="text-sm text-gray-500">{subscription.billing_cycle}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(subscription.status)}
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                                {subscription.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${subscription.amount.toLocaleString()} {subscription.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(subscription.next_billing_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subscription.payment_method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setSelectedSubscription(subscription)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {subscription.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => suspendSubscription(subscription.id)}
                                  className="text-orange-600 hover:text-orange-900 p-1"
                                  title="Suspend"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                              ) : subscription.status === 'SUSPENDED' ? (
                                <button
                                  onClick={() => activateSubscription(subscription.id)}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title="Activate"
                                >
                                  <Unlock className="w-4 h-4" />
                                </button>
                              ) : null}
                              <button
                                onClick={() => cancelSubscription(subscription.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
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

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="DRAFT">Draft</option>
                      <option value="SENT">Sent</option>
                      <option value="PAID">Paid</option>
                      <option value="OVERDUE">Overdue</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <button
                      onClick={() => setShowCreateInvoice(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Invoice
                    </button>
                  </div>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Invoices ({filteredInvoices.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{invoice.tenant_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(invoice.status)}
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${invoice.total_amount.toLocaleString()} {invoice.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(invoice.due_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button className="text-blue-600 hover:text-blue-900 p-1" title="View">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900 p-1" title="Download">
                                <Download className="w-4 h-4" />
                              </button>
                              <button className="text-yellow-600 hover:text-yellow-900 p-1" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
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

          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Billing Plans</h3>
                <button
                  onClick={() => setShowCreatePlan(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Plan
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div key={plan.id} className="bg-white rounded-lg shadow border border-gray-200">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-500">/{plan.billing_cycle.toLowerCase()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Max Users:</span>
                          <span className="font-medium">{plan.max_users}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Max Clients:</span>
                          <span className="font-medium">{plan.max_clients}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Storage:</span>
                          <span className="font-medium">{plan.storage_limit_gb}GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">API Calls:</span>
                          <span className="font-medium">{plan.api_calls_limit.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                          Edit
                        </button>
                        <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700">
                          {plan.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingManagement;
