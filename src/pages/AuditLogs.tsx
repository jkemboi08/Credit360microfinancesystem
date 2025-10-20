import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import {
  Search,
  Filter,
  Download,
  Shield,
  User,
  Eye,
  Edit,
  CreditCard,
  FileText,
  Calendar,
  Clock
} from 'lucide-react';

const AuditLogs: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Fetch real data from Supabase
  const { data: auditLogsData, loading: auditLogsLoading } = useSupabaseQuery('audit_logs', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: users, loading: usersLoading } = useSupabaseQuery('users', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Convert Supabase data to audit log format
  const auditLogs = auditLogsData?.map(log => ({
    id: log.id,
    user: users?.find(u => u.id === log.user_id)?.first_name + ' ' + users?.find(u => u.id === log.user_id)?.last_name || 'Unknown User',
    action: log.action || 'Unknown Action',
    details: log.details || '',
    timestamp: log.created_at || new Date().toISOString(),
    ipAddress: log.ip_address || 'Unknown',
    userAgent: log.user_agent || 'Unknown',
    category: log.category || 'general',
    clientId: log.client_id || null,
    dataPoints: log.data_points || [],
    encrypted: log.encrypted || false
  })) || [];

  const mockAuditLogs = [
    {
      id: 1,
      user: 'John Mwangi',
      action: 'CRB Report Access',
      details: 'Accessed CRB report for Mary Kinyangi (Client ID: C001)',
      timestamp: '2025-01-10 14:30:15',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      category: 'crb_access',
      clientId: 'C001',
      dataPoints: ['credit_score', 'payment_history', 'outstanding_loans'],
      encrypted: true
    },
    {
      id: 2,
      user: 'Sarah Mollel',
      action: 'Loan Approval',
      details: 'Approved loan application LN001 for TZS 2,500,000',
      timestamp: '2025-01-10 13:45:22',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      category: 'loan_decision',
      loanId: 'LN001',
      dataPoints: ['credit_assessment', 'income_verification', 'collateral_evaluation'],
      encrypted: true
    },
    {
      id: 3,
      user: 'Grace Mwalimu',
      action: 'NIDA ID Verification',
      details: 'Verified NIDA ID for Peter Mollel via Jamii X-Change API',
      timestamp: '2025-01-10 12:20:33',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      category: 'kyc_verification',
      clientId: 'C004',
      dataPoints: ['nida_id', 'biometric_data', 'photo_capture'],
      encrypted: true
    },
    {
      id: 4,
      user: 'David Msangi',
      action: 'Loan Restructuring',
      details: 'Restructured loan LN002 - Extended repayment period by 6 months',
      timestamp: '2025-01-10 11:15:44',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      category: 'loan_modification',
      loanId: 'LN002',
      dataPoints: ['original_terms', 'new_terms', 'apr_recalculation'],
      encrypted: true
    },
    {
      id: 5,
      user: 'System Auto',
      action: 'PAR 30 Calculation',
      details: 'Automated PAR 30 calculation completed - Result: 2.4%',
      timestamp: '2025-01-10 10:00:00',
      ipAddress: 'System',
      userAgent: 'Automated Process',
      category: 'system_calculation',
      dataPoints: ['outstanding_loans', 'overdue_amounts', 'provision_calculations'],
      encrypted: true
    },
    {
      id: 6,
      user: 'John Mwangi',
      action: 'Client Data Export',
      details: 'Exported client data for Mary Kinyangi (Data Subject Request)',
      timestamp: '2025-01-10 09:30:18',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      category: 'data_export',
      clientId: 'C001',
      dataPoints: ['personal_info', 'loan_history', 'payment_records'],
      encrypted: true
    }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || log.category === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getActionIcon = (category: string) => {
    switch (category) {
      case 'crb_access':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'loan_decision':
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case 'kyc_verification':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'loan_modification':
        return <Edit className="w-4 h-4 text-orange-600" />;
      case 'system_calculation':
        return <FileText className="w-4 h-4 text-gray-600" />;
      case 'data_export':
        return <Download className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'crb_access':
        return 'bg-blue-100 text-blue-800';
      case 'loan_decision':
        return 'bg-green-100 text-green-800';
      case 'kyc_verification':
        return 'bg-purple-100 text-purple-800';
      case 'loan_modification':
        return 'bg-orange-100 text-orange-800';
      case 'system_calculation':
        return 'bg-gray-100 text-gray-800';
      case 'data_export':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportLogs = () => {
    // Mock export functionality
    const exportData = filteredLogs.map(log => ({
      timestamp: log.timestamp,
      user: log.user,
      action: log.action,
      details: log.details,
      category: log.category,
      ip_address: log.ipAddress,
      encrypted: log.encrypted
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{t('audit_logs')}</h1>
          <p className="text-gray-300">
            Track system actions for compliance and transparency with encrypted logs
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, action, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Actions</option>
                  <option value="crb_access">CRB Access</option>
                  <option value="loan_decision">Loan Decisions</option>
                  <option value="kyc_verification">KYC Verification</option>
                  <option value="loan_modification">Loan Modifications</option>
                  <option value="system_calculation">System Calculations</option>
                  <option value="data_export">Data Exports</option>
                </select>
              </div>
              
              <button
                onClick={exportLogs}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="mt-4 flex items-center space-x-4">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Logs Today</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CRB Accesses</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Loan Decisions</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Exports</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Download className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disbursements</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Disbursement Audit Log Block */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl shadow-lg border border-orange-200">
          <div className="bg-gradient-to-r from-orange-600 to-yellow-600 px-6 py-4 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="w-6 h-6 mr-3" />
                <h3 className="text-xl font-semibold">
                  {t('disbursement_audit_logs') || 'Disbursement Audit Logs'}
                </h3>
              </div>
              <div className="text-orange-100 text-sm">
                Automated tracking of all disbursement activities
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Automated Processes</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    General Ledger Update (IFRS 9)
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Risk Metrics Update
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Loan Management Transfer
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    CRB Integration
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Repayment Reminders Setup
                  </li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Compliance Tracking</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">IFRS 9 Compliance</span>
                    <span className="text-sm font-medium text-green-600">✓ Complete</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">BoT Reporting</span>
                    <span className="text-sm font-medium text-green-600">✓ Complete</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CRB Submission</span>
                    <span className="text-sm font-medium text-green-600">✓ Complete</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Audit Trail</span>
                    <span className="text-sm font-medium text-green-600">✓ Complete</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Recent Disbursements</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">LA-1760439557884</div>
                    <div className="text-gray-500">Cole-Griffith • TZS 2,500,000</div>
                    <div className="text-xs text-green-600">✓ All processes completed</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">LA-1760356981765</div>
                    <div className="text-gray-500">James Chacha • TZS 1,800,000</div>
                    <div className="text-xs text-green-600">✓ All processes completed</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">LA-1760123456789</div>
                    <div className="text-gray-500">Mary Kinyangi • TZS 3,200,000</div>
                    <div className="text-xs text-green-600">✓ All processes completed</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Disbursement Audit Trail</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Timestamp</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Application ID</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Client</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Processes</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 text-gray-600">2025-01-27 15:30:22</td>
                      <td className="px-4 py-2 font-mono text-blue-600">LA-1760439557884</td>
                      <td className="px-4 py-2">Cole-Griffith</td>
                      <td className="px-4 py-2 font-medium">TZS 2,500,000</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">GL Update</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Risk Metrics</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">CRB Push</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Complete</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-600">2025-01-27 14:15:18</td>
                      <td className="px-4 py-2 font-mono text-blue-600">LA-1760356981765</td>
                      <td className="px-4 py-2">James Chacha</td>
                      <td className="px-4 py-2 font-medium">TZS 1,800,000</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">GL Update</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Risk Metrics</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">CRB Push</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Complete</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Audit Trail
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Encrypted logs with AES-256 encryption per Data Protection Act 2022
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Security
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.user}</div>
                          <div className="text-sm text-gray-500">{log.ipAddress}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getActionIcon(log.category)}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{log.details}</div>
                      {log.dataPoints && log.dataPoints.length > 0 && (
                        <div className="mt-1">
                          <div className="text-xs text-gray-500">Data points accessed:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {log.dataPoints.map((point, index) => (
                              <span key={index} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(log.category)}`}>
                        {log.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {log.encrypted && (
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 text-green-600 mr-1" />
                            <span className="text-xs text-green-600">AES-256</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Compliance Information</h3>
              <div className="mt-2 text-sm text-blue-800">
                <p className="mb-2">
                  All audit logs are encrypted with AES-256 encryption and stored securely in compliance with:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Data Protection Act 2022 - Secure storage and access logging</li>
                  <li>Credit Reference Bureau Regulations 2012 - CRB access tracking</li>
                  <li>Microfinance Act 2018 - Loan decision audit trails</li>
                  <li>BoT Financial Stability Reporting - System calculation logs</li>
                </ul>
                <p className="mt-2">
                  Logs are retained for 7 years and available for regulatory audit upon request.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuditLogs;