import React, { useState, useEffect } from 'react';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { supabase } from '../lib/supabaseClient';
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
  Loader2,
  Activity,
  Shield,
  Target,
  Zap as ZapIcon,
  Search,
  Download,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, checkTopUpEligibility } from '../utils/topUpCalculations';
import { LoanData, TopUpEligibility } from '../types/topUp.types';
import TopUpRequestDialog from '../components/topUp/TopUpRequestDialog';
import RepaymentScheduleTable from '../components/RepaymentScheduleTable';
import { setupLoanDisbursementSubscriptions } from '../utils/loanDisbursementSync';
import { LoanSyncService } from '../utils/loanSyncService';
import jsPDF from 'jspdf';

const EnhancedLoanMonitoring: React.FC = () => {
  const [selectedLoan, setSelectedLoan] = useState<LoanData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [topUpEligibility, setTopUpEligibility] = useState<TopUpEligibility | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEligibility, setFilterEligibility] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState<string | null>(null);
  const [expandedLoans, setExpandedLoans] = useState<Set<string>>(new Set());
  
  // Fetch active loans directly from loans table
  const { data: loans, loading: loansLoading, error: loansError } = useSupabaseQuery('loans', {
    select: `
      id,
      loan_application_id,
      client_id,
      application_id,
      principal_amount,
      loan_amount,
      disbursed_amount,
      outstanding_balance,
      current_balance,
      interest_rate,
      effective_annual_rate,
      tenor_months,
      term_months,
      repayment_frequency,
      payment_frequency,
      disbursement_date,
      maturity_date,
      status,
      days_past_due,
      risk_rating,
      monthly_payment,
      total_repayment_amount,
      principal_paid,
      interest_paid,
      management_fee_paid,
      total_paid,
      first_payment_due,
      last_payment_date,
      next_payment_due,
      management_fee_rate,
      management_fee_amount,
      upfront_fees_deducted,
      upfront_fees_amount,
      disbursement_method,
      disbursement_reference,
      disbursement_channel,
      payment_history,
      late_payments_count,
      on_time_payments_count,
      consecutive_late_payments,
      created_at,
      updated_at,
      loan_applications!loans_loan_application_id_fkey (
        id,
        application_id,
        loan_purpose,
        clients (
          id,
          first_name,
          last_name,
          full_name,
          phone_number,
          email_address,
          client_type,
          street_name,
          house_number,
          area_of_residence,
          monthly_income
        )
      )
    `,
    filter: [
      { column: 'status', operator: 'eq', value: 'active' }
    ],
    orderBy: { column: 'created_at', ascending: false }
  });

  // Use loans directly from loans table
  const allLoans = loans || [];
  const combinedLoading = loansLoading;
  const combinedError = loansError;

  // Fetch existing loans from loans table for comparison
  const { data: existingLoans, loading: existingLoansLoading } = useSupabaseQuery('loans', {
    select: 'id, loan_application_id, application_id',
    filter: [
      { column: 'status', operator: 'eq', value: 'active' }
    ]
  });

  // Fetch client data separately to avoid foreign key issues
  const { loading: clientsLoading } = useSupabaseQuery('clients', {
    select: `
      id,
      first_name,
      last_name,
      full_name,
      phone_number,
      email_address,
      monthly_income
    `
  });

  // Real-time subscriptions for live data updates
  useEffect(() => {
    console.log('🔄 Setting up real-time subscriptions for loan monitoring...');
    
    // Subscribe to loans table changes
    const loansSubscription = supabase
      .channel('loans-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'loans',
          filter: 'status=eq.active'
        }, 
        (payload) => {
          console.log('📊 Real-time loan update:', payload);
          // Force refresh of loan data
          window.location.reload();
        }
      )
      .subscribe();

    // Subscribe to loan disbursements table changes with sync
    const disbursementsSubscription = setupLoanDisbursementSubscriptions();

    // Subscribe to clients table changes
    const clientsSubscription = supabase
      .channel('clients-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'clients'
        }, 
        (payload) => {
          console.log('👤 Real-time client update:', payload);
          // Force refresh of loan data
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscriptions...');
      supabase.removeChannel(loansSubscription);
      supabase.removeChannel(disbursementsSubscription);
      supabase.removeChannel(clientsSubscription);
    };
  }, []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown && !(event.target as Element).closest('.relative')) {
        setShowExportDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);


  // Fetch loan repayments data
  const { data: repayments, loading: repaymentsLoading } = useSupabaseQuery('loan_repayments', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Fetch repayment schedules data (original approved schedules)
  const { data: repaymentSchedules, loading: schedulesLoading } = useSupabaseQuery('loan_repayments', {
    select: '*',
    orderBy: { column: 'created_at', ascending: true }
  });


  // No need for auto-save since we're reading directly from loans table

  // Transform loan data for display (from loans table)
  const transformedLoans: any[] = allLoans?.map((loan: any) => {
    const loanApp = loan.loan_applications;
    const client = loanApp?.clients;
    console.log('🔄 Transforming loan from loans table:', loan.id, loan.application_id, loan.status);
    const clientRepayments = repayments?.filter((r: any) => r.loan_application_id === loan.loan_application_id) || [];
    
    // Calculate payment history percentage
    const totalPayments = clientRepayments.length;
    const onTimePayments = clientRepayments.filter((r: any) => 
      new Date(r.due_date) >= new Date(r.paid_date)
    ).length;
    const paymentHistoryPercentage = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 100;
    
    // Calculate days past due
    const today = new Date();
    const lastPayment = clientRepayments.sort((a: any, b: any) => 
      new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime()
    )[0];
    const daysPastDue = lastPayment ? 
      Math.max(0, Math.floor((today.getTime() - new Date(lastPayment.due_date).getTime()) / (1000 * 60 * 60 * 24))) : 0;
    
    // Use loan data directly from loans table
    let monthlyPayment = loan.monthly_payment || 0;
    
    // Calculate monthly payment if it's missing or 0
    if (monthlyPayment === 0 && loan.principal_amount && loan.interest_rate && loan.tenor_months) {
      const monthlyRate = loan.interest_rate / 12 / 100;
      monthlyPayment = loan.principal_amount * 
        (monthlyRate * Math.pow(1 + monthlyRate, loan.tenor_months)) /
        (Math.pow(1 + monthlyRate, loan.tenor_months) - 1);
    }
    
    // Monthly income is already in correct currency units
    const monthlyIncome = client?.monthly_income || 0;
    // monthlyPayment is already calculated correctly, no conversion needed
    const dtiRatio = monthlyIncome > 0 ? (monthlyPayment / monthlyIncome) * 100 : 0;
    
    // Calculate remaining months using maturity date
    const maturityDate = new Date(loan.maturity_date);
    const remainingMonths = Math.max(0, Math.ceil((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    // Calculate next payment due (first payment is typically 1 month after disbursement)
    const disbursementDate = new Date(loan.disbursement_date);
    const firstPaymentDue = new Date(disbursementDate);
    firstPaymentDue.setMonth(firstPaymentDue.getMonth() + 1);
    const nextPaymentDue = firstPaymentDue > today ? firstPaymentDue.toISOString().split('T')[0] : 'N/A';
    
    // Calculate total amount paid
    const totalPaid = (loan.principal_paid || 0) + (loan.interest_paid || 0) + (loan.management_fee_paid || 0);
    
    // Calculate management fee amount if not provided
    const managementFeeAmount = loan.management_fee_amount || 
      (loan.principal_amount && loan.management_fee_rate ? 
        (loan.principal_amount * loan.management_fee_rate / 100) : 0);

    return {
      id: loan.loan_application_id,
      applicationId: loan.application_id || `LA-${loan.loan_application_id.slice(-8)}`,
      clientId: loan.client_id,
      clientName: client?.full_name || `${client?.first_name || ''} ${client?.last_name || ''}`.trim() || 'Unknown Client',
      clientPhone: client?.phone_number || '',
      clientEmail: client?.email_address || '',
      clientType: client?.client_type || 'N/A',
      clientAddress: `${client?.house_number || ''} ${client?.street_name || ''}, ${client?.area_of_residence || ''}`.trim() || 'N/A',
      loanPurpose: loan.loan_applications?.loan_purpose || 'N/A',
      monthlyIncome: monthlyIncome,
      originalAmount: parseFloat(loan.principal_amount) || 0, // Amounts are already in correct currency units
      loanAmount: parseFloat(loan.loan_amount) || 0,
      disbursedAmount: parseFloat(loan.disbursed_amount) || 0,
      outstandingBalance: parseFloat(loan.current_balance) || 0, // Use current_balance, amounts already in correct units
      outstandingBalanceField: parseFloat(loan.outstanding_balance) || 0,
      interestRate: parseFloat(loan.interest_rate) || 0,
      effectiveAnnualRate: loan.effective_annual_rate || 0,
      tenorMonths: loan.tenor_months || 0,
      termMonths: loan.term_months || 0,
      repaymentFrequency: loan.repayment_frequency || loan.payment_frequency || 'monthly',
      monthlyPayment: monthlyPayment,
      totalRepaymentAmount: parseFloat(loan.total_repayment_amount) || 0,
      principalPaid: parseFloat(loan.principal_paid) || 0,
      interestPaid: parseFloat(loan.interest_paid) || 0,
      managementFeePaid: parseFloat(loan.management_fee_paid) || 0,
      totalPaid: totalPaid,
      managementFeeRate: loan.management_fee_rate || 0,
      managementFeeAmount: managementFeeAmount,
      upfrontFeesDeducted: loan.upfront_fees_deducted || false,
      upfrontFeesAmount: parseFloat(loan.upfront_fees_amount) || 0,
      disbursementDate: loan.disbursement_date,
      maturityDate: loan.maturity_date,
      firstPaymentDue: loan.first_payment_due || 'N/A',
      lastPaymentDate: loan.last_payment_date || 'N/A',
      nextPaymentDue: nextPaymentDue,
      status: loan.status || 'active',
      daysPastDue: loan.days_past_due || daysPastDue,
      paymentHistoryPercentage: Math.round(paymentHistoryPercentage),
      dtiRatio: Math.round(dtiRatio),
      remainingMonths: remainingMonths,
      riskRating: loan.risk_rating || 'low',
      disbursementMethod: loan.disbursement_method || 'N/A',
      disbursementReference: loan.disbursement_reference || 'N/A',
      disbursementChannel: loan.disbursement_channel || 'N/A',
      paymentHistory: loan.payment_history || [],
      latePaymentsCount: loan.late_payments_count || 0,
      onTimePaymentsCount: loan.on_time_payments_count || 0,
      consecutiveLatePayments: loan.consecutive_late_payments || 0,
      createdAt: loan.created_at || 'N/A',
      updatedAt: loan.updated_at || 'N/A',
      // Legacy fields for compatibility
      collateralValue: 0, // Not stored in loans table
      guarantorName: '', // Not stored in loans table
      guarantorPhone: '', // Not stored in loans table
      // Add raw loan data for detailed view
      rawLoanData: loan
    };
  }) || [];

  // Check top-up eligibility for each loan
  const loansWithEligibility = transformedLoans.map(loan => {
    const eligibility = checkTopUpEligibility(loan);
    console.log('🔍 Checking eligibility for loan:', loan.applicationId, eligibility);
    return {
      ...loan,
      topUpEligibility: eligibility
    };
  });

  // Filter loans based on search and filters
  const filteredLoans = loansWithEligibility.filter(loan => {
    const matchesSearch = loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.clientPhone.includes(searchTerm) ||
                         loan.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
    
    const matchesEligibility = filterEligibility === 'all' || 
      (filterEligibility === 'eligible' && loan.topUpEligibility.isEligible) ||
      (filterEligibility === 'review' && !loan.topUpEligibility.isEligible && loan.topUpEligibility.eligibilityCriteria.daysOverdue.passed) ||
      (filterEligibility === 'not_eligible' && !loan.topUpEligibility.isEligible && !loan.topUpEligibility.eligibilityCriteria.daysOverdue.passed);
    
    
    return matchesSearch && matchesStatus && matchesEligibility;
  });

  // Interest earning calculation functions
  const calculateInterestEarnings = (loans: any[], timePeriod: 'week' | 'month' | 'quarter') => {
    const today = new Date();
    let targetDate = new Date();
    
    switch (timePeriod) {
      case 'week':
        targetDate.setDate(today.getDate() + 7);
        break;
      case 'month':
        targetDate.setMonth(today.getMonth() + 1);
        break;
      case 'quarter':
        targetDate.setMonth(today.getMonth() + 3);
        break;
    }

    return loans.reduce((total, loan) => {
      if (loan.status !== 'active') return total;
      
      // Calculate PAR (Portfolio at Risk) based on days past due
      const daysPastDue = loan.daysPastDue || 0;
      let parFactor = 1; // Default to 100% collection
      
      // PAR analysis: reduce collection probability based on days overdue
      if (daysPastDue > 90) {
        parFactor = 0.3; // 30% collection probability for >90 days overdue
      } else if (daysPastDue > 30) {
        parFactor = 0.6; // 60% collection probability for 31-90 days overdue
      } else if (daysPastDue > 7) {
        parFactor = 0.8; // 80% collection probability for 8-30 days overdue
      } else if (daysPastDue > 0) {
        parFactor = 0.9; // 90% collection probability for 1-7 days overdue
      }

      // Calculate expected interest earnings based on outstanding balance and interest rate
      const outstandingBalance = loan.outstandingBalance || 0;
      const interestRate = loan.interestRate || 0;
      
      // Calculate time factor based on period
      let timeFactor = 1;
      switch (timePeriod) {
        case 'week':
          timeFactor = 7 / 30; // 7 days out of 30
          break;
        case 'month':
          timeFactor = 1; // 1 month
          break;
        case 'quarter':
          timeFactor = 3; // 3 months
          break;
      }

      // Calculate expected interest earnings
      const monthlyInterestRate = interestRate / 12 / 100;
      const expectedInterest = outstandingBalance * monthlyInterestRate * timeFactor;
      
      // Apply PAR factor for predictive analysis
      const predictedInterest = expectedInterest * parFactor;
      
      return total + predictedInterest;
    }, 0);
  };

  // Calculate interest earnings for different periods
  const interestEarningsNextMonth = calculateInterestEarnings(filteredLoans, 'month');
  const interestEarningsNextQuarter = calculateInterestEarnings(filteredLoans, 'quarter');

  // Calculate PAR metrics for analysis
  const parAnalysis = {
    par30: filteredLoans.filter(loan => (loan.daysPastDue || 0) > 30).length / Math.max(filteredLoans.length, 1) * 100,
    par60: filteredLoans.filter(loan => (loan.daysPastDue || 0) > 60).length / Math.max(filteredLoans.length, 1) * 100,
    par90: filteredLoans.filter(loan => (loan.daysPastDue || 0) > 90).length / Math.max(filteredLoans.length, 1) * 100,
  };

  // Debug logging
  useEffect(() => {
    console.log('🔍 Loan Monitoring Debug:');
    console.log('Loans Data:', loans);
    console.log('Combined Loading:', combinedLoading);
    console.log('Combined Error:', combinedError);
    console.log('Number of loans:', loans?.length || 0);
    console.log('Existing Loans Data:', existingLoans);
    console.log('Existing Loans Loading:', existingLoansLoading);
    console.log('Number of existing loans:', existingLoans?.length || 0);
    console.log('Repayment Schedules Data:', repaymentSchedules);
    console.log('Schedules Loading:', schedulesLoading);
    console.log('Number of schedule entries:', repaymentSchedules?.length || 0);
    console.log('Transformed Loans:', transformedLoans);
    console.log('Number of transformed loans:', transformedLoans?.length || 0);
    console.log('Filtered Loans:', filteredLoans);
    console.log('Number of filtered loans:', filteredLoans?.length || 0);
    
    // Debug specific loan LA-1760439557884
    const specificLoan = transformedLoans?.find(loan => loan.applicationId === 'LA-1760439557884');
    if (specificLoan) {
      console.log('🎯 Specific Loan LA-1760439557884 Debug:');
      console.log('- Loan Data:', specificLoan);
      console.log('- Top-Up Eligibility:', specificLoan.topUpEligibility);
      console.log('- Is Eligible:', specificLoan.topUpEligibility?.isEligible);
      console.log('- Reason:', specificLoan.topUpEligibility?.reason);
      console.log('- Max Top-Up Amount:', specificLoan.topUpEligibility?.maxTopUpAmount);
    } else {
      console.log('❌ Loan LA-1760439557884 not found in transformed loans');
    }
  }, [loans, combinedLoading, combinedError, existingLoans, existingLoansLoading, repaymentSchedules, schedulesLoading, transformedLoans, filteredLoans]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force a page reload to get fresh data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncDisbursedLoans = async () => {
    console.log('🔄 Syncing all disbursed loans to monitoring table...');
    
    try {
      const result = await LoanSyncService.syncDisbursedLoansToMonitoring();
      
      if (result.success) {
        if (result.synced > 0) {
          alert(`✅ Successfully synced ${result.synced} disbursed loans to monitoring table!`);
          // Refresh the page to show the new loans
          window.location.reload();
        } else {
          alert('ℹ️ All disbursed loans are already synced to monitoring table.');
        }
      } else {
        alert(`❌ Error syncing loans: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error syncing disbursed loans:', error);
      alert('Error syncing disbursed loans: ' + error.message);
    }
  };

  const handleTopUpRequest = (loan: LoanData) => {
    setSelectedLoan(loan);
    setTopUpEligibility(checkTopUpEligibility(loan));
    setShowTopUpDialog(true);
  };

  const handleViewLoan = (loan: LoanData) => {
    setSelectedLoan(loan);
    setShowViewModal(true);
  };

  // Get stored repayment schedule for a loan (original approved schedule)
  const getStoredRepaymentSchedule = (loan: LoanData) => {
    console.log('📋 Fetching stored repayment schedule for loan:', loan.id);
    
    // Get all schedule entries for this loan application
    const scheduleEntries = repaymentSchedules?.filter((schedule: any) => 
      schedule.loan_application_id === loan.id
    ) || [];
    
    if (scheduleEntries.length === 0) {
      console.log('⚠️ No stored repayment schedule found for loan:', loan.id);
      console.log('⚠️ This means the loan may not have been properly disbursed or the schedule was not created');
      return [];
    }
    
    console.log('📊 Found', scheduleEntries.length, 'schedule entries for loan:', loan.id);
    
    // Transform to match the expected format
    const transformedSchedule = scheduleEntries.map((entry: any) => ({
      paymentNumber: entry.payment_number,
      dueDate: entry.due_date,
      principalPortion: parseFloat(entry.principal_portion) || 0,
      interestPortion: parseFloat(entry.interest_portion) || 0,
      managementFeePortion: parseFloat(entry.management_fee_portion) || 0,
      totalPayment: parseFloat(entry.total_payment) || 0,
      remainingBalance: parseFloat(entry.remaining_balance) || 0,
      isPaid: entry.is_paid || false,
      paymentDate: entry.payment_date
    }));
    
    console.log('✅ Transformed schedule:', transformedSchedule.length, 'payments');
    return transformedSchedule;
  };

  // Toggle accordion for a specific loan
  const toggleAccordion = (loanId: string) => {
    console.log('🔄 Toggling accordion for loan:', loanId);
    console.log('Current expanded loans:', Array.from(expandedLoans));
    
    const newExpanded = new Set(expandedLoans);
    if (newExpanded.has(loanId)) {
      newExpanded.delete(loanId);
      console.log('📤 Collapsing accordion');
    } else {
      newExpanded.add(loanId);
      console.log('📥 Expanding accordion');
    }
    setExpandedLoans(newExpanded);
    console.log('New expanded loans:', Array.from(newExpanded));
  };

  const exportToPDF = (loan: LoanData) => {
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LOAN DETAILS REPORT', 20, 30);
    
    // Line under title
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Reset font for content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    let yPosition = 50;
    
    // Client Information Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CLIENT INFORMATION', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Name: ${loan.clientName}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Phone: ${loan.clientPhone}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Email: ${loan.clientEmail}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Monthly Income: ${formatCurrency(loan.monthlyIncome)}`, 20, yPosition);
    yPosition += 15;
    
    // Loan Information Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LOAN INFORMATION', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Application ID: ${loan.applicationId}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Status: ${loan.status}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Original Amount: ${formatCurrency(loan.originalAmount)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Outstanding Balance: ${formatCurrency(loan.outstandingBalance)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Interest Rate: ${loan.interestRate}%`, 20, yPosition);
    yPosition += 7;
    doc.text(`Monthly Payment: ${formatCurrency(loan.monthlyPayment)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Remaining Months: ${loan.remainingMonths}`, 20, yPosition);
    yPosition += 15;
    
    // Payment Information Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PAYMENT INFORMATION', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Payment History: ${loan.paymentHistoryPercentage}%`, 20, yPosition);
    yPosition += 7;
    doc.text(`Days Past Due: ${loan.daysPastDue}`, 20, yPosition);
    yPosition += 7;
    doc.text(`DTI Ratio: ${loan.dtiRatio}%`, 20, yPosition);
    yPosition += 15;
    
    // Disbursement Information Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('DISBURSEMENT INFORMATION', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Disbursement Date: ${new Date(loan.disbursementDate).toLocaleDateString()}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Maturity Date: ${new Date(loan.maturityDate).toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;
    
    // Top-Up Eligibility Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TOP-UP ELIGIBILITY', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Eligible: ${loan.topUpEligibility?.isEligible ? 'Yes' : 'No'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Reason: ${loan.topUpEligibility?.reason || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Max Top-Up Amount: ${formatCurrency(loan.topUpEligibility?.maxTopUpAmount || 0)}`, 20, yPosition);
    yPosition += 15;
    
    // Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
    
    // Save the PDF
    doc.save(`loan-${loan.applicationId}-details.pdf`);
  };

  const exportToCSV = (loan: LoanData) => {
    const csvData = [
      ['Field', 'Value'],
      ['Client Name', loan.clientName],
      ['Phone', loan.clientPhone],
      ['Email', loan.clientEmail],
      ['Monthly Income', formatCurrency(loan.monthlyIncome)],
      ['Application ID', loan.applicationId],
      ['Status', loan.status],
      ['Original Amount', formatCurrency(loan.originalAmount)],
      ['Outstanding Balance', formatCurrency(loan.outstandingBalance)],
      ['Interest Rate (%)', loan.interestRate],
      ['Monthly Payment', formatCurrency(loan.monthlyPayment)],
      ['Remaining Months', loan.remainingMonths],
      ['Payment History (%)', loan.paymentHistoryPercentage],
      ['Days Past Due', loan.daysPastDue],
      ['DTI Ratio (%)', loan.dtiRatio],
      ['Disbursement Date', new Date(loan.disbursementDate).toLocaleDateString()],
      ['Maturity Date', new Date(loan.maturityDate).toLocaleDateString()],
      ['Top-Up Eligible', loan.topUpEligibility?.isEligible ? 'Yes' : 'No'],
      ['Top-Up Reason', loan.topUpEligibility?.reason || 'N/A'],
      ['Max Top-Up Amount', formatCurrency(loan.topUpEligibility?.maxTopUpAmount || 0)],
      ['Generated Date', new Date().toLocaleString()]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-${loan.applicationId}-details.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getEligibilityBadge = (eligibility: TopUpEligibility | undefined) => {
    if (!eligibility) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" />
          Not Available
        </span>
      );
    }
    
    if (eligibility.isEligible) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Eligible
        </span>
      );
    } else if (eligibility.eligibilityCriteria.daysOverdue.passed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Review Required
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Not Eligible
        </span>
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'disbursed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (combinedLoading || existingLoansLoading || clientsLoading || repaymentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading loan data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        <div className="space-y-6 p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Target className="w-7 h-7 mr-3 text-white" />
                Loan Monitoring & Portfolio Performance
              </h1>
              <p className="text-blue-100">
                Monitor active loans and manage top-up requests
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleSyncDisbursedLoans}
                className="flex items-center px-4 py-2 bg-green-600 bg-opacity-90 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-100 transition-all duration-200 border border-green-500 border-opacity-30"
                title="Sync all disbursed loans to monitoring table"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Disbursed Loans
              </button>
            </div>
          </div>
        </div>


        {/* Portfolio Summary & Health Block */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Portfolio Summary & Health
            </h2>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Outstanding</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(filteredLoans.reduce((sum, loan) => {
                      const balance = loan.outstandingBalance || 0;
                      return sum + (isNaN(balance) ? 0 : balance);
                    }, 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Loans</p>
                  <p className="text-2xl font-bold text-green-900">
                    {filteredLoans.filter(loan => loan.status === 'active').length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Repayment Rate</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {filteredLoans.length > 0 ? 
                      `${((filteredLoans.filter(loan => loan.status === 'active').length / filteredLoans.length) * 100).toFixed(1)}%` 
                      : '0%'
                    }
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Overdue Amount</p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(filteredLoans.filter(loan => loan.status === 'overdue').reduce((sum, loan) => {
                      const balance = loan.outstandingBalance || 0;
                      return sum + (isNaN(balance) ? 0 : balance);
                    }, 0))}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Best Performing Loan Type</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {(() => {
                      // Analyze loan performance by type
                      const loanTypes = filteredLoans.reduce((acc, loan) => {
                        const type = loan.loanPurpose || 'Other';
                        if (!acc[type]) {
                          acc[type] = { count: 0, totalAmount: 0, avgPerformance: 0 };
                        }
                        acc[type].count++;
                        acc[type].totalAmount += loan.originalAmount || 0;
                        // Calculate performance score based on payment history and DTI
                        const performanceScore = (loan.paymentHistoryPercentage || 100) - (loan.dtiRatio || 0) / 10;
                        acc[type].avgPerformance += performanceScore;
                        return acc;
                      }, {} as Record<string, { count: number; totalAmount: number; avgPerformance: number }>);
                      
                      // Find the best performing type
                      let bestType = 'N/A';
                      let bestScore = -Infinity;
                      
                      Object.entries(loanTypes).forEach(([type, data]) => {
                        const avgScore = (data as { avgPerformance: number; count: number }).avgPerformance / (data as { avgPerformance: number; count: number }).count;
                        if (avgScore > bestScore) {
                          bestScore = avgScore;
                          bestType = type;
                        }
                      });
                      
                      return bestType.length > 12 ? bestType.substring(0, 12) + '...' : bestType;
                    })()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Interest Earnings Predictions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Expected Interest Earnings (Based on PAR Analysis)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-teal-600">End of Month</p>
                    <p className="text-2xl font-bold text-teal-900">
                      {formatCurrency(interestEarningsNextMonth)}
                    </p>
                    <p className="text-xs text-teal-700">
                      {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-teal-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-lg p-4 border border-cyan-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-cyan-600">Quarter Ending</p>
                    <p className="text-2xl font-bold text-cyan-900">
                      {formatCurrency(interestEarningsNextQuarter)}
                    </p>
                    <p className="text-xs text-cyan-700">
                      {(() => {
                        const now = new Date();
                        const currentMonth = now.getMonth(); // 0-11
                        const currentYear = now.getFullYear();
                        
                        // Calculate quarter end dates
                        let quarterEndMonth, quarterEndYear;
                        
                        if (currentMonth >= 0 && currentMonth <= 2) {
                          // Q1: Jan-Mar, ends March 31
                          quarterEndMonth = 2; // March (0-indexed)
                          quarterEndYear = currentYear;
                        } else if (currentMonth >= 3 && currentMonth <= 5) {
                          // Q2: Apr-Jun, ends June 30
                          quarterEndMonth = 5; // June (0-indexed)
                          quarterEndYear = currentYear;
                        } else if (currentMonth >= 6 && currentMonth <= 8) {
                          // Q3: Jul-Sep, ends September 30
                          quarterEndMonth = 8; // September (0-indexed)
                          quarterEndYear = currentYear;
                        } else {
                          // Q4: Oct-Dec, ends December 31
                          quarterEndMonth = 11; // December (0-indexed)
                          quarterEndYear = currentYear;
                        }
                        
                        // Get the last day of the quarter
                        const quarterEndDate = new Date(quarterEndYear, quarterEndMonth + 1, 0);
                        return quarterEndDate.toLocaleDateString('en-GB');
                      })()}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-cyan-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Loan Status Breakdown Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                Loan Status Breakdown
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'On-time', value: filteredLoans.filter(loan => loan.status === 'active').length, color: '#10B981' },
                        { name: 'Late (1-30 days)', value: filteredLoans.filter(loan => loan.status === 'overdue').length, color: '#F59E0B' },
                        { name: 'Non-performing (31-90 days)', value: 0, color: '#EF4444' },
                        { name: 'In default (>90 days)', value: 0, color: '#DC2626' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => {
                        if (value === 0) return null; // Don't show labels for zero values
                        return `${name}: ${((percent as number) * 100).toFixed(0)}%`;
                      }}
                      outerRadius={100}
                      innerRadius={20}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'On-time', value: filteredLoans.filter(loan => loan.status === 'active').length, color: '#10B981' },
                        { name: 'Late (1-30 days)', value: filteredLoans.filter(loan => loan.status === 'overdue').length, color: '#F59E0B' },
                        { name: 'Non-performing (31-90 days)', value: 0, color: '#EF4444' },
                        { name: 'In default (>90 days)', value: 0, color: '#DC2626' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label) => `Status: ${label}`}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '12px'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Portfolio Health Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Portfolio Quality</span>
                  <span className="text-sm font-semibold text-green-600">Good</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Risk Level</span>
                  <span className="text-sm font-semibold text-yellow-600">Medium</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Collection Efficiency</span>
                  <span className="text-sm font-semibold text-blue-600">85%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Average Loan Size</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {filteredLoans.length > 0 ? formatCurrency(filteredLoans.reduce((sum, loan) => sum + (loan.originalAmount || 0), 0) / filteredLoans.length) : 'TZS 0'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-sm font-medium text-amber-700">PAR 30 Analysis</span>
                  <span className={`text-sm font-semibold ${parAnalysis.par30 < 5 ? 'text-green-600' : parAnalysis.par30 < 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {parAnalysis.par30.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-sm font-medium text-orange-700">PAR 60 Analysis</span>
                  <span className={`text-sm font-semibold ${parAnalysis.par60 < 3 ? 'text-green-600' : parAnalysis.par60 < 7 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {parAnalysis.par60.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-sm font-medium text-red-700">PAR 90 Analysis</span>
                  <span className={`text-sm font-semibold ${parAnalysis.par90 < 2 ? 'text-green-600' : parAnalysis.par90 < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {parAnalysis.par90.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by client name, phone, or loan ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="disbursed">Disbursed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Top-Up Eligibility</label>
              <select
                value={filterEligibility}
                onChange={(e) => setFilterEligibility(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Eligibility</option>
                <option value="eligible">Eligible</option>
                <option value="review">Review Required</option>
                <option value="not_eligible">Not Eligible</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                {filteredLoans.length} of {loans.length} loans
              </div>
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Top-Up Eligibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLoans.map((loan) => (
                  <React.Fragment key={loan.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                            <div className="text-sm text-gray-500">{loan.clientPhone}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-blue-600">
                          {loan.applicationId}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(isNaN(loan.originalAmount) ? 0 : loan.originalAmount)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(isNaN(loan.outstandingBalance) ? 0 : loan.outstandingBalance)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                          {loan.status}
                        </span>
                        {loan.daysPastDue > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            {loan.daysPastDue} days overdue
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEligibilityBadge(loan.topUpEligibility)}
                        {loan.topUpEligibility.isEligible && (
                          <div className="text-xs text-gray-500 mt-1">
                            Max: {formatCurrency(loan.topUpEligibility.maxTopUpAmount)}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Monthly: {formatCurrency(isNaN(loan.monthlyPayment) ? 0 : loan.monthlyPayment)}</div>
                          <div>Remaining: {isNaN(loan.remainingMonths) ? 0 : loan.remainingMonths} months</div>
                          <div className="text-xs text-gray-500">
                            DTI: {isNaN(loan.dtiRatio) ? 0 : loan.dtiRatio}% | History: {isNaN(loan.paymentHistoryPercentage) ? 0 : loan.paymentHistoryPercentage}%
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewLoan(loan)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {loan.topUpEligibility.isEligible && (
                            <button
                              onClick={() => handleTopUpRequest(loan)}
                              className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                              title="Request Top-Up"
                            >
                              <ZapIcon className="w-3 h-3 mr-1" />
                              Top-Up
                            </button>
                          )}
                          
                          <div className="relative">
                            <button
                              onClick={() => setShowExportDropdown(showExportDropdown === loan.id ? null : loan.id)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="Export Details"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            
                            {showExportDropdown === loan.id && (
                              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-50 border border-gray-200 overflow-hidden">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      exportToPDF(loan);
                                      setShowExportDropdown(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Export as PDF
                                  </button>
                                  <button
                                    onClick={() => {
                                      exportToCSV(loan);
                                      setShowExportDropdown(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Export as CSV
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Repayment Schedule Accordion Row */}
                    <tr>
                      <td colSpan={8} className="px-0 py-0">
                        <RepaymentScheduleTable
                          schedule={getStoredRepaymentSchedule(loan)}
                          isExpanded={expandedLoans.has(loan.id)}
                          onToggle={() => toggleAccordion(loan.id)}
                          loanId={loan.id}
                        />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
                {filteredLoans.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Loans Found</h3>
                        <p className="text-gray-600 mb-6 max-w-md">
                          There are currently no active loans in the system. Once loan applications are approved and disbursed, 
                          they will appear here for monitoring.
                        </p>
                        <div className="flex space-x-4">
                          <button
                            onClick={handleRefresh}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                          </button>
                          <button
                            onClick={handleSyncDisbursedLoans}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
                            title="Sync all disbursed loans to monitoring table"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sync Disbursed Loans
                          </button>
                          <button
                            onClick={() => window.location.href = '/staff/loan-applications'}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                          >
                            View Loan Applications
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overdue Loans & Alert Block */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Overdue Loans & Alert Management
            </h2>
            <div className="text-sm text-gray-500">
              Real-time monitoring of overdue loans
            </div>
          </div>

          {/* Priority Alerts */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ZapIcon className="w-5 h-5 mr-2 text-yellow-600" />
              Priority Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLoans.filter(loan => loan.status === 'overdue').length > 0 ? (
                filteredLoans.filter(loan => loan.status === 'overdue').map((loan) => {
                  // Simple risk scoring algorithm based on days overdue and amount
                  const daysOverdue = Math.floor((new Date().getTime() - new Date(loan.disbursementDate || new Date()).getTime()) / (1000 * 60 * 60 * 24));
                  const riskScore = Math.min(100, (daysOverdue * 2) + (loan.outstandingBalance / 1000000));
                  
                  return (
                    <div key={loan.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-800">High Risk Alert</span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Score: {riskScore.toFixed(0)}
                        </span>
                      </div>
                      <div className="text-sm text-red-700">
                        <p className="font-medium">{loan.clientName}</p>
                        <p className="text-xs">Loan ID: {loan.applicationId}</p>
                        <p className="text-xs">Amount: {formatCurrency(loan.outstandingBalance)}</p>
                        <p className="text-xs">Days Overdue: {daysOverdue}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">No Overdue Loans</p>
                  <p className="text-green-600 text-sm">All loans are performing well</p>
                </div>
              )}
            </div>
          </div>

          {/* Overdue Loans Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-600" />
              Overdue Loans Detail
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Overdue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overdue Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Outstanding
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.filter(loan => loan.status === 'overdue').length > 0 ? (
                    loans.filter(loan => loan.status === 'overdue').map((loan) => {
                      const daysOverdue = Math.floor((new Date().getTime() - new Date(loan.disbursementDate || new Date()).getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                  <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                                <div className="text-sm text-gray-500">{loan.phoneNumber}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {loan.applicationId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              daysOverdue > 90 ? 'bg-red-100 text-red-800' :
                              daysOverdue > 30 ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {daysOverdue} days
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(loan.outstandingBalance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(loan.outstandingBalance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {loan.lastContactDate || 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Phone className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900">
                                <Mail className="w-4 h-4" />
                              </button>
                              <button className="text-purple-600 hover:text-purple-900">
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                          <p className="text-gray-500 text-lg font-medium">No Overdue Loans</p>
                          <p className="text-gray-400 text-sm">All loans are performing well</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Automated Action Triggers */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ZapIcon className="w-5 h-5 mr-2 text-blue-600" />
              Automated Action Triggers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">SMS Alerts</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center justify-between">
                    <span>5 days overdue</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>15 days overdue</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>30 days overdue</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Active</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Email Alerts</h4>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex items-center justify-between">
                    <span>Loan Officer</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Branch Manager</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Risk Manager</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk & Compliance Block */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Risk & Compliance Management
            </h2>
            <div className="text-sm text-gray-500">
              Bank of Tanzania regulatory compliance monitoring
            </div>
          </div>

          {/* Compact Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            
            {/* Overall Risk Rating Card */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-green-900 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Portfolio Risk
                </h3>
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-900">B+</p>
                <p className="text-xs text-green-700">Low to Medium Risk</p>
              </div>
            </div>

            {/* Individual Loan Risk Assessment Card */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Loan Risk Assessment
              </h3>
              <div className="space-y-2">
                {loans.map((loan) => {
                  const daysSinceDisbursement = Math.floor((new Date().getTime() - new Date(loan.disbursementDate || new Date()).getTime()) / (1000 * 60 * 60 * 24));
                  const amountRisk = loan.amount > 100000000 ? 2 : loan.amount > 50000000 ? 1 : 0;
                  const timeRisk = daysSinceDisbursement > 365 ? 2 : daysSinceDisbursement > 180 ? 1 : 0;
                  const totalRisk = amountRisk + timeRisk;
                  
                  let riskRating = 'A';
                  let riskColor = 'green';
                  if (totalRisk >= 3) {
                    riskRating = 'C';
                    riskColor = 'yellow';
                  } else if (totalRisk >= 2) {
                    riskRating = 'B';
                    riskColor = 'blue';
                  }
                  
                  return (
                    <div key={loan.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{loan.clientName}</p>
                        <p className="text-xs text-gray-500 truncate">{loan.applicationId}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        riskColor === 'green' ? 'bg-green-100 text-green-800' :
                        riskColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {riskRating}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Capital Adequacy Card */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Capital Adequacy
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-700">Min Capital (8%)</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-700">Tier 1 (6%)</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-700">Liquidity (100%)</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✓</span>
                </div>
              </div>
            </div>

            {/* Credit Risk Management Card */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Credit Risk
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-700">PAR 30 &lt; 5%</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-700">NPL &lt; 10%</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-700">Provision &gt; 50%</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✓</span>
                </div>
              </div>
            </div>

            {/* Operational Requirements Card */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Operations
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-yellow-700">CDD</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-yellow-700">AML</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-yellow-700">KYC</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✓</span>
                </div>
              </div>
            </div>

            {/* Reporting Requirements Card */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Reporting
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-700">Monthly BOT</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-700">Quarterly</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-700">Annual Audit</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">⏳</span>
                </div>
              </div>
            </div>

            {/* Audit Trail Card */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Audit Trail
              </h3>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-2">Comprehensive Audit Log</p>
                <button className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
                  <Eye className="w-3 h-3 mr-1" />
                  View Trail
                </button>
              </div>
            </div>

            {/* Policy Violations Card */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Policy Monitoring
              </h3>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-xs text-red-700 mb-2">No violations detected</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Clean
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Up Request Dialog */}
        {showTopUpDialog && selectedLoan && (
          <TopUpRequestDialog
            loan={selectedLoan}
            eligibility={topUpEligibility!}
            onClose={() => {
              setShowTopUpDialog(false);
              setSelectedLoan(null);
              setTopUpEligibility(null);
            }}
            onSuccess={() => {
              setShowTopUpDialog(false);
              setSelectedLoan(null);
              setTopUpEligibility(null);
              handleRefresh();
            }}
          />
        )}

        {/* View Loan Details Modal */}
        {showViewModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Loan Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Client Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{selectedLoan.clientName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-medium">{selectedLoan.clientPhone}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{selectedLoan.clientEmail}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Client Type:</span>
                      <span className="ml-2 font-medium">{selectedLoan.clientType}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2 font-medium">{selectedLoan.clientAddress}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly Income:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.monthlyIncome)}</span>
                    </div>
                  </div>
                </div>

                {/* Loan Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Loan Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Application ID:</span>
                      <span className="ml-2 font-mono text-blue-600">{selectedLoan.applicationId}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLoan.status)}`}>
                        {selectedLoan.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Loan Purpose:</span>
                      <span className="ml-2 font-medium">{selectedLoan.loanPurpose}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Risk Rating:</span>
                      <span className="ml-2 font-medium">{selectedLoan.riskRating}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Original Amount:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.originalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Loan Amount:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.loanAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Disbursed Amount:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.disbursedAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Outstanding Balance:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.outstandingBalance)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="ml-2 font-medium">{selectedLoan.interestRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Effective Annual Rate:</span>
                      <span className="ml-2 font-medium">{selectedLoan.effectiveAnnualRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tenor (Months):</span>
                      <span className="ml-2 font-medium">{selectedLoan.tenorMonths}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Term (Months):</span>
                      <span className="ml-2 font-medium">{selectedLoan.termMonths}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Repayment Frequency:</span>
                      <span className="ml-2 font-medium">{selectedLoan.repaymentFrequency}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly Payment:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.monthlyPayment)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Repayment Amount:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.totalRepaymentAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Remaining Months:</span>
                      <span className="ml-2 font-medium">{selectedLoan.remainingMonths}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">DTI Ratio:</span>
                      <span className="ml-2 font-medium">{selectedLoan.dtiRatio}%</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Payment Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Payment History:</span>
                      <span className="ml-2 font-medium">{selectedLoan.paymentHistoryPercentage}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Days Past Due:</span>
                      <span className={`ml-2 font-medium ${selectedLoan.daysPastDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedLoan.daysPastDue}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Principal Paid:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.principalPaid)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Interest Paid:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.interestPaid)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Management Fee Paid:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.managementFeePaid)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Paid:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.totalPaid)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Late Payments Count:</span>
                      <span className="ml-2 font-medium">{selectedLoan.latePaymentsCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">On-Time Payments Count:</span>
                      <span className="ml-2 font-medium">{selectedLoan.onTimePaymentsCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Consecutive Late Payments:</span>
                      <span className="ml-2 font-medium">{selectedLoan.consecutiveLatePayments}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">First Payment Due:</span>
                      <span className="ml-2 font-medium">{selectedLoan.firstPaymentDue}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Payment Date:</span>
                      <span className="ml-2 font-medium">{selectedLoan.lastPaymentDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Next Payment Due:</span>
                      <span className="ml-2 font-medium">{selectedLoan.nextPaymentDue}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Disbursement Date:</span>
                      <span className="ml-2 font-medium">{new Date(selectedLoan.disbursementDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Maturity Date:</span>
                      <span className="ml-2 font-medium">{new Date(selectedLoan.maturityDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Fees and Charges */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Fees and Charges</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Management Fee Rate:</span>
                      <span className="ml-2 font-medium">{selectedLoan.managementFeeRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Management Fee Amount:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.managementFeeAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Upfront Fees Deducted:</span>
                      <span className="ml-2 font-medium">{selectedLoan.upfrontFeesDeducted ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Upfront Fees Amount:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedLoan.upfrontFeesAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Disbursement Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Disbursement Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Disbursement Method:</span>
                      <span className="ml-2 font-medium">{selectedLoan.disbursementMethod}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Disbursement Reference:</span>
                      <span className="ml-2 font-medium">{selectedLoan.disbursementReference}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Disbursement Channel:</span>
                      <span className="ml-2 font-medium">{selectedLoan.disbursementChannel}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created At:</span>
                      <span className="ml-2 font-medium">{new Date(selectedLoan.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Updated At:</span>
                      <span className="ml-2 font-medium">{new Date(selectedLoan.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Top-Up Eligibility */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Top-Up Eligibility</h4>
                  <div className="flex items-center space-x-2">
                    {getEligibilityBadge(selectedLoan.topUpEligibility)}
                    {selectedLoan.topUpEligibility?.isEligible && (
                      <span className="text-sm text-gray-600">
                        Max: {formatCurrency(selectedLoan.topUpEligibility.maxTopUpAmount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoanMonitoring;
