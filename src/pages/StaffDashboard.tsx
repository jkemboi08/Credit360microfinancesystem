import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { AttendanceService } from '../services/attendanceServiceNew';
import { LoanStatusMappingService } from '../services/loanStatusMappingService';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  Activity,
  Shield,
  BarChart3,
  Target,
  Zap,
  Clock,
  CreditCard,
  PiggyBank,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const StaffDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [stressTestResult, setStressTestResult] = useState<number | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch real data from Supabase (with error handling)
  const { data: staffMembers, loading: staffLoading, error: staffError } = useSupabaseQuery('users', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: attendanceRecords, loading: attendanceRecordsLoading, error: attendanceError } = useSupabaseQuery('attendance_records', {
    select: '*',
    orderBy: { column: 'date', ascending: false }
  });

  const { data: loanApplications, loading: applicationsLoading, error: applicationsError } = useSupabaseQuery('loan_applications', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: clients, loading: clientsLoading, error: clientsError } = useSupabaseQuery('clients', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Calculate real metrics from database (with error handling)
  const totalClients = clientsError ? 0 : (clients?.length || 0);
  const activeStatuses = LoanStatusMappingService.getActiveLoanStatuses();
  const activeLoans = applicationsError ? 0 : (loanApplications?.filter(app => 
    activeStatuses.loanApplication.includes(app.status)
  ).length || 0);
  
  // Enable savings data from database
  const { data: savingsAccounts, loading: savingsLoading, error: savingsError } = useSupabaseQuery('savings_accounts', {
    select: 'balance, created_at'
  });

  // Get savings transactions for today's collection
  const { data: allSavingsTransactions, loading: todaysSavingsLoading, error: savingsTxError } = useSupabaseQuery('savings_transactions', {
    select: 'amount, transaction_type, created_at'
  });

  // Calculate total savings from database
  const totalSavings = savingsError ? 0 : (savingsAccounts?.reduce((sum, account) => sum + (account.balance || 0), 0) || 0);

  // Calculate today's disbursed loans (with error handling)
  const today = new Date().toISOString().split('T')[0];
  const todaysDisbursedLoans = applicationsError ? 0 : (loanApplications?.filter(app => 
    app.status === 'disbursed' && 
    app.disbursed_at && 
    app.disbursed_at.startsWith(today)
  ).length || 0);

  // Calculate additional metrics (with error handling)
  const pendingApplications = applicationsError ? 0 : (loanApplications?.filter(app => 
    app.status === 'pending' || app.status === 'under_review'
  ).length || 0);

  const overdueLoans = applicationsError ? 0 : (loanApplications?.filter(app => 
    app.status === 'disbursed' && 
    app.due_date && 
    new Date(app.due_date) < new Date()
  ).length || 0);

  // Calculate PAR 30 (Portfolio at Risk 30+ days) (with error handling)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const par30Loans = applicationsError ? 0 : (loanApplications?.filter(app => 
    app.status === 'disbursed' && 
    app.due_date && 
    new Date(app.due_date) < thirtyDaysAgo
  ).length || 0);
  const par30Percentage = activeLoans > 0 ? ((par30Loans / activeLoans) * 100).toFixed(1) : '0.0';

  // Calculate today's savings collected
  const todaysSavingsCollected = savingsTxError ? 0 : (allSavingsTransactions?.filter(tx => 
    tx.created_at && tx.created_at.startsWith(today) && tx.transaction_type === 'deposit'
  ).reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0);

  // Calculate DPD (Days Past Due) categories
  const now = new Date();
  const dpd1_30 = applicationsError ? 0 : (loanApplications?.filter(app => {
    if (app.status !== 'disbursed' || !app.due_date) return false;
    const dueDate = new Date(app.due_date);
    const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysPastDue >= 1 && daysPastDue <= 30;
  }).length || 0);

  const dpd31_60 = applicationsError ? 0 : (loanApplications?.filter(app => {
    if (app.status !== 'disbursed' || !app.due_date) return false;
    const dueDate = new Date(app.due_date);
    const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysPastDue >= 31 && daysPastDue <= 60;
  }).length || 0);

  const dpd61_90 = applicationsError ? 0 : (loanApplications?.filter(app => {
    if (app.status !== 'disbursed' || !app.due_date) return false;
    const dueDate = new Date(app.due_date);
    const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysPastDue >= 61 && daysPastDue <= 90;
  }).length || 0);

  const dpd90Plus = applicationsError ? 0 : (loanApplications?.filter(app => {
    if (app.status !== 'disbursed' || !app.due_date) return false;
    const dueDate = new Date(app.due_date);
    const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysPastDue > 90;
  }).length || 0);

  // Calculate liquidity ratio (simplified calculation)
  const totalAssets = 10000000; // This should come from accounting data
  const liquidAssets = 1520000; // This should come from accounting data
  const liquidityRatio = totalAssets > 0 ? ((liquidAssets / totalAssets) * 100).toFixed(1) : '0.0';

  // Calculate real NPL (Non-Performing Loans) from database
  const nonPerformingLoans = applicationsError ? 0 : (loanApplications?.filter(app => {
    if (app.status !== 'disbursed' || !app.due_date) return false;
    const dueDate = new Date(app.due_date);
    const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysPastDue > 90; // Loans over 90 days past due are considered non-performing
  }).length || 0);

  const totalDisbursedLoans = applicationsError ? 0 : (loanApplications?.filter(app => 
    app.status === 'disbursed'
  ).length || 0);

  const currentNPL = totalDisbursedLoans > 0 ? ((nonPerformingLoans / totalDisbursedLoans) * 100) : 0;

  // Get recent activities from loan applications and transactions
  const recentActivities = applicationsError ? [] : (loanApplications?.slice(0, 4).map((app, index) => {
    const timeAgo = Math.floor((now.getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60));
    return {
      id: app.id,
      action: app.status === 'approved' ? 'Loan Approved' : 
              app.status === 'disbursed' ? 'Loan Disbursed' : 
              app.status === 'pending' ? 'Application Submitted' : 'Application Updated',
      client: `${app.client_first_name || ''} ${app.client_last_name || ''}`.trim() || 'Unknown Client',
      amount: `TZS ${(app.requested_amount || 0).toLocaleString()}`,
      time: timeAgo < 1 ? 'Just now' : 
            timeAgo < 24 ? `${timeAgo} hour${timeAgo > 1 ? 's' : ''} ago` :
            `${Math.floor(timeAgo / 24)} day${Math.floor(timeAgo / 24) > 1 ? 's' : ''} ago`
    };
  }) || []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load today's attendance on component mount
  useEffect(() => {
    if (user?.id) {
      loadTodayAttendance();
    }
  }, [user?.id]);

  // Add real-time refresh every 30 seconds to sync with other components
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) {
        loadTodayAttendance();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  const loadTodayAttendance = async () => {
    if (!user?.id) return;
    
    const result = await AttendanceService.getTodayAttendance();
    if (result.success) {
      setTodayAttendance(result.data || null);
    }
  };

  const handleClockIn = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    console.log('Clock in attempt for user:', { 
      userId: user.id, 
      userEmail: user.email, 
      userName: user.name 
    });

    setAttendanceLoading(true);
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];

    const result = await AttendanceService.clockIn({
      employee_id: user.id,
      time: timeString,
      notes: ''
    });

    if (result.success) {
      toast.success(result.message || 'Successfully clocked in!');
      // Reload attendance data to sync with other components
      await loadTodayAttendance();
    } else {
      toast.error(result.error || 'Failed to clock in');
    }
    setAttendanceLoading(false);
  };

  const handleClockOut = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setAttendanceLoading(true);
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];

    const result = await AttendanceService.clockOut({
      employee_id: user.id,
      time: timeString,
      notes: ''
    });

    if (result.success) {
      toast.success(result.message || 'Successfully clocked out!');
      // Reload attendance data to sync with other components
      await loadTodayAttendance();
    } else {
      toast.error(result.error || 'Failed to clock out');
    }
    setAttendanceLoading(false);
  };

  const handleStressTest = () => {
    // Run stress test with 20% NPL shock using real data
    const stressedNPL = currentNPL + 20;
    setStressTestResult(stressedNPL);
  };


  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {t('welcome')}, {user?.name}!
          </h1>
          <p className="text-blue-100">
            Today's portfolio overview and regulatory compliance status
          </p>
        </div>

        {/* Clock In/Out Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Time & Attendance
            </h2>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-blue-600">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-500">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Status */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Current Status</h3>
              {todayAttendance ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      todayAttendance.status === 'present' ? 'bg-green-100 text-green-800' :
                      todayAttendance.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {todayAttendance.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Clock In:</span>
                    <span className="text-sm font-medium">
                      {todayAttendance.check_in ? 
                        new Date(`2000-01-01T${todayAttendance.check_in}`).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : '-'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Clock Out:</span>
                    <span className="text-sm font-medium">
                      {todayAttendance.check_out ? 
                        new Date(`2000-01-01T${todayAttendance.check_out}`).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : '-'
                      }
                    </span>
                  </div>
                  {todayAttendance.hours_worked > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hours Worked:</span>
                      <span className="text-sm font-medium">{todayAttendance.hours_worked}h</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No attendance record for today</p>
              )}
            </div>

            {/* Clock Actions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <button
                  onClick={loadTodayAttendance}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh attendance data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleClockIn}
                  disabled={todayAttendance?.check_in || attendanceLoading}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium flex items-center justify-center ${
                    !todayAttendance?.check_in && !attendanceLoading
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Clock In
                </button>
                <button
                  onClick={handleClockOut}
                  disabled={!todayAttendance?.check_in || todayAttendance?.check_out || attendanceLoading}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium flex items-center justify-center ${
                    todayAttendance?.check_in && !todayAttendance?.check_out && !attendanceLoading
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Clock Out
                </button>
              </div>
              
              {attendanceLoading && (
                <div className="flex items-center justify-center text-blue-600">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Clients"
            value={clientsLoading ? "Loading..." : totalClients.toLocaleString()}
            icon={Users}
            change="From database"
            changeType="neutral"
            status="success"
          />
          <MetricCard
            title="Active Loans"
            value={applicationsLoading ? "Loading..." : activeLoans.toLocaleString()}
            icon={CreditCard}
            change="Approved & disbursed"
            changeType="neutral"
            status="success"
          />
          <MetricCard
            title="Total Savings"
            value={savingsLoading ? "Loading..." : `TZS ${(totalSavings / 1000000).toFixed(1)}M`}
            icon={PiggyBank}
            change="From database"
            changeType="neutral"
            status="success"
          />
          <MetricCard
            title="Loans Disbursed Today"
            value={applicationsLoading ? "Loading..." : todaysDisbursedLoans.toString()}
            icon={Calendar}
            change="Today's disbursements"
            changeType="neutral"
            status="success"
          />
        </div>

        {/* Additional Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Savings Collected Today"
            value={todaysSavingsLoading ? "Loading..." : `TZS ${(todaysSavingsCollected / 1000000).toFixed(1)}M`}
            icon={DollarSign}
            change="Today's deposits"
            changeType="neutral"
            status="success"
          />
          <MetricCard
            title="Pending Applications"
            value={applicationsLoading ? "Loading..." : pendingApplications.toString()}
            icon={FileText}
            change="Awaiting review"
            changeType="warning"
            status="warning"
          />
          <MetricCard
            title="Overdue Loans"
            value={applicationsLoading ? "Loading..." : overdueLoans.toString()}
            icon={AlertTriangle}
            change="Past due date"
            changeType="negative"
            status="error"
          />
          <MetricCard
            title={`${t('par_30')} (BoT Limit: <5%)`}
            value={applicationsLoading ? "Loading..." : `${par30Percentage}%`}
            icon={Shield}
            change={parseFloat(par30Percentage) < 5 ? "Within compliance" : "Above limit"}
            changeType={parseFloat(par30Percentage) < 5 ? "positive" : "negative"}
            status={parseFloat(par30Percentage) < 5 ? "success" : "error"}
          />
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-600" />
            Pending Tasks
          </h3>
          <p className="text-sm text-gray-600 mb-4">Items requiring attention</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Loan Applications</h4>
                <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {applicationsLoading ? "..." : `${pendingApplications} pending`}
                </span>
              </div>
              <p className="text-sm text-gray-600">Awaiting initial review</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Overdue Payments</h4>
                <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full">
                  {applicationsLoading ? "..." : `${overdueLoans} overdue`}
                </span>
              </div>
              <p className="text-sm text-gray-600">Follow-up required</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">KYC Verification</h4>
                <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {clientsLoading ? "..." : `${clients?.filter(c => c.kyc_status === 'pending').length || 0} pending`}
                </span>
              </div>
              <p className="text-sm text-gray-600">Document verification needed</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Committee Review</h4>
                <span className="bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full">
                  {applicationsLoading ? "..." : `${loanApplications?.filter(app => app.status === 'under_review' && (app.requested_amount || 0) > 1000000).length || 0} pending`}
                </span>
              </div>
              <p className="text-sm text-gray-600">High-value loans awaiting approval</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Disbursements</h4>
                <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
                  {applicationsLoading ? "..." : `${loanApplications?.filter(app => app.status === 'approved' && !app.disbursed_at).length || 0} ready`}
                </span>
              </div>
              <p className="text-sm text-gray-600">Approved loans ready for disbursement</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">CRB Updates</h4>
                <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full">
                  {applicationsLoading ? "..." : `${par30Loans} pending`}
                </span>
              </div>
              <p className="text-sm text-gray-600">Credit bureau submissions due</p>
            </div>
          </div>
        </div>

        {/* Liquidity & Compliance Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              {t('liquidity_ratio')} Monitor
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Current Ratio</p>
                  <p className="text-2xl font-bold text-green-700">{liquidityRatio}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">BoT Minimum</p>
                  <p className="text-lg font-semibold text-gray-900">1.0%</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleString()} | Auto-updated daily
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-orange-600" />
              {t('stress_test')} Simulation
            </h3>
            <div className="space-y-4">
              {/* Current NPL Information */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Current NPL</span>
                  <span className="text-lg font-bold text-blue-700">{currentNPL.toFixed(2)}%</span>
                </div>
                <div className="text-xs text-gray-600">
                  Based on {nonPerformingLoans} non-performing loans out of {totalDisbursedLoans} total disbursed loans
                </div>
              </div>

              <button
                onClick={handleStressTest}
                className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105"
              >
                <Zap className="w-4 h-4 mr-2" />
                Run 20% NPL Shock Test
              </button>
              
              {stressTestResult && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Stress Test Result</span>
                    <span className="text-lg font-bold text-red-700">{stressTestResult.toFixed(2)}% NPL</span>
                  </div>
                  <div className="text-xs text-red-600 mb-2">
                    Impact: +20% NPL shock applied to current portfolio
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                    stressTestResult > 10 
                      ? 'bg-red-200 text-red-800' 
                      : stressTestResult > 5 
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-green-200 text-green-800'
                  }`}>
                    Risk Level: {stressTestResult > 10 ? 'High Risk' : stressTestResult > 5 ? 'Moderate Risk' : 'Low Risk'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DPD Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-red-600" />
            Days Past Due (DPD) Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-700">
                {applicationsLoading ? "..." : dpd1_30}
              </p>
              <p className="text-sm text-gray-600">DPD 1-30</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-700">
                {applicationsLoading ? "..." : dpd31_60}
              </p>
              <p className="text-sm text-gray-600">DPD 31-60</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">
                {applicationsLoading ? "..." : dpd61_90}
              </p>
              <p className="text-sm text-gray-600">DPD 61-90</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-700">
                {applicationsLoading ? "..." : dpd90Plus}
              </p>
              <p className="text-sm text-gray-600">DPD 90+</p>
            </div>
          </div>
        </div>


        {/* Recent Activities */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
            Recent Activities
          </h3>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activities</h3>
                <p className="text-gray-600">No recent loan activities to display.</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.client}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{activity.amount}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StaffDashboard;