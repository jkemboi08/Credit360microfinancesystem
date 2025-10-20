import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  PieChart,
  BarChart3,
  Activity,
  Eye,
  Edit,
  Archive,
  Download,
  Share2,
  Star,
  StarOff,
  UserCheck,
  Building,
  Handshake,
  Target,
  Zap,
  Award,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

const Client360Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([]));

  // Fetch client data
  const { data: client, loading: clientLoading, error: clientError } = useSupabaseQuery('clients', {
    filters: [{ column: 'id', operator: 'eq', value: clientId }],
    single: true
  });

  // Fetch related data
  const { data: loans = [] } = useSupabaseQuery('loans', {
    filters: [{ column: 'client_id', operator: 'eq', value: clientId }]
  });

  const { data: transactions = [] } = useSupabaseQuery('transactions', {
    filters: [{ column: 'client_id', operator: 'eq', value: clientId }],
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: applications = [] } = useSupabaseQuery('loan_applications', {
    filters: [{ column: 'client_id', operator: 'eq', value: clientId }],
    orderBy: { column: 'created_at', ascending: false }
  });

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return <User className="w-6 h-6" />;
      case 'corporate': return <Building2 className="w-6 h-6" />;
      case 'group': return <Users className="w-6 h-6" />;
      default: return <User className="w-6 h-6" />;
    }
  };

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'text-blue-600 bg-blue-100';
      case 'corporate': return 'text-green-600 bg-green-100';
      case 'group': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevel = (client: any) => {
    // Simple risk assessment based on available data
    let riskScore = 0;
    
    if (client?.kyc_status === 'verified') riskScore -= 2;
    if (client?.kyc_status === 'rejected') riskScore += 3;
    
    if (client?.employment_status === 'employed') riskScore -= 1;
    if (client?.employment_status === 'unemployed') riskScore += 2;
    
    if (loans.length > 0) {
      const activeLoans = loans.filter((loan: any) => loan.status === 'active');
      if (activeLoans.length > 3) riskScore += 1;
    }
    
    if (riskScore <= 0) return { level: 'Low', color: 'text-green-600 bg-green-100' };
    if (riskScore <= 2) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
    return { level: 'High', color: 'text-red-600 bg-red-100' };
  };

  const calculateTotalOutstanding = () => {
    return loans
      .filter((loan: any) => loan.status === 'active')
      .reduce((total: number, loan: any) => total + (loan.outstanding_amount || 0), 0);
  };

  const calculateTotalPaid = () => {
    return transactions
      .filter((txn: any) => txn.type === 'repayment')
      .reduce((total: number, txn: any) => total + (txn.amount || 0), 0);
  };

  const getRecentActivity = () => {
    const allActivities = [
      ...loans.map((loan: any) => ({
        type: 'loan',
        title: `Loan ${loan.loan_number} ${loan.status}`,
        date: loan.created_at,
        amount: loan.amount,
        icon: <CreditCard className="w-4 h-4" />
      })),
      ...transactions.slice(0, 5).map((txn: any) => ({
        type: 'transaction',
        title: `${txn.type} - ${txn.description}`,
        date: txn.created_at,
        amount: txn.amount,
        icon: <DollarSign className="w-4 h-4" />
      })),
      ...applications.slice(0, 3).map((app: any) => ({
        type: 'application',
        title: `Application ${app.application_number} - ${app.status}`,
        date: app.created_at,
        amount: app.requested_amount,
        icon: <FileText className="w-4 h-4" />
      }))
    ];

    return allActivities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  if (clientLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (clientError || !client) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Client Not Found</h2>
          <p className="text-gray-600 mb-4">The requested client could not be found.</p>
          <button
            onClick={() => navigate('/staff/clients')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Clients
          </button>
        </div>
      </Layout>
    );
  }

  const riskLevel = getRiskLevel(client);
  const totalOutstanding = calculateTotalOutstanding();
  const totalPaid = calculateTotalPaid();
  const recentActivity = getRecentActivity();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${getClientTypeColor(client.client_type)}`}>
                {getClientTypeIcon(client.client_type)}
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {client.client_type === 'individual' 
                    ? `${client.first_name} ${client.last_name}`
                    : client.client_type === 'corporate'
                    ? client.company_name
                    : client.group_name
                  }
                </h1>
                <p className="text-indigo-100">
                  {client.client_type === 'individual' && `Individual Client`}
                  {client.client_type === 'corporate' && client.industry_sector}
                  {client.client_type === 'group' && `${client.legal_structure} Group`}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 flex items-center">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 flex items-center">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  TZS {totalOutstanding.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  TZS {totalPaid.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loans.filter((loan: any) => loan.status === 'active').length}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risk Level</p>
                <p className={`text-lg font-bold ${riskLevel.color}`}>
                  {riskLevel.level}
                </p>
              </div>
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Identity Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div 
                className="p-4 border-b border-gray-200 cursor-pointer flex items-center justify-between"
                onClick={() => toggleSection('identity')}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Client Identity
                </h3>
                {expandedSections.has('identity') ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
              </div>
              {expandedSections.has('identity') && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Client Type</label>
                      <div className="flex items-center mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClientTypeColor(client.client_type)}`}>
                          {client.client_type}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="flex items-center mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.kyc_status)}`}>
                          {client.kyc_status}
                        </span>
                      </div>
                    </div>
                    {client.client_type === 'individual' && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                          <p className="text-sm text-gray-900">{client.date_of_birth}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Gender</label>
                          <p className="text-sm text-gray-900">{client.gender}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Marital Status</label>
                          <p className="text-sm text-gray-900">{client.marital_status}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Employment Status</label>
                          <p className="text-sm text-gray-900">{client.employment_status}</p>
                        </div>
                      </>
                    )}
                    {client.client_type === 'corporate' && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Registration Number</label>
                          <p className="text-sm text-gray-900">{client.company_registration_number}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Industry</label>
                          <p className="text-sm text-gray-900">{client.industry_sector}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Employees</label>
                          <p className="text-sm text-gray-900">{client.number_of_employees}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Annual Turnover</label>
                          <p className="text-sm text-gray-900">TZS {client.annual_turnover?.toLocaleString()}</p>
                        </div>
                      </>
                    )}
                    {client.client_type === 'group' && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Group Type</label>
                          <p className="text-sm text-gray-900">{client.legal_structure}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Members</label>
                          <p className="text-sm text-gray-900">{client.number_of_employees}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Formation Date</label>
                          <p className="text-sm text-gray-900">{client.date_of_incorporation}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Meeting Location</label>
                          <p className="text-sm text-gray-900">{client.registered_address}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {client.phone_number}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {client.email_address}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {client.area_of_residence}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div 
                className="p-4 border-b border-gray-200 cursor-pointer flex items-center justify-between"
                onClick={() => toggleSection('financial')}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Financial Performance
                </h3>
                {expandedSections.has('financial') ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
              </div>
              {expandedSections.has('financial') && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Income & Assets</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Monthly Income</span>
                          <span className="text-sm font-medium">TZS {client.net_monthly_salary?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Monthly Expenses</span>
                          <span className="text-sm font-medium">TZS {client.monthly_expenses?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Existing Debts</span>
                          <span className="text-sm font-medium">TZS {client.existing_debts?.toLocaleString() || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Banking Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Bank</span>
                          <span className="text-sm font-medium">{client.bank_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Account Number</span>
                          <span className="text-sm font-medium">{client.bank_account_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Mobile Money</span>
                          <span className="text-sm font-medium">{client.mobile_money_provider || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Products */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div 
                className="p-4 border-b border-gray-200 cursor-pointer flex items-center justify-between"
                onClick={() => toggleSection('products')}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Active Products
                </h3>
                {expandedSections.has('products') ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
              </div>
              {expandedSections.has('products') && (
                <div className="p-4">
                  {loans.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No active loans</p>
                  ) : (
                    <div className="space-y-3">
                      {loans.map((loan: any) => (
                        <div key={loan.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{loan.loan_number}</h4>
                              <p className="text-sm text-gray-600">{loan.loan_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">TZS {loan.outstanding_amount?.toLocaleString()}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                                {loan.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  New Loan Application
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Process Payment
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Update Information
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                        {activity.amount && (
                          <p className="text-xs text-gray-600">
                            TZS {activity.amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overall Risk</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskLevel.color}`}>
                    {riskLevel.level}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">KYC Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.kyc_status)}`}>
                    {client.kyc_status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment History</span>
                  <span className="text-sm font-medium text-green-600">Good</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Credit Score</span>
                  <span className="text-sm font-medium text-gray-900">750</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Client360Dashboard;





















