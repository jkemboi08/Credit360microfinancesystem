import React, { useState, useEffect } from 'react';
import { useSupabaseQuery, useSupabaseSubscription } from '../hooks/useSupabase';
import { LoanStatusMappingService } from '../services/loanStatusMappingService';
import { LoanSyncService } from '../utils/loanSyncService';
import { 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  BarChart3, 
  PieChart, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Loader2,
  Activity,
  Shield,
  Target
} from 'lucide-react';
import { DateUtils } from '../utils/dateUtils';
import LoanMonitoringService, { LoanMonitoringData, PortfolioMetrics, RiskAlert } from '../services/loanMonitoringService';
import { roundAmount, roundCurrency, roundPercentage } from '../utils/roundingUtils';

interface LoanMonitoringProps {
  selectedTimeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const LoanMonitoringComponent: React.FC<LoanMonitoringProps> = ({ 
  selectedTimeRange, 
  onTimeRangeChange 
}) => {
  const [selectedLoan, setSelectedLoan] = useState<LoanMonitoringData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedOverdueLoan, setSelectedOverdueLoan] = useState<LoanMonitoringData | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Create service instance
  const loanMonitoringService = new LoanMonitoringService();
  
  // Real-time loan data from database
  const [loans, setLoans] = useState<LoanMonitoringData[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [productSummary, setProductSummary] = useState<any[]>([]);
  const [clientTypeSummary, setClientTypeSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Note: We're using the service to fetch data instead of direct queries
  // This ensures we only get disbursed/active loans
  const [loanApplications, setLoanApplications] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loanRepayments, setLoanRepayments] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [repaymentsLoading, setRepaymentsLoading] = useState(false);

  // Real-time subscription for loan applications
  useSupabaseSubscription('loan_applications', (payload) => {
    console.log('Real-time loan application update:', payload);
    const activeStatuses = LoanStatusMappingService.getActiveLoanStatuses();
    if (payload.eventType === 'UPDATE' && activeStatuses.loanApplication.includes(payload.new?.status)) {
      console.log('Loan status changed to active, refreshing data...');
      handleRefreshPortfolio();
    }
  });

  // Real-time subscription for loan repayments
  useSupabaseSubscription('loan_repayments', (payload) => {
    console.log('Real-time repayment update:', payload);
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      console.log('Repayment data changed, refreshing portfolio...');
      handleRefreshPortfolio();
    }
  });
  

  // Note: Data conversion is now handled by the service

  // Note: Data loading is now handled by loadLoanData() which uses the service
  // This ensures we only get disbursed/active loans

  // Load real-time data on component mount
  useEffect(() => {
    console.log('Loan Monitoring Component mounted, loading data...');
    loadLoanData();
    
    // Start real-time monitoring
    loanMonitoringService.startRealTimeMonitoring((data) => {
      console.log('Real-time monitoring callback received data:', data.length);
      setLoans(data);
    });
    
    // Set up periodic refresh every 30 seconds to ensure data stays current
    const refreshInterval = setInterval(() => {
      console.log('Periodic refresh triggered...');
      handleRefreshPortfolio();
    }, 30000); // 30 seconds
    
    // Cleanup on unmount
    return () => {
      loanMonitoringService.stopRealTimeMonitoring();
      clearInterval(refreshInterval);
    };
  }, [selectedTimeRange]);

  // Handle time range change with visual feedback
  const handleTimeRangeChange = (range: string) => {
    setIsFiltering(true);
    onTimeRangeChange(range);
    console.log('Time range changed to:', range);
    
    // Add visual feedback
    const rangeNames = {
      '7': 'Last 7 days',
      '30': 'Last 30 days',
      '90': 'Last 90 days',
      '365': 'Last year'
    };
    console.log(`Filtering loans for: ${rangeNames[range as keyof typeof rangeNames]}`);
    
    // Simulate filtering delay for visual feedback
    setTimeout(() => {
      setIsFiltering(false);
    }, 500);
  };

  // Load loan data from database
  const loadLoanData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading loan data from service...');
      
      // First, ensure data is synced
      console.log('🔄 Syncing disbursed loans to monitoring table...');
      const syncResult = await LoanSyncService.syncAllDisbursedLoans();
      if (syncResult.success) {
        console.log(`✅ Sync completed: ${syncResult.synced} loans synced`);
      } else {
        console.warn('⚠️ Sync had issues:', syncResult.errors);
      }
      
      const [loansData, metricsData, alertsData] = await Promise.all([
        loanMonitoringService.fetchActiveLoans(),
        loanMonitoringService.calculatePortfolioMetrics(),
        loanMonitoringService.generateRiskAlerts()
      ]);
      
      console.log('Service returned data:', {
        loans: loansData.length,
        metrics: metricsData,
        alerts: alertsData.length
      });
      
      setLoans(loansData);
      setPortfolioMetrics(metricsData);
      setRiskAlerts(alertsData);
      
