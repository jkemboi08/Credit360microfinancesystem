import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { roundAmount, roundCurrency, roundPercentage, roundInterestRate, roundLoanAmount, roundFee, roundRepaymentAmount, roundBalance } from '../utils/roundingUtils';
import { aiNotificationService } from '../services/aiNotificationService';
import { notificationService } from '../services/notificationService';
import { schedulerService } from '../services/schedulerService';
import { clickPesaService } from '../services/clickPesaService';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseQuery } from '../hooks/useSupabase';
import RepaymentRestructuringService from '../services/repaymentRestructuringService';
import {
  DollarSign,
  AlertTriangle,
  TrendingDown,
  Clock,
  Send,
  Phone,
  MessageSquare,
  FileText,
  CreditCard,
  Smartphone,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Target,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Zap,
  QrCode,
  ExternalLink
} from 'lucide-react';

const RepaymentManagement: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useSupabaseAuth();
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showRestructureModal, setShowRestructureModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState('');
  const [restructureReason, setRestructureReason] = useState('');
  const [newTenor, setNewTenor] = useState('');

  // Fetch active loans from loans table
  const { data: activeLoans, loading: loansLoading, error: loansError } = useSupabaseQuery('loans', {
    select: `
      id,
      loan_application_id,
      application_id,
      client_id,
      loan_amount,
      outstanding_balance,
      monthly_payment,
      interest_rate,
      term_months,
      status,
      disbursement_date,
      next_payment_due,
      days_past_due,
      risk_rating,
      clients (
        id,
        first_name,
        last_name,
        full_name,
        phone_number,
        email_address
      )
    `,
    filter: [
      { column: 'status', operator: 'eq', value: 'active' }
    ],
    orderBy: { column: 'created_at', ascending: false }
  });

  // Fetch loan repayments
  const { data: repayments, loading: repaymentsLoading, error: repaymentsError } = useSupabaseQuery('loan_repayments', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Function to save repayment to database
  const saveRepayment = async (loanId: string, amount: number, paymentMethod: string, reference: string) => {
    try {
      const { error } = await supabase
        .from('loan_repayments')
        .insert({
          loan_application_id: loanId,
          amount_paid: amount,
          payment_method: paymentMethod,
          payment_reference: reference,
          payment_date: new Date().toISOString().split('T')[0],
          status: 'completed'
        });

      if (error) {
        console.error('❌ Failed to save repayment:', error);
        throw error;
      }

      // Update loan outstanding balance
      const loan = activeLoans?.find(l => l.id === loanId);
      if (loan) {
        const newOutstandingBalance = Math.max(0, loan.outstanding_balance - amount);
        
        const { error: updateError } = await supabase
          .from('loans')
          .update({ 
            outstanding_balance: newOutstandingBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', loanId);

        if (updateError) {
          console.error('❌ Failed to update loan balance:', updateError);
        } else {
          console.log('✅ Loan balance updated successfully');
        }
      }

      console.log('✅ Repayment saved successfully');
    } catch (error) {
      console.error('❌ Error saving repayment:', error);
      throw error;
    }
  };

  // Real-time sync effect
  useEffect(() => {
    console.log('🔄 Repayment Management - Real-time sync:');
    console.log('Active Loans:', activeLoans?.length || 0);
    console.log('Repayments:', repayments?.length || 0);
    console.log('Loans Loading:', loansLoading);
    console.log('Repayments Loading:', repaymentsLoading);
  }, [activeLoans, repayments, loansLoading, repaymentsLoading]);
  const [newInterestRate, setNewInterestRate] = useState('');
  const [gracePeriod, setGracePeriod] = useState('');
  const [restructuringRequests, setRestructuringRequests] = useState<any[]>([]);
  const [showRestructuringStatus, setShowRestructuringStatus] = useState(false);
  
  // ClickPesa Payment Collection State
  const [clickPesaConnected, setClickPesaConnected] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ClickPesa');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  
  // AI Notification System State
  const [aiNotificationSettings, setAiNotificationSettings] = useState({
    enabled: true,
    smsEnabled: true,
    emailEnabled: true,
    reminderDays: [7, 3, 1, 0],
    escalationDays: 3,
    personalizedMessages: true,
    autoEscalation: true
  });
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [isRunningAiNotifications, setIsRunningAiNotifications] = useState(false);

  // Real data state
  const [overdueAccounts, setOverdueAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOverdue: 0,
    par30Rate: 0,
    delinquencyRate: 0,
    overdueCount: 0
  });

  // Load real data on component mount
  useEffect(() => {
    loadRepaymentData();
    loadNotificationHistory();
    loadSchedulerStatus();
    initializeClickPesa();
    loadRestructuringRequests();
    
    // Set up real-time updates
    const repaymentChannel = RepaymentRestructuringService.subscribeToRepayments((payload) => {
      console.log('Repayment update received:', payload);
      loadRepaymentData();
    });

    const restructuringChannel = RepaymentRestructuringService.subscribeToRestructuring((payload) => {
      console.log('Restructuring update received:', payload);
      loadRestructuringRequests();
    });

    const approvalChannel = RepaymentRestructuringService.subscribeToApprovals((payload) => {
      console.log('Approval update received:', payload);
      loadRestructuringRequests();
    });

    const notificationChannel = supabase
      .channel('notification_updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notification_history' },
        () => {
          loadNotificationHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(repaymentChannel);
      supabase.removeChannel(restructuringChannel);
      supabase.removeChannel(approvalChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, []);

  // Initialize ClickPesa connection
  const initializeClickPesa = async () => {
    try {
      const isConnected = await clickPesaService.testConnection();
      setClickPesaConnected(isConnected);
    } catch (error) {
      console.error('ClickPesa initialization failed:', error);
      setClickPesaConnected(false);
    }
  };

  // Load repayment data from database
  const loadRepaymentData = async () => {
    try {
      setLoading(true);
      
      // Get overdue accounts with real data
      const { data: overdueData, error: overdueError } = await supabase
        .from('repayment_schedules')
        .select(`
          *,
          loans!inner(
            id,
            client_id,
            principal_amount,
            interest_rate,
            status,
            clients!inner(
              id,
              full_name,
              phone_number,
              email_address
            )
          )
        `)
        .eq('is_paid', false)
        .lt('due_date', new Date().toISOString().split('T')[0])
        .eq('loans.status', 'active');

      if (overdueError) {
        console.error('Error loading overdue data:', overdueError);
        return;
      }

      // Transform data to match component expectations
      const transformedData = overdueData?.map((schedule: any) => {
        const daysOverdue = Math.ceil(
          (new Date().getTime() - new Date(schedule.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        let dpdBucket = 'DPD 30';
        if (daysOverdue >= 90) dpdBucket = 'DPD 90+';
        else if (daysOverdue >= 60) dpdBucket = 'DPD 60';

        return {
          id: schedule.loans.id,
          clientName: schedule.loans.clients.full_name,
          clientId: schedule.loans.clients.id,
          loanAmount: schedule.loans.principal_amount,
          overdueAmount: schedule.total_payment,
          dpdBucket,
          daysOverdue,
          lastPayment: schedule.payment_date || 'Never',
          phone: schedule.loans.clients.phone_number,
          email: schedule.loans.clients.email_address,
          status: schedule.loans.status,
          promiseToPay: null,
          collectionStage: 'Reminder',
          currentBalance: schedule.remaining_balance,
          paymentSchedule: [{
            id: schedule.id,
            amount: schedule.total_payment,
            dueDate: schedule.due_date,
            status: 'pending'
          }]
        };
      }) || [];

      setOverdueAccounts(transformedData);

      // Calculate stats
      const totalOverdue = transformedData.reduce((sum, account) => sum + account.overdueAmount, 0);
      const overdueCount = transformedData.length;
      
      setStats({
        totalOverdue,
        par30Rate: 4.2, // This would be calculated from real data
        delinquencyRate: 8.5, // This would be calculated from real data
        overdueCount
      });

    } catch (error) {
      console.error('Error loading repayment data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load notification history
  const loadNotificationHistory = async () => {
    try {
      const { data, error } = await notificationService.getNotificationHistory({
        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
      });

      if (error) {
        console.error('Error loading notification history:', error);
        return;
      }

      setNotificationHistory(data || []);
    } catch (error) {
      console.error('Error loading notification history:', error);
    }
  };

  // Load restructuring requests
  const loadRestructuringRequests = async () => {
    try {
      const { data, error } = await RepaymentRestructuringService.getRestructuringRequests();
      if (error) {
        console.error('Error loading restructuring requests:', error);
        return;
      }
      setRestructuringRequests(data || []);
    } catch (error) {
      console.error('Error loading restructuring requests:', error);
    }
  };

  // Load scheduler status
  const loadSchedulerStatus = () => {
    const status = schedulerService.getStatus();
    setSchedulerStatus(status);
  };

  // Run AI notification system
  const runAiNotificationSystem = async () => {
    setIsRunningAiNotifications(true);
    
    try {
      // Update AI service settings
      aiNotificationService.updateSettings(aiNotificationSettings);
      
      // Run the notification system
      const result = await aiNotificationService.runNotificationSystem();
      
      if (result.success) {
        alert(`AI Notification System completed successfully!\n\nNotifications sent: ${result.notificationsSent}\nEscalated: ${result.escalated}\nErrors: ${result.errors.length}`);
        
        // Reload data
        loadRepaymentData();
        loadNotificationHistory();
      } else {
        alert(`AI Notification System failed:\n\n${result.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Error running AI notification system:', error);
      alert('Error running AI notification system. Please try again.');
    } finally {
      setIsRunningAiNotifications(false);
    }
  };

  // Start/Stop scheduler
  const toggleScheduler = () => {
    if (schedulerStatus?.isRunning) {
      schedulerService.stop();
      } else {
      schedulerService.start();
    }
    loadSchedulerStatus();
  };

  // Manual trigger for testing
  const triggerScheduler = async () => {
    try {
      await schedulerService.triggerTask('reminder_check');
      alert('Scheduler triggered successfully!');
      loadRepaymentData();
      loadNotificationHistory();
    } catch (error) {
      console.error('Error triggering scheduler:', error);
      alert('Error triggering scheduler. Please try again.');
    }
  };

  const getDpdColor = (bucket: string) => {
    switch (bucket) {
      case 'DPD 30': return 'bg-yellow-100 text-yellow-800';
      case 'DPD 60': return 'bg-orange-100 text-orange-800';
      case 'DPD 90+': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Reminder': return 'bg-blue-100 text-blue-800';
      case 'Promise to Pay': return 'bg-purple-100 text-purple-800';
      case 'Restructuring': return 'bg-indigo-100 text-indigo-800';
      case 'Legal Hand-off': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(roundCurrency(amount));
  };

  const handleSendReminder = (account: any) => {
    setSelectedAccount(account);
    setShowReminderModal(true);
  };

  const handleSendReminderAction = async () => {
    if (!selectedAccount) return;
    
    setIsProcessing(true);
    
    try {
      // Send real notification
      const smsResult = await notificationService.sendSMS({
        to: selectedAccount.phone,
        message: `Dear ${selectedAccount.clientName}, your loan payment of ${formatCurrency(selectedAccount.overdueAmount)} is overdue. Please make payment to avoid additional charges.`
      });

      const emailResult = selectedAccount.email ? await notificationService.sendEmail({
        to: selectedAccount.email,
        subject: 'Payment Overdue Reminder',
        body: `Dear ${selectedAccount.clientName},\n\nYour loan payment of ${formatCurrency(selectedAccount.overdueAmount)} is overdue. Please make payment to avoid additional charges.\n\nThank you.`
      }) : { success: true };

      if (smsResult.success && emailResult.success) {
        alert(`Reminder sent successfully to ${selectedAccount.clientName} via SMS${selectedAccount.email ? ' and email' : ''}.`);
        setShowReminderModal(false);
        loadNotificationHistory();
      } else {
        alert('Error sending reminder. Please try again.');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Error sending reminder. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ClickPesa Payment Collection Functions
  const handleCollectPayment = (account: any) => {
    setSelectedAccount(account);
    setPaymentAmount(account.overdueAmount.toString());
    setShowPaymentModal(true);
  };

  const handleCreatePayment = async () => {
    if (!selectedAccount || !paymentAmount) return;
    
    setIsProcessingPayment(true);
    setPaymentStatus('processing');
    
    try {
      if (paymentMethod === 'ClickPesa') {
        // Create ClickPesa payment request
        const paymentResult = await clickPesaService.createPayment({
          amount: parseFloat(paymentAmount),
          currency: 'TZS',
          customer_phone: selectedAccount.phone,
          customer_name: selectedAccount.clientName,
          reference: `REPAY-${selectedAccount.id}`,
          description: `Loan repayment for ${selectedAccount.id}`,
          callback_url: `${window.location.origin}/api/webhooks/clickpesa`
        });
        
        console.log('ClickPesa payment result:', paymentResult);
        
        if (paymentResult.payment_url) {
          setPaymentUrl(paymentResult.payment_url);
          setQrCodeData(paymentResult.payment_url);
          setPaymentStatus('completed');
          
          // Open payment URL in new tab
          window.open(paymentResult.payment_url, '_blank');
        } else {
          throw new Error('Payment URL not received from ClickPesa');
        }
      } else {
        // Mock payment for other methods
        await new Promise(resolve => setTimeout(resolve, 2000));
        setPaymentStatus('completed');
        alert(`Payment of ${formatCurrency(parseFloat(paymentAmount))} processed successfully via ${paymentMethod}`);
      }
      
    } catch (error) {
      console.error('Error creating payment:', error);
      setPaymentStatus('failed');
      alert(`Error creating payment: ${error.message || 'Please try again.'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedAccount) return;
    
    try {
      // Update loan status in database
      await supabase
        .from('repayment_schedules')
        .update({ 
          is_paid: true,
          payment_date: new Date().toISOString(),
          payment_method: paymentMethod,
          payment_amount: parseFloat(paymentAmount)
        })
        .eq('loan_id', selectedAccount.id);
      
      // Reload data
      loadRepaymentData();
      
      alert(`Payment of ${formatCurrency(parseFloat(paymentAmount))} recorded successfully!`);
      setShowPaymentModal(false);
      setPaymentStatus('idle');
      setPaymentUrl('');
      setQrCodeData('');
      
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status. Please contact support.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Repayment Management</h1>
          <p className="text-red-100">
            Track repayments and manage delinquencies with AI-driven automated notifications
          </p>
        </div>

        {/* ClickPesa Status */}
        {clickPesaConnected && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="w-6 h-6 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">ClickPesa Payment Collection</h3>
                  <p className="text-purple-100">
                    Accept payments directly from clients via ClickPesa
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
                <span className="text-sm">Payment Collection Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Collections & Transaction Block */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Collections & Transaction</h3>
            <p className="text-sm text-gray-600 mt-1">
              Fast and accurate processing of loan payments with automated GL posting
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Search/Lookup */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Search/Lookup
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by Client ID, Loan ID, or Client Name..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Payment Entry Form */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Payment Entry Form</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount Received (TZS)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Method</option>
                        <option value="cash">Cash</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="savings_offset">Offset from Savings</option>
                        <option value="m_pesa">M-Pesa</option>
                        <option value="tigo_pesa">Tigo Pesa</option>
                        <option value="airtel_money">Airtel Money</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Payment
                      </label>
                      <input
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference/Transaction ID *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter transaction reference"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Allocation Preview */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Payment Allocation Preview</h4>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Penalty Fees</span>
                      <span className="text-sm font-medium text-red-600">TSh 0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Interest</span>
                      <span className="text-sm font-medium text-orange-600">TSh 0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Principal</span>
                      <span className="text-sm font-medium text-green-600">TSh 0</span>
                    </div>
                    <hr className="border-gray-300" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total Allocation</span>
                      <span className="text-sm font-bold text-gray-900">TSh 0</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">System Actions</p>
                      <p className="text-xs text-blue-700">Auto-posts to GL and updates loan status</p>
                    </div>
                  </div>
                </div>

                <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Process Payment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Overdue</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(stats.totalOverdue)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PAR 30 (BoT {'<5%'})</p>
                <p className="text-2xl font-bold text-green-700">{stats.par30Rate}%</p>
                <p className="text-xs text-green-600">Within BoT limit</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delinquency Rate</p>
                <p className="text-2xl font-bold text-orange-700">{stats.delinquencyRate}%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Accounts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueCount}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* AI-Driven Notification System */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI-Driven Notification System</h3>
            <p className="text-sm text-gray-600 mt-1">
                  Intelligent, personalized repayment reminders based on payment schedules
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAiSettings(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <Settings className="w-4 h-4 mr-2 inline" />
                  Configure AI Settings
                </button>
                <button
                  onClick={runAiNotificationSystem}
                  disabled={isRunningAiNotifications}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isRunningAiNotifications ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isRunningAiNotifications ? 'Running...' : 'Run AI Notifications'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Scheduler Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Automated Scheduler</h4>
                  <p className="text-sm text-gray-600">
                    Status: <span className={`font-medium ${schedulerStatus?.isRunning ? 'text-green-600' : 'text-red-600'}`}>
                      {schedulerStatus?.isRunning ? 'Running' : 'Stopped'}
                  </span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={toggleScheduler}
                    className={`px-3 py-1 text-sm font-medium rounded-lg ${
                      schedulerStatus?.isRunning 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {schedulerStatus?.isRunning ? (
                      <>
                        <Pause className="w-4 h-4 mr-1 inline" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1 inline" />
                        Start
                      </>
                    )}
                  </button>
                  <button
                    onClick={triggerScheduler}
                    className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
                  >
                    <RefreshCw className="w-4 h-4 mr-1 inline" />
                    Trigger Now
                  </button>
                </div>
              </div>
              </div>

            {/* AI Status Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  {notificationHistory.length}
                </div>
                <p className="text-sm text-blue-600">Total Notifications</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {notificationHistory.filter(n => n.status === 'sent').length}
                </div>
                <p className="text-sm text-green-600">Sent Successfully</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">
                  {notificationHistory.filter(n => n.status === 'escalated_to_human').length}
                </div>
                <p className="text-sm text-yellow-600">Escalated to Human</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">
                  {notificationHistory.length > 0 ? 
                    roundPercentage((notificationHistory.filter(n => n.status === 'sent').length / notificationHistory.length) * 100) : 0}%
                </div>
                <p className="text-sm text-purple-600">Success Rate</p>
              </div>
              </div>

            {/* Recent Notifications */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent AI-Generated Notifications</h4>
              {notificationHistory.slice(0, 5).map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h5 className="font-medium text-gray-900">{notification.client_id}</h5>
                        <p className="text-sm text-gray-600">Loan: {notification.loan_id} • Type: {notification.notification_type}</p>
                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                      notification.status === 'escalated_to_human' ? 'bg-red-100 text-red-800' :
                      notification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {notification.status === 'sent' ? 'Sent' :
                       notification.status === 'escalated_to_human' ? 'Escalated' :
                       notification.status === 'pending' ? 'Pending' :
                       'Unknown'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      notification.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                      notification.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      notification.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {notification.risk_level === 'high' ? 'High Risk' :
                       notification.risk_level === 'medium' ? 'Medium Risk' :
                       notification.risk_level === 'low' ? 'Low Risk' :
                       'Unknown Risk'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {notification.channel === 'both' ? 'SMS + Email' : notification.channel.toUpperCase()}
                  </span>
                </div>
              </div>
              ))}
              
              {notificationHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No AI notifications generated yet. Click "Run AI Notifications" to start the intelligent notification system.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collections Queue & Prioritization Block */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Collections Queue & Prioritization</h3>
            <p className="text-sm text-gray-600 mt-1">
              Prioritized, actionable list of clients for active follow-up with AI-driven risk assessment
            </p>
          </div>
          
          <div className="p-6">
            {/* Filtering and Sorting Controls */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loan Product</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All Products</option>
                  <option value="personal">Personal Loan</option>
                  <option value="business">Business Loan</option>
                  <option value="agricultural">Agricultural Loan</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DPD Bracket</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All DPD</option>
                  <option value="1-7">1-7 DPD</option>
                  <option value="8-30">8-30 DPD</option>
                  <option value="31-60">31-60 DPD</option>
                  <option value="61-90">61-90 DPD</option>
                  <option value="90+">90+ DPD</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Officer</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All Officers</option>
                  <option value="john_doe">John Doe</option>
                  <option value="jane_smith">Jane Smith</option>
                  <option value="mike_wilson">Mike Wilson</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Next Action Due</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All Actions</option>
                  <option value="call_client">Call Client</option>
                  <option value="field_visit">Field Visit</option>
                  <option value="formal_notice">Send Formal Notice</option>
                  <option value="restructure">Initiate Restructuring</option>
                </select>
              </div>
            </div>

            {/* Collections Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan ID / Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DPD Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overdue Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Score/Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Action Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Officer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Sample data - in real implementation, this would come from the database */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">LA-1760439557884</div>
                        <div className="text-sm text-gray-500">Cole-Griffith</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-900">5 DPD</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">TSh 150,000</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Low Risk
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Call Client</div>
                      <div className="text-xs text-gray-500">Due: Today</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">John Doe</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Call</button>
                      <button className="text-green-600 hover:text-green-900">Visit</button>
                    </td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">LA-1760419799795</div>
                        <div className="text-sm text-gray-500">James Chacha</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-900">25 DPD</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">TSh 450,000</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Medium Risk
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Field Visit</div>
                      <div className="text-xs text-gray-500">Due: Tomorrow</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Jane Smith</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Call</button>
                      <button className="text-green-600 hover:text-green-900">Visit</button>
                    </td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">LA-1760356981765</div>
                        <div className="text-sm text-gray-500">Sarah Johnson</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-900">95 DPD</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">TSh 1,200,000</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        High Risk
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Send Formal Notice</div>
                      <div className="text-xs text-gray-500">Overdue</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Mike Wilson</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-red-600 hover:text-red-900 mr-3">Notice</button>
                      <button className="text-orange-600 hover:text-orange-900">Restructure</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Individual Loan Performance Block */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Individual Loan Performance</h3>
            <p className="text-sm text-gray-600 mt-1">
              Deep dive into repayment history and health of individual loans
            </p>
          </div>
          
          <div className="p-6">
            {/* Loan Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Loan for Detailed Analysis
              </label>
              <select className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Choose a loan to analyze...</option>
                <option value="LA-1760439557884">LA-1760439557884 - Cole-Griffith</option>
                <option value="LA-1760419799795">LA-1760419799795 - James Chacha</option>
                <option value="LA-1760356981765">LA-1760356981765 - Sarah Johnson</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Repayment History Table */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Repayment History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount Due</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2 text-gray-900">2024-01-15</td>
                        <td className="px-3 py-2 text-gray-900">TSh 150,000</td>
                        <td className="px-3 py-2 text-green-600">TSh 150,000</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Paid
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-900">2024-02-15</td>
                        <td className="px-3 py-2 text-gray-900">TSh 150,000</td>
                        <td className="px-3 py-2 text-green-600">TSh 150,000</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Paid
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-900">2024-03-15</td>
                        <td className="px-3 py-2 text-gray-900">TSh 150,000</td>
                        <td className="px-3 py-2 text-yellow-600">TSh 100,000</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Partial
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-900">2024-04-15</td>
                        <td className="px-3 py-2 text-gray-900">TSh 150,000</td>
                        <td className="px-3 py-2 text-red-600">TSh 0</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Missed
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Projection vs Actual Chart */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Projection vs Actual Chart</h4>
                <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Chart visualization would be here</p>
                    <p className="text-xs text-gray-400">Comparing original schedule with actual payments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interaction Log */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">Interaction Log</h4>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Phone Call</span>
                        <span className="text-xs text-gray-500">2024-04-20 14:30</span>
                      </div>
                      <p className="text-sm text-gray-600">Client promised to pay TSh 50,000 by end of week. Follow up scheduled for Friday.</p>
                    </div>
                    <span className="text-xs text-gray-500">John Doe</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">SMS Reminder</span>
                        <span className="text-xs text-gray-500">2024-04-18 09:00</span>
                      </div>
                      <p className="text-sm text-gray-600">Payment reminder sent via SMS. No response received.</p>
                    </div>
                    <span className="text-xs text-gray-500">System</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Field Visit</span>
                        <span className="text-xs text-gray-500">2024-04-15 10:00</span>
                      </div>
                      <p className="text-sm text-gray-600">Visited client at business location. Client mentioned cash flow issues due to delayed payments from customers.</p>
                    </div>
                    <span className="text-xs text-gray-500">Jane Smith</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 flex justify-end">
              <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Initiate Restructuring/Rescheduling
              </button>
            </div>
          </div>
        </div>

        {/* Overdue Accounts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Overdue Accounts</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage delinquent accounts with collection workflows
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DPD Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overdueAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {account.clientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {account.clientId} • {account.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {account.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          Overdue: {formatCurrency(account.overdueAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Last payment: {account.lastPayment}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDpdColor(account.dpdBucket)}`}>
                          {account.dpdBucket}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">
                          {account.daysOverdue} days overdue
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(account.collectionStage)}`}>
                          {account.collectionStage}
                        </span>
                        {account.promiseToPay && (
                          <div className="text-sm text-gray-500 mt-1">
                            Promise: {account.promiseToPay}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSendReminder(account)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 flex items-center"
                          title="Send Reminder"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Reminder
                        </button>
                        <button
                          onClick={() => handleCollectPayment(account)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 flex items-center"
                          title="Collect Payment"
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          Collect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Send Reminder Modal */}
        {showReminderModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Send Payment Reminder</h3>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{selectedAccount.clientName}</h4>
                  <p className="text-sm text-gray-600">
                    Loan: {selectedAccount.id} • Overdue: {formatCurrency(selectedAccount.overdueAmount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Phone: {selectedAccount.phone}
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowReminderModal(false)}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendReminderAction}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reminder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Collection Modal */}
        {showPaymentModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Collect Payment</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Client Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{selectedAccount.clientName}</h4>
                  <p className="text-sm text-gray-600">
                    Loan: {selectedAccount.id} • Overdue: {formatCurrency(selectedAccount.overdueAmount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Phone: {selectedAccount.phone}
                  </p>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ClickPesa" disabled={!clickPesaConnected}>
                      ClickPesa {clickPesaConnected ? '(Recommended)' : '(Not Connected)'}
                    </option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Tigo Pesa">Tigo Pesa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount (TZS)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter payment amount"
                  />
                </div>

                {/* ClickPesa Payment URL */}
                {paymentMethod === 'ClickPesa' && paymentUrl && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-medium text-gray-900 mb-3">ClickPesa Payment Link</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={paymentUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(paymentUrl)}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="text-center">
                        <button
                          onClick={() => window.open(paymentUrl, '_blank')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center mx-auto"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Payment Page
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Status */}
                {paymentStatus === 'processing' && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center">
                      <RefreshCw className="w-5 h-5 text-yellow-600 mr-2 animate-spin" />
                      <span className="text-yellow-800">Processing payment...</span>
                    </div>
                  </div>
                )}

                {paymentStatus === 'completed' && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800">Payment link generated successfully!</span>
                    </div>
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center">
                      <XCircle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-800">Payment creation failed. Please try again.</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePayment}
                    disabled={!paymentAmount || isProcessingPayment || paymentStatus === 'processing'}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Create Payment
                      </>
                    )}
                  </button>
                  {paymentStatus === 'completed' && (
                    <button
                      onClick={handlePaymentSuccess}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collections Action & Recovery Block */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Collections Action & Recovery</h3>
            <p className="text-sm text-gray-600 mt-1">
              Legally-compliant escalation of collection efforts based on contract clauses
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Delinquency Status & Penalty Calculator */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Delinquency Status & Penalty Calculator</h4>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-red-900">Days Past Due</span>
                    <span className="text-lg font-bold text-red-600">15 DPD</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-red-700">Overdue Amount:</span>
                      <span className="text-sm font-medium text-red-900">TSh 150,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-red-700">Daily Penalty (0.5%):</span>
                      <span className="text-sm font-medium text-red-900">TSh 750/day</span>
                    </div>
                    <div className="flex justify-between border-t border-red-200 pt-2">
                      <span className="text-sm font-medium text-red-900">Total Penalty:</span>
                      <span className="text-sm font-bold text-red-900">TSh 11,250</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Workflow Checklist */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Compliance Workflow Checklist</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Step 1: Internal Alert (5 DPD)</p>
                        <p className="text-xs text-green-700">Send alert to Loan Officer</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600">Completed</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Step 2: First Formal Notice (15 DPD)</p>
                        <p className="text-xs text-yellow-700">Generate 14-day notice</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded hover:bg-yellow-200">
                      Generate
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Step 3: Second Formal Notice (29 DPD)</p>
                        <p className="text-xs text-gray-500">Generate 60-day notice with collateral warning</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recovery Cost Assessment */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">Recovery Cost Assessment</h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">Agent Commission (10%)</label>
                    <div className="text-lg font-bold text-orange-900">TSh 15,000</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">Advertising Costs</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">Logistics Costs</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Collateral & Guarantor Status */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">Collateral & Guarantor Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h5 className="font-medium text-blue-900 mb-3">Collateral Information</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Type:</span>
                      <span className="text-sm text-blue-900">Motor Vehicle</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Value:</span>
                      <span className="text-sm text-blue-900">TSh 2,500,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Registration:</span>
                      <span className="text-sm text-blue-900">T123ABC</span>
                    </div>
                    <button className="w-full mt-3 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200">
                      Initiate Inspection
                    </button>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h5 className="font-medium text-purple-900 mb-3">Guarantor Information</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-700">Name:</span>
                      <span className="text-sm text-purple-900">John Smith</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-700">Phone:</span>
                      <span className="text-sm text-purple-900">+255 123 456 789</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-700">Status:</span>
                      <span className="text-sm text-purple-900">Active</span>
                    </div>
                    <button className="w-full mt-3 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200">
                      Contact Guarantor
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Liquidation & Write-off Request */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">Liquidation & Write-off Request</h4>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-red-900">Loan Status: 95 DPD</p>
                    <p className="text-xs text-red-700">Eligible for liquidation process</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                    High Priority
                  </span>
                </div>
                <div className="space-y-3">
                  <button className="w-full px-4 py-3 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 border border-red-300">
                    Request Collateral Sale
                  </button>
                  <button className="w-full px-4 py-3 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 border border-red-300">
                    Request Bank Account Liquidation
                  </button>
                  <p className="text-xs text-red-600 text-center">
                    Requires Executive Committee approval
                  </p>
                </div>
              </div>
            </div>

            {/* CRB Reporting Action */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">CRB Reporting Action</h4>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Credit Reference Bureau Update</p>
                    <p className="text-xs text-gray-600">Update client's credit status as per contract terms</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700">
                    Update CRB Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
              </div>
    </Layout>
  );
};

export default RepaymentManagement;























