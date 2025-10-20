import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { supabase } from '../lib/supabaseClient';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  BarChart3,
  User,
  DollarSign,
  Calendar,
  Download,
  Send,
  Eye,
  Target,
  Database,
  Archive,
  Receipt,
  Calculator,
  Banknote,
  CreditCard
} from 'lucide-react';

interface Loan {
  id: string;
  clientName: string;
  clientId: string;
  phone: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  tenor: number;
  monthlyPayment: number;
  lastPaymentDate: string;
  nextPaymentDate: string;
  totalPaid: number;
  totalInterest: number;
  status: 'active' | 'ready_for_closure' | 'closed' | 'default';
  closureReason: string;
  closureDate?: string;
  finalStatement?: FinalStatement;
}

interface FinalStatement {
  principalAmount: number;
  totalInterest: number;
  totalFees: number;
  totalPaid: number;
  outstandingBalance: number;
  earlySettlementDiscount: number;
  finalAmount: number;
  closureDate: string;
  paymentMethod: string;
  transactionId: string;
}

interface ClosureAuditTrail {
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
  status: 'success' | 'pending' | 'failed';
}

const LoanClosure: React.FC = () => {
  const { t, language } = useLanguage();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [showFinalStatement, setShowFinalStatement] = useState(false);
  const [finalPayment, setFinalPayment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [auditTrail, setAuditTrail] = useState<ClosureAuditTrail[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAuditTrailModal, setShowAuditTrailModal] = useState(false);

  // Fetch loans from database
  const { data: loansData, loading: loansLoading, error: loansError } = useSupabaseQuery('loans', {
    select: `
      id,
      loan_application_id,
      principal_amount,
      interest_amount,
      total_amount,
      status,
      disbursement_date,
      first_payment_due,
      last_payment_date,
      next_payment_due,
      created_at,
      updated_at,
      loan_applications!loans_loan_application_id_fkey (
        id,
        application_id,
        client_id,
        repayment_period_months,
        interest_rate,
        clients (
          id,
          first_name,
          last_name,
          full_name,
          phone_number
        )
      )
    `,
    filter: [
      { column: 'status', operator: 'in', value: ['active', 'closed'] }
    ],
    orderBy: { column: 'created_at', ascending: false }
  });

  // Fetch repayment data for calculations
  const { data: repaymentsData } = useSupabaseQuery('loan_repayments', {
    select: `
      loan_id,
      amount_paid,
      principal_amount,
      interest_amount,
      payment_date
    `,
    orderBy: { column: 'payment_date', ascending: false }
  });

  // Transform database data to Loan interface
  useEffect(() => {
    console.log('🔍 LoanClosure - Data received:', {
      loansData: loansData?.length || 0,
      repaymentsData: repaymentsData?.length || 0,
      loansLoading,
      loansError: loansError?.message
    });
    
    if (loansData && repaymentsData) {
      console.log('🔍 LoanClosure - Sample loan data:', loansData[0]);
      const transformedLoans: Loan[] = loansData.map(loan => {
        const application = loan.loan_applications;
        const client = application?.clients;
        
        // Calculate totals from repayments
        const loanRepayments = repaymentsData.filter(r => r.loan_id === loan.id);
        const totalPaid = loanRepayments.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
        const totalInterest = loanRepayments.reduce((sum, r) => sum + (r.interest_amount || 0), 0);
        
        // Calculate current balance
        const currentBalance = Math.max(0, loan.total_amount - totalPaid);
        
        // Determine status
        let status: 'active' | 'ready_for_closure' | 'closed' | 'default' = 'active';
        if (loan.status === 'repaid') {
          status = 'closed';
        } else if (currentBalance <= loan.principal_amount * 0.1) { // Ready for closure if 90% paid
          status = 'ready_for_closure';
        } else if (loan.status === 'overdue') {
          status = 'default';
        }
        
        return {
          id: `LN${loan.id}`,
          clientName: client?.full_name || `${client?.first_name || ''} ${client?.last_name || ''}`.trim(),
          clientId: client?.id || '',
          phone: client?.phone_number || '',
          originalAmount: loan.principal_amount || 0,
          currentBalance: currentBalance,
          interestRate: application?.interest_rate || 0,
          tenor: application?.repayment_period_months || 0,
          monthlyPayment: Math.round((loan.total_amount || 0) / (application?.repayment_period_months || 1)),
          lastPaymentDate: loan.last_payment_date || '',
          nextPaymentDate: loan.next_payment_due || '',
          totalPaid: totalPaid,
          totalInterest: totalInterest,
          status: status,
          closureReason: status === 'closed' ? 'Normal completion' : status === 'ready_for_closure' ? 'Early settlement' : ''
        };
      });
      
      setLoans(transformedLoans);
    } else if (loansData && loansData.length === 0) {
      console.log('ℹ️ LoanClosure - No loans found in database, using fallback data');
      // Fallback to mock data if no loans in database
      const fallbackLoans: Loan[] = [
        {
          id: 'LN001',
          clientName: 'Mary Kinyangi',
          clientId: 'C001',
          phone: '+255 754 123 456',
          originalAmount: 2500000,
          currentBalance: 450000,
          interestRate: 12.5,
          tenor: 12,
          monthlyPayment: 235000,
          lastPaymentDate: '2025-01-01',
          nextPaymentDate: '2025-02-01',
          totalPaid: 2050000,
          totalInterest: 450000,
          status: 'ready_for_closure',
          closureReason: 'Early settlement'
        },
        {
          id: 'LN002',
          clientName: 'Peter Mollel',
          clientId: 'C002',
          phone: '+255 765 987 654',
          originalAmount: 800000,
          currentBalance: 0,
          interestRate: 15.0,
          tenor: 6,
          monthlyPayment: 150000,
          lastPaymentDate: '2025-01-15',
          nextPaymentDate: '2025-02-15',
          totalPaid: 800000,
          totalInterest: 100000,
          status: 'closed',
          closureReason: 'Normal completion',
          closureDate: '2025-01-15',
          finalStatement: {
            principalAmount: 800000,
            totalInterest: 100000,
            totalFees: 24000,
            totalPaid: 800000,
            outstandingBalance: 0,
            earlySettlementDiscount: 0,
            finalAmount: 0,
            closureDate: '2025-01-15',
            paymentMethod: 'M-Pesa',
            transactionId: 'TXN001234567'
          }
        },
        {
          id: 'LN003',
          clientName: 'Grace Mwalimu',
          clientId: 'C003',
          phone: '+255 756 456 789',
          originalAmount: 1200000,
          currentBalance: 850000,
          interestRate: 10.0,
          tenor: 18,
          monthlyPayment: 85000,
          lastPaymentDate: '2024-12-20',
          nextPaymentDate: '2025-01-20',
          totalPaid: 350000,
          totalInterest: 150000,
          status: 'active',
          closureReason: ''
        }
      ];
      setLoans(fallbackLoans);
    }
  }, [loansData, repaymentsData, loansLoading, loansError]);

  // Mock audit trail
  useEffect(() => {
    const mockAuditTrail: ClosureAuditTrail[] = [
      {
        timestamp: '2025-01-15 14:30:00',
        action: 'Loan Closure Initiated',
        performedBy: 'John Mwangi',
        details: 'Client requested early settlement',
        status: 'success'
      },
      {
        timestamp: '2025-01-15 14:32:00',
        action: 'Final Statement Generated',
        performedBy: 'System',
        details: 'Calculated outstanding balance and early settlement discount',
        status: 'success'
      },
      {
        timestamp: '2025-01-15 14:35:00',
        action: 'Payment Processed',
        performedBy: 'System',
        details: 'M-Pesa payment of TZS 450,000 processed successfully',
        status: 'success'
      },
      {
        timestamp: '2025-01-15 14:36:00',
        action: 'General Ledger Updated',
        performedBy: 'System',
        details: 'IFRS 9 compliant journal entries posted',
        status: 'success'
      },
      {
        timestamp: '2025-01-15 14:37:00',
        action: 'Loan Status Updated',
        performedBy: 'System',
        details: 'Loan status changed to closed',
        status: 'success'
      },
      {
        timestamp: '2025-01-15 14:38:00',
        action: 'Client Notification Sent',
        performedBy: 'System',
        details: 'SMS and email notifications sent to client',
        status: 'success'
      }
    ];
    setAuditTrail(mockAuditTrail);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'ready_for_closure': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'default': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateFinalStatement = (loan: Loan): FinalStatement => {
    const finalPaymentAmount = parseFloat(finalPayment) || loan.currentBalance;
    const earlySettlementDiscount = loan.currentBalance > finalPaymentAmount ? 
      loan.currentBalance - finalPaymentAmount : 0;
    
    return {
      principalAmount: loan.originalAmount,
      totalInterest: loan.totalInterest,
      totalFees: (loan.originalAmount * 0.03), // 3% processing fee
      totalPaid: loan.totalPaid,
      outstandingBalance: loan.currentBalance,
      earlySettlementDiscount,
      finalAmount: finalPaymentAmount,
      closureDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      transactionId: `TXN${Date.now()}`
    };
  };

  const handleInitiateClosure = (loan: Loan) => {
    setSelectedLoan(loan);
    setFinalPayment(loan.currentBalance.toString());
    setClosureReason('Early settlement');
    setShowClosureModal(true);
  };

  const handleProcessClosure = async () => {
    if (!selectedLoan) return;
    
    setIsProcessing(true);
    
    try {
      // Mock closure processing
      const closureSteps = [
        'Verifying final payment amount',
        'Calculating early settlement discount',
        'Processing payment transaction',
        'Updating General Ledger (IFRS 9)',
        'Generating final statement',
        'Updating loan status to closed',
        'Sending client notifications',
        'Archiving loan records'
      ];
      
      console.log('Processing loan closure:', closureSteps);
      
      // Update loan status
      const updatedLoans = loans.map(loan => 
        loan.id === selectedLoan.id 
          ? {
              ...loan,
              status: 'closed',
              closureDate: new Date().toISOString().split('T')[0],
              finalStatement: calculateFinalStatement(loan)
            }
          : loan
      );
      
      setLoans(updatedLoans);
      
      setTimeout(() => {
        alert(`Loan ${selectedLoan.id} closed successfully! Final statement generated and client notified.`);
        setShowClosureModal(false);
        setIsProcessing(false);
      }, 4000);
      
    } catch (error) {
      console.error('Error processing closure:', error);
      alert('Error processing closure. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleViewFinalStatement = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowFinalStatement(true);
  };

  const handleViewAuditTrail = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowAuditTrailModal(true);
  };

  const handleViewDetails = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowDetailsModal(true);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {language === 'en' ? 'Loan Closure Management' : 'Usimamizi wa Kufunga Mikopo'}
          </h1>
          <p className="text-green-100">
            {language === 'en' 
              ? 'Manage loan closures with accurate finalization and complete audit trails'
              : 'Simamia kufunga mikopo kwa ukamilifu na nyimbo kamili za ukaguzi'
            }
          </p>
        </div>

        {/* Loading and Error States */}
        {loansLoading && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">
                {language === 'en' ? 'Loading loans...' : 'Inapakia mikopo...'}
              </span>
            </div>
          </div>
        )}

        {loansError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-800">
                {language === 'en' ? 'Error Loading Loans' : 'Hitilafu ya Kupakia Mikopo'}
              </h3>
            </div>
            <p className="text-red-600 mt-2">
              {loansError.message || (language === 'en' ? 'Failed to load loan data. Please try again.' : 'Imeshindwa kupakia data ya mikopo. Tafadhali jaribu tena.')}
            </p>
            <div className="mt-4 p-3 bg-red-100 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Debug Info:</strong> {JSON.stringify(loansError, null, 2)}
              </p>
            </div>
          </div>
        )}

        {!loansLoading && !loansError && loans.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center">
              <Database className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-800">
                {language === 'en' ? 'No Loans Found' : 'Hakuna Mikopo Iliyopatikana'}
              </h3>
            </div>
            <p className="text-blue-600 mt-2">
              {language === 'en' 
                ? 'No loans found with status: current, repaid, or overdue. You may need to create some loan data first.'
                : 'Hakuna mikopo zilizopatikana zilizo na hali: current, repaid, au overdue. Huenda unahitaji kuunda data ya mikopo kwanza.'
              }
            </p>
            <div className="mt-4">
              <p className="text-sm text-blue-700">
                <strong>Next Steps:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                <li>Run the migration script: <code className="bg-blue-100 px-2 py-1 rounded">migrate_loan_closure_data.sql</code></li>
                <li>Or create loan applications and process them through the system</li>
                <li>Check if loans exist with different status values</li>
              </ul>
            </div>
          </div>
        )}

        {/* Portfolio Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            {language === 'en' ? 'Portfolio Overview' : 'Muhtasari wa Portfolio'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">
                {loans.filter(loan => loan.status === 'active').length}
              </div>
              <p className="text-sm text-blue-600">
                {language === 'en' ? 'Active Loans' : 'Mikopo ya Kati'}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">
                {loans.filter(loan => loan.status === 'ready_for_closure').length}
              </div>
              <p className="text-sm text-yellow-600">
                {language === 'en' ? 'Ready for Closure' : 'Tayari kwa Kufunga'}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {loans.filter(loan => loan.status === 'closed').length}
              </div>
              <p className="text-sm text-green-600">
                {language === 'en' ? 'Closed This Month' : 'Imefungwa Mwezi Huu'}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">
                {formatCurrency(loans.reduce((sum, loan) => sum + loan.totalPaid, 0))}
              </div>
              <p className="text-sm text-purple-600">
                {language === 'en' ? 'Total Recovered' : 'Jumla ya Kurejeshwa'}
              </p>
            </div>
          </div>
        </div>

        {/* Loans List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'en' ? 'Loan Portfolio' : 'Portfolio ya Mikopo'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {language === 'en' 
                ? 'Manage loan closures and generate final statements'
                : 'Simamia kufunga mikopo na tengeneza taarifa za mwisho'
              }
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Loan Details' : 'Maelezo ya Mkopo'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Client Info' : 'Maelezo ya Mteja'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Financial Status' : 'Hali ya Fedha'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Status' : 'Hali'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Actions' : 'Vitendo'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{loan.id}</div>
                        <div className="text-sm text-gray-500">
                          {language === 'en' ? 'Original' : 'Asili'}: {formatCurrency(loan.originalAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {language === 'en' ? 'Balance' : 'Salio'}: {formatCurrency(loan.currentBalance)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {loan.tenor} {language === 'en' ? 'months' : 'miezi'} @ {loan.interestRate}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                        <div className="text-sm text-gray-500">{loan.clientId}</div>
                        <div className="text-sm text-gray-500">{loan.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(loan.monthlyPayment)}/{language === 'en' ? 'month' : 'mwezi'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {language === 'en' ? 'Total Paid' : 'Jumla ya Kulipwa'}: {formatCurrency(loan.totalPaid)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {language === 'en' ? 'Interest' : 'Riba'}: {formatCurrency(loan.totalInterest)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {language === 'en' ? 'Last Payment' : 'Malipo ya Mwisho'}: {loan.lastPaymentDate}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status === 'active' ? (language === 'en' ? 'Active' : 'Kati') :
                         loan.status === 'ready_for_closure' ? (language === 'en' ? 'Ready for Closure' : 'Tayari kwa Kufunga') :
                         loan.status === 'closed' ? (language === 'en' ? 'Closed' : 'Imefungwa') :
                         (language === 'en' ? 'Default' : 'Imeshindwa')}
                      </span>
                      {loan.closureDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {language === 'en' ? 'Closed' : 'Imefungwa'}: {loan.closureDate}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        {loan.status === 'ready_for_closure' && (
                          <button
                            onClick={() => handleInitiateClosure(loan)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 flex items-center"
                            title={language === 'en' ? 'Initiate Closure' : 'Anza Kufunga'}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'en' ? 'Initiate Closure' : 'Anza Kufunga'}
                          </button>
                        )}
                        {loan.status === 'closed' && loan.finalStatement && (
                          <button
                            onClick={() => handleViewFinalStatement(loan)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 flex items-center"
                            title={language === 'en' ? 'View Final Statement' : 'Ona Taarifa ya Mwisho'}
                          >
                            <Receipt className="w-4 h-4 mr-2" />
                            {language === 'en' ? 'Final Statement' : 'Taarifa ya Mwisho'}
                          </button>
                        )}
                        <button
                          onClick={() => handleViewAuditTrail(loan)}
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 flex items-center"
                          title={language === 'en' ? 'View Audit Trail' : 'Ona Nyimbo za Ukaguzi'}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          {language === 'en' ? 'Audit Trail' : 'Nyimbo za Ukaguzi'}
                        </button>
                        <button 
                          onClick={() => handleViewDetails(loan)}
                          className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 flex items-center" 
                          title={language === 'en' ? 'View Details' : 'Ona Maelezo'}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {language === 'en' ? 'Details' : 'Maelezo'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Closure Modal */}
        {showClosureModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {language === 'en' ? 'Loan Closure Process' : 'Mchakato wa Kufunga Mkopo'} - {selectedLoan.clientName}
                </h3>
                <button
                  onClick={() => setShowClosureModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Current Loan Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {language === 'en' ? 'Current Loan Summary' : 'Muhtasari wa Mkopo wa Sasa'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>{language === 'en' ? 'Original Amount' : 'Kiasi cha Asili'}:</strong> {formatCurrency(selectedLoan.originalAmount)}</p>
                      <p><strong>{language === 'en' ? 'Current Balance' : 'Salio la Sasa'}:</strong> {formatCurrency(selectedLoan.currentBalance)}</p>
                      <p><strong>{language === 'en' ? 'Total Paid' : 'Jumla ya Kulipwa'}:</strong> {formatCurrency(selectedLoan.totalPaid)}</p>
                    </div>
                    <div>
                      <p><strong>{language === 'en' ? 'Interest Rate' : 'Kiwango cha Riba'}:</strong> {selectedLoan.interestRate}%</p>
                      <p><strong>{language === 'en' ? 'Monthly Payment' : 'Malipo ya Mwezi'}:</strong> {formatCurrency(selectedLoan.monthlyPayment)}</p>
                      <p><strong>{language === 'en' ? 'Total Interest' : 'Jumla ya Riba'}:</strong> {formatCurrency(selectedLoan.totalInterest)}</p>
                    </div>
                  </div>
                </div>

                {/* Closure Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Final Payment Amount (TZS)' : 'Kiasi cha Malipo ya Mwisho (TZS)'}
                    </label>
                    <input
                      type="number"
                      value={finalPayment}
                      onChange={(e) => setFinalPayment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      max={selectedLoan.currentBalance}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'en' ? 'Maximum' : 'Kiwango cha Juu'}: {formatCurrency(selectedLoan.currentBalance)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Payment Method' : 'Njia ya Malipo'}
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{language === 'en' ? 'Select method...' : 'Chagua njia...'}</option>
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="Tigo Pesa">Tigo Pesa</option>
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Closure Reason' : 'Sababu ya Kufunga'}
                    </label>
                    <select
                      value={closureReason}
                      onChange={(e) => setClosureReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{language === 'en' ? 'Select reason...' : 'Chagua sababu...'}</option>
                      <option value="Early settlement">{language === 'en' ? 'Early Settlement' : 'Malipo ya Mapema'}</option>
                      <option value="Normal completion">{language === 'en' ? 'Normal Completion' : 'Kukamilika kwa Kawaida'}</option>
                      <option value="Refinancing">{language === 'en' ? 'Refinancing' : 'Kupata Mkopo Mpya'}</option>
                      <option value="Client request">{language === 'en' ? 'Client Request' : 'Ombi la Mteja'}</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        const statement = calculateFinalStatement(selectedLoan);
                        setSelectedLoan(prev => prev ? { ...prev, finalStatement: statement } : null);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium flex items-center justify-center"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Calculate Final Statement' : 'Hesabu Taarifa ya Mwisho'}
                    </button>
                  </div>
                </div>

                {/* Final Statement Preview */}
                {selectedLoan.finalStatement && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {language === 'en' ? 'Final Statement Preview' : 'Muhtasari wa Taarifa ya Mwisho'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>{language === 'en' ? 'Outstanding Balance' : 'Salio la Kubaki'}:</strong> {formatCurrency(selectedLoan.finalStatement.outstandingBalance)}</p>
                        <p><strong>{language === 'en' ? 'Early Settlement Discount' : 'Punguzo la Malipo ya Mapema'}:</strong> {formatCurrency(selectedLoan.finalStatement.earlySettlementDiscount)}</p>
                        <p><strong>{language === 'en' ? 'Final Amount' : 'Kiasi cha Mwisho'}:</strong> {formatCurrency(selectedLoan.finalStatement.finalAmount)}</p>
                      </div>
                      <div>
                        <p><strong>{language === 'en' ? 'Payment Method' : 'Njia ya Malipo'}:</strong> {selectedLoan.finalStatement.paymentMethod}</p>
                        <p><strong>{language === 'en' ? 'Transaction ID' : 'Namba ya Muamala'}:</strong> {selectedLoan.finalStatement.transactionId}</p>
                        <p><strong>{language === 'en' ? 'Closure Date' : 'Tarehe ya Kufunga'}:</strong> {selectedLoan.finalStatement.closureDate}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Post-Closure Actions */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h5 className="font-medium text-gray-900 mb-2">
                    {language === 'en' ? 'Post-Closure Actions' : 'Vitendo baada ya Kufunga'}
                  </h5>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Update General Ledger (IFRS 9)' : 'Sasisha Kitabu Kikuu (IFRS 9)'}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Generate final statement PDF' : 'Tengeneza PDF ya taarifa ya mwisho'}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Send closure notification to client' : 'Tuma arifa ya kufunga kwa mteja'}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">
                        {language === 'en' ? 'Archive loan records' : 'Hifadhi rekodi za mkopo'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowClosureModal(false)}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    {language === 'en' ? 'Cancel' : 'Ghairi'}
                  </button>
                  <button
                    onClick={handleProcessClosure}
                    disabled={!finalPayment || !paymentMethod || !closureReason || isProcessing}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        {language === 'en' ? 'Processing...' : 'Inachakata...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {language === 'en' ? 'Process Closure' : 'Chakata Kufunga'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Statement Modal */}
        {showFinalStatement && selectedLoan && selectedLoan.finalStatement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {language === 'en' ? 'Final Statement' : 'Taarifa ya Mwisho'} - {selectedLoan.clientName}
                </h3>
                <button
                  onClick={() => setShowFinalStatement(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Statement Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {language === 'en' ? 'FINAL LOAN STATEMENT' : 'TAARIFA YA MWISHO YA MKOPO'}
                  </h2>
                  <p className="text-gray-600 mt-2">Tanzania Microfinance Institution</p>
                  <p className="text-sm text-gray-500">Licensed by Bank of Tanzania</p>
                </div>

                {/* Statement Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {language === 'en' ? 'Loan Summary' : 'Muhtasari wa Mkopo'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Loan ID' : 'Namba ya Mkopo'}:</span>
                        <span className="font-medium">{selectedLoan.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Client' : 'Mteja'}:</span>
                        <span className="font-medium">{selectedLoan.clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Principal Amount' : 'Kiasi cha Msingi'}:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.finalStatement.principalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Total Interest' : 'Jumla ya Riba'}:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.finalStatement.totalInterest)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {language === 'en' ? 'Payment Summary' : 'Muhtasari wa Malipo'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Total Paid' : 'Jumla ya Kulipwa'}:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.finalStatement.totalPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Outstanding Balance' : 'Salio la Kubaki'}:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.finalStatement.outstandingBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Early Settlement Discount' : 'Punguzo la Malipo ya Mapema'}:</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedLoan.finalStatement.earlySettlementDiscount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Final Amount' : 'Kiasi cha Mwisho'}:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(selectedLoan.finalStatement.finalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {language === 'en' ? 'Payment Details' : 'Maelezo ya Malipo'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>{language === 'en' ? 'Payment Method' : 'Njia ya Malipo'}:</strong> {selectedLoan.finalStatement.paymentMethod}</p>
                      <p><strong>{language === 'en' ? 'Transaction ID' : 'Namba ya Muamala'}:</strong> {selectedLoan.finalStatement.transactionId}</p>
                    </div>
                    <div>
                      <p><strong>{language === 'en' ? 'Closure Date' : 'Tarehe ya Kufunga'}:</strong> {selectedLoan.finalStatement.closureDate}</p>
                      <p><strong>{language === 'en' ? 'Status' : 'Hali'}:</strong> <span className="text-green-600 font-medium">{language === 'en' ? 'PAID IN FULL' : 'IMELIPWA KAMILI'}</span></p>
                    </div>
                  </div>
                </div>

                {/* Audit Trail */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {language === 'en' ? 'Closure Audit Trail' : 'Nyimbo za Ukaguzi wa Kufunga'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    {auditTrail.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                        <div>
                          <span className="font-medium">{entry.action}</span>
                          <p className="text-gray-600">{entry.details}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500">{entry.timestamp}</span>
                          <p className="text-xs text-gray-500">{entry.performedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowFinalStatement(false)}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    {language === 'en' ? 'Close' : 'Funga'}
                  </button>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'Download PDF' : 'Pakua PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loan Details Modal */}
        {showDetailsModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {language === 'en' ? 'Loan Details' : 'Maelezo ya Mkopo'} - {selectedLoan.clientName}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Loan Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      {language === 'en' ? 'Financial Summary' : 'Muhtasari wa Fedha'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">{language === 'en' ? 'Original Amount' : 'Kiasi cha Asili'}:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.originalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">{language === 'en' ? 'Current Balance' : 'Salio la Sasa'}:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.currentBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">{language === 'en' ? 'Total Paid' : 'Jumla ya Kulipwa'}:</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedLoan.totalPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">{language === 'en' ? 'Total Interest' : 'Jumla ya Riba'}:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.totalInterest)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-green-900 mb-3 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      {language === 'en' ? 'Payment Schedule' : 'Ratiba ya Malipo'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">{language === 'en' ? 'Monthly Payment' : 'Malipo ya Mwezi'}:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">{language === 'en' ? 'Interest Rate' : 'Kiwango cha Riba'}:</span>
                        <span className="font-medium">{selectedLoan.interestRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">{language === 'en' ? 'Tenor' : 'Muda'}:</span>
                        <span className="font-medium">{selectedLoan.tenor} {language === 'en' ? 'months' : 'miezi'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">{language === 'en' ? 'Last Payment' : 'Malipo ya Mwisho'}:</span>
                        <span className="font-medium">{selectedLoan.lastPaymentDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      {language === 'en' ? 'Client Information' : 'Maelezo ya Mteja'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">{language === 'en' ? 'Client Name' : 'Jina la Mteja'}:</span>
                        <span className="font-medium">{selectedLoan.clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">{language === 'en' ? 'Client ID' : 'Namba ya Mteja'}:</span>
                        <span className="font-medium">{selectedLoan.clientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">{language === 'en' ? 'Phone' : 'Simu'}:</span>
                        <span className="font-medium">{selectedLoan.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">{language === 'en' ? 'Status' : 'Hali'}:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedLoan.status)}`}>
                          {selectedLoan.status === 'active' ? (language === 'en' ? 'Active' : 'Kati') :
                           selectedLoan.status === 'ready_for_closure' ? (language === 'en' ? 'Ready for Closure' : 'Tayari kwa Kufunga') :
                           selectedLoan.status === 'closed' ? (language === 'en' ? 'Closed' : 'Imefungwa') :
                           (language === 'en' ? 'Default' : 'Imeshindwa')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                      {language === 'en' ? 'Payment History' : 'Historia ya Malipo'}
                    </h4>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{language === 'en' ? 'Last Payment' : 'Malipo ya Mwisho'}</p>
                          <p className="text-sm text-gray-600">{selectedLoan.lastPaymentDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">{formatCurrency(selectedLoan.monthlyPayment)}</p>
                          <p className="text-sm text-gray-600">{language === 'en' ? 'On time' : 'Kwa wakati'}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{language === 'en' ? 'Next Payment Due' : 'Malipo ya Kufuata'}</p>
                          <p className="text-sm text-gray-600">{selectedLoan.nextPaymentDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-blue-600">{formatCurrency(selectedLoan.monthlyPayment)}</p>
                          <p className="text-sm text-gray-600">{language === 'en' ? 'Scheduled' : 'Imepangwa'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loan Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                      {language === 'en' ? 'Performance Metrics' : 'Vipimo vya Utendaji'}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Payment Rate' : 'Kiwango cha Malipo'}:</span>
                        <span className="font-medium text-green-600">95%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Days Overdue' : 'Siku za Kuchelewa'}:</span>
                        <span className="font-medium text-green-600">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Risk Rating' : 'Kiwango cha Hatari'}:</span>
                        <span className="font-medium text-blue-600">{language === 'en' ? 'Low' : 'Chini'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-purple-600" />
                      {language === 'en' ? 'Closure Information' : 'Maelezo ya Kufunga'}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Closure Reason' : 'Sababu ya Kufunga'}:</span>
                        <span className="font-medium">{selectedLoan.closureReason || (language === 'en' ? 'N/A' : 'Hakuna')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Closure Date' : 'Tarehe ya Kufunga'}:</span>
                        <span className="font-medium">{selectedLoan.closureDate || (language === 'en' ? 'N/A' : 'Hakuna')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{language === 'en' ? 'Early Settlement' : 'Malipo ya Mapema'}:</span>
                        <span className="font-medium text-orange-600">
                          {selectedLoan.currentBalance < selectedLoan.originalAmount ? (language === 'en' ? 'Yes' : 'Ndiyo') : (language === 'en' ? 'No' : 'Hapana')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    {language === 'en' ? 'Close' : 'Funga'}
                  </button>
                  {selectedLoan.status === 'ready_for_closure' && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleInitiateClosure(selectedLoan);
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Initiate Closure' : 'Anza Kufunga'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Audit Trail Modal */}
        {showAuditTrailModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {language === 'en' ? 'Audit Trail' : 'Nyimbo za Ukaguzi'} - {selectedLoan.clientName}
                </h3>
                <button
                  onClick={() => setShowAuditTrailModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Audit Trail Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-purple-600" />
                    {language === 'en' ? 'Audit Summary' : 'Muhtasari wa Ukaguzi'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p><strong>{language === 'en' ? 'Total Actions' : 'Jumla ya Vitendo'}:</strong> {auditTrail.length}</p>
                      <p><strong>{language === 'en' ? 'Successful' : 'Imefanikiwa'}:</strong> {auditTrail.filter(a => a.status === 'success').length}</p>
                    </div>
                    <div>
                      <p><strong>{language === 'en' ? 'Pending' : 'Inasubiri'}:</strong> {auditTrail.filter(a => a.status === 'pending').length}</p>
                      <p><strong>{language === 'en' ? 'Failed' : 'Imeshindwa'}:</strong> {auditTrail.filter(a => a.status === 'failed').length}</p>
                    </div>
                    <div>
                      <p><strong>{language === 'en' ? 'Last Action' : 'Kitendo cha Mwisho'}:</strong></p>
                      <p className="text-gray-600">{auditTrail[0]?.timestamp}</p>
                    </div>
                  </div>
                </div>

                {/* Detailed Audit Trail */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Database className="w-5 h-5 mr-2 text-blue-600" />
                    {language === 'en' ? 'Detailed Audit Log' : 'Kumbukumbu ya Ukaguzi'}
                  </h4>
                  <div className="space-y-3">
                    {auditTrail.map((entry, index) => (
                      <div key={index} className={`p-4 rounded-lg border-l-4 ${
                        entry.status === 'success' ? 'bg-green-50 border-green-400' :
                        entry.status === 'pending' ? 'bg-yellow-50 border-yellow-400' :
                        'bg-red-50 border-red-400'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="font-medium text-gray-900">{entry.action}</span>
                              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                                entry.status === 'success' ? 'bg-green-100 text-green-800' :
                                entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {entry.status === 'success' ? (language === 'en' ? 'Success' : 'Imefanikiwa') :
                                 entry.status === 'pending' ? (language === 'en' ? 'Pending' : 'Inasubiri') :
                                 (language === 'en' ? 'Failed' : 'Imeshindwa')}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{entry.details}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <User className="w-3 h-3 mr-1" />
                              {entry.performedBy}
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500 ml-4">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export Options */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h5 className="font-medium text-gray-900 mb-3">
                    {language === 'en' ? 'Export Options' : 'Chaguzi za Kuchapisha'}
                  </h5>
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium flex items-center text-sm">
                      <Download className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Export PDF' : 'Pakua PDF'}
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium flex items-center text-sm">
                      <FileText className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Export CSV' : 'Pakua CSV'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAuditTrailModal(false)}
                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    {language === 'en' ? 'Close' : 'Funga'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LoanClosure;