      // Calculate summary statistics
      const productSummaryData = loanMonitoringService.calculateSummaryByProduct(loansData);
      const clientTypeSummaryData = loanMonitoringService.calculateSummaryByClientType(loansData);
      setProductSummary(productSummaryData);
      setClientTypeSummary(clientTypeSummaryData);
      
      // Also update the raw data for the conversion function
      setLoanApplications(loansData.map(loan => ({
        id: loan.id,
        client_id: loan.clientId,
        requested_amount: loan.amount,
        status: loan.status,
        created_at: loan.disbursementDate,
        interest_rate: loan.interestRate,
        // Add other fields as needed
      })));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loan data');
      console.error('Error loading loan data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh portfolio data
  const handleRefreshPortfolio = async () => {
    console.log('Refreshing portfolio data...');
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Force refresh all data
      const [loansData, metricsData, alertsData] = await Promise.all([
        loanMonitoringService.fetchActiveLoans(),
        loanMonitoringService.calculatePortfolioMetrics(),
        loanMonitoringService.generateRiskAlerts()
      ]);
      
      console.log('Refresh - Loaded data:', {
        loans: loansData.length,
        metrics: metricsData,
        alerts: alertsData.length
      });
      
      setLoans(loansData);
      setPortfolioMetrics(metricsData);
      setRiskAlerts(alertsData);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle loan selection
  const handleLoanSelect = (loan: LoanMonitoringData) => {
    setSelectedLoan(loan);
  };

  // Handle overdue loan alert
  const handleOverdueAlert = (loan: LoanMonitoringData) => {
    setSelectedOverdueLoan(loan);
    setShowAlertModal(true);
  };

  // Send alert
  const sendAlert = () => {
    if (selectedOverdueLoan) {
      // Implement alert sending logic
      console.log('Sending alert for loan:', selectedOverdueLoan.id);
      setShowAlertModal(false);
      setSelectedOverdueLoan(null);
    }
  };

  // Get risk color based on classification
  const getRiskColor = (classification: string) => {
    switch (classification) {
      case 'Current': return 'text-green-600 bg-green-50';
      case 'Especially Mentioned': return 'text-yellow-600 bg-yellow-50';
      case 'Substandard': return 'text-orange-600 bg-orange-50';
      case 'Doubtful': return 'text-red-600 bg-red-50';
      case 'Loss': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get DPD color
  const getDPDColor = (dpd: number) => {
    if (dpd === 0) return 'text-green-600';
    if (dpd <= 30) return 'text-yellow-600';
    if (dpd <= 90) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading loan data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={loadLoanData}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle empty loans data
  if (!loading && loans.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <div className="flex flex-col items-center">
          <BarChart3 className="w-16 h-16 text-blue-400 mb-4" />
          <h3 className="text-xl font-semibold text-blue-900 mb-2">No Active Loans Found</h3>
          <p className="text-blue-700 mb-6">
            There are currently no active loans in the system. Once loan applications are approved and disbursed, 
            they will appear here for monitoring.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={loadLoanData}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => window.location.href = '/staff/loan-applications'}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              View Loan Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ensure all data is available before rendering main content
  if (!portfolioMetrics || !productSummary || !clientTypeSummary) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Processing loan data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 overflow-visible">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-8 text-white overflow-visible">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Loan Monitoring & Portfolio Performance</h1>
            <p className="text-blue-100 mt-1">Real-time portfolio health monitoring and risk management</p>
            {isFiltering && (
              <div className="flex items-center space-x-2 text-blue-200 mt-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Filtering data...</span>
              </div>
            )}
          </div>
        <div className="flex space-x-3 relative">
          <div className="relative">
            <select
              value={selectedTimeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              disabled={isFiltering}
              className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 appearance-none pr-8 relative z-20 min-w-[140px] transition-all duration-200 ${
                isFiltering ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'
              }`}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none z-30">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <button
            onClick={handleRefreshPortfolio}
            disabled={isRefreshing}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isRefreshing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isRefreshing ? 'Refreshing...' : 'Refresh Portfolio'}
          </button>
        </div>
        </div>
      </div>

      {/* Summary Statistics by Product and Client Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Summary by Loan Product */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-blue-600" />
            Summary by Loan Product
          </h3>
          <div className="space-y-3">
            {(productSummary || []).map((item, index) => (
              <div key={item?.product || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{item?.product || 'N/A'}</span>
                    <span className="text-sm text-gray-500">{item?.count || 0} loans</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">TZS {roundCurrency(item?.totalAmount || 0).toLocaleString()}</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${item?.performance || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{(item?.performance || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary by Client Type */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-green-600" />
            Summary by Client Type
          </h3>
          <div className="space-y-3">
            {(clientTypeSummary || []).map((item, index) => (
              <div key={item?.clientType || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{item?.clientType || 'N/A'}</span>
                    <span className="text-sm text-gray-500">{item?.count || 0} loans</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">TZS {roundCurrency(item?.totalAmount || 0).toLocaleString()}</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${item?.performance || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{(item?.performance || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Summary & Health Block */}
      {portfolioMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Portfolio</p>
                <p className="text-2xl font-bold text-gray-900">
                  TZS {roundCurrency(portfolioMetrics.totalPortfolioValue).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+12.5%</span>
              <span className="text-gray-500 ml-2">vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold text-gray-900">{portfolioMetrics.activeLoans}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">Healthy</span>
              <span className="text-gray-500 ml-2">Portfolio status</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PAR 30</p>
                <p className="text-2xl font-bold text-gray-900">{roundPercentage(portfolioMetrics.par30)}%</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-yellow-600 font-medium">Monitor</span>
              <span className="text-gray-500 ml-2">Risk level</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">NPL Ratio</p>
                <p className="text-2xl font-bold text-gray-900">{roundPercentage(portfolioMetrics.nplRatio)}%</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Shield className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600 font-medium">Action Required</span>
              <span className="text-gray-500 ml-2">BOT compliance</span>
            </div>
          </div>
        </div>
      )}

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              Risk Alerts ({riskAlerts.length})
            </h3>
            <span className="text-sm text-gray-500">Real-time monitoring</span>
          </div>
          <div className="space-y-3">
            {riskAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-400' :
                  alert.severity === 'high' ? 'bg-orange-50 border-orange-400' :
                  alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'high' ? 'bg-orange-500' :
                      alert.severity === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <span className="font-medium text-gray-900">{alert.message}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loan Portfolio Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Loan Portfolio</h3>
          <p className="text-sm text-gray-600">Real-time loan monitoring and risk assessment</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disbursement Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Term (Months)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DPD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {loan.clientName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                        <div className="text-sm text-gray-500">{loan.clientId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">TZS {roundCurrency(loan.amount).toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Balance: TZS {roundCurrency(loan.balance).toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{loan.product}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {loan.status === 'disbursed' || loan.status === 'active' 
                        ? new Date(loan.disbursementDate).toLocaleDateString()
                        : new Date(loan.disbursementDate).toLocaleDateString()
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      {loan.status === 'disbursed' ? 'Disbursed' :
                       loan.status === 'active' ? 'Active' :
                       loan.status === 'approved' ? 'Approved' :
                       loan.status === 'contract_generated' ? 'Contract Ready' :
                       loan.status === 'contract_signed' ? 'Contract Signed' :
                       'Processing'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {loan.clientType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{loan.termMonths} months</div>
                    <div className="text-sm text-gray-500">Term</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {loan.loanCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      loan.status === 'active' ? 'bg-green-100 text-green-800' :
                      loan.status === 'disbursed' ? 'bg-blue-100 text-blue-800' :
                      loan.status === 'approved' ? 'bg-yellow-100 text-yellow-800' :
                      loan.status === 'contract_generated' ? 'bg-purple-100 text-purple-800' :
                      loan.status === 'contract_signed' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {loan.status === 'active' ? 'Active' :
                       loan.status === 'disbursed' ? 'Disbursed' :
                       loan.status === 'approved' ? 'Approved' :
                       loan.status === 'contract_generated' ? 'Contract Ready' :
                       loan.status === 'contract_signed' ? 'Contract Signed' :
                       loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {loan.status === 'disbursed' || loan.status === 'active' ? (
                      <span className={`text-sm font-medium ${getDPDColor(loan.dpd)}`}>
                        {loan.dpd} days
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        N/A
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(loan.currentClassification)}`}>
                      {loan.currentClassification}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {loan.status === 'disbursed' || loan.status === 'active' ? (
                      <>
                        <div className="text-sm text-gray-900">{loan.nextPayment}</div>
                        <div className="text-sm text-gray-500">TZS {roundCurrency(loan.nextAmount).toLocaleString()}</div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {loan.status === 'approved' ? 'Awaiting disbursement' :
                         loan.status === 'contract_generated' ? 'Contract ready' :
                         loan.status === 'contract_signed' ? 'Ready for disbursement' :
                         'Processing'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleLoanSelect(loan)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {loan.status === 'disbursed' || loan.status === 'active' ? (
                        loan.dpd > 0 && (
                          <button
                            onClick={() => handleOverdueAlert(loan)}
                            className="text-red-600 hover:text-red-900"
                            title="Send Overdue Alert"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => window.location.href = '/staff/loan-processing'}
                          className="text-green-600 hover:text-green-900"
                          title="Continue Processing"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlertModal && selectedOverdueLoan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg font-medium text-gray-900">Send Overdue Alert</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Send alert for loan {selectedOverdueLoan.id} ({selectedOverdueLoan.clientName}) 
                    which is {selectedOverdueLoan.dpd} days overdue.
                  </p>
                </div>
                <div className="flex justify-center space-x-4 mt-4">
                  <button
                    onClick={() => setShowAlertModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendAlert}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Send Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanMonitoringComponent;



