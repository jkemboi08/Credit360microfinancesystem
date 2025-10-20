import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { supabase } from '../lib/supabaseClient';
import { ApprovalLevelsService } from '../services/approvalLevelsService';
import { CreditAssessmentService, CreditAssessmentData } from '../services/creditAssessmentService';
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  Save,
  Download,
  Calculator,
  BarChart3,
  Target,
  Users,
  FileCheck,
  Upload,
  DollarSign,
  Clock,
  Eye
} from 'lucide-react';
import { ContractService, ContractData } from '../services/contractService';
import ContractUploadModal from '../components/ContractUploadModal';
import LoanProcessingProgress from '../components/LoanProcessingProgress';
import { LoanWorkflowService } from '../services/loanWorkflowService';
import { LoanWorkflowControls, WorkflowState } from '../services/loanWorkflowControls';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { roundAmount } from '../utils/roundingUtils';

interface RepaymentScheduleEntry {
  paymentNumber: number;
  dueDate: string;
  principalPortion: number;
  interestPortion: number;
  managementFeePortion: number;
  totalPayment: number;
  remainingBalance: number;
}

const LoanAssessmentPage: React.FC = () => {
  const { loanApplicationId } = useParams<{ loanApplicationId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();

  // Fetch real data from Supabase with joined client data
  const { data: loanApplication, loading: applicationLoading, error: applicationError } = useSupabaseQuery('loan_applications', {
    select: `
      *,
      client:clients!client_id (
        id,
        first_name,
        last_name,
        full_name,
        phone_number,
        email_address,
        street_name,
        house_number,
        area_of_residence,
        company_name,
        kyc_status
      )
    `,
    filter: [{ column: 'id', operator: 'eq', value: loanApplicationId }]
  });
  
  // Extract client data from the joined query
  const client = loanApplication?.[0]?.client;

  // Debug client query
  console.log('Client query debug:', {
    loanApplicationId,
    clientId: loanApplication?.[0]?.client_id,
    clientData: client,
    applicationLoading,
    applicationError,
    hasClientData: !!client,
    clientFirstName: client?.first_name,
    clientLastName: client?.last_name,
    clientFullName: client?.full_name
  });
  
  const { data: loanProducts, loading: productsLoading, error: productsError } = useSupabaseQuery('loan_products', {
    select: '*',
    orderBy: { column: 'name', ascending: true }
  });

  // State management
  const [application, setApplication] = useState<any>(null);
  
  // Loan parameters state
  const [loanParams, setLoanParams] = useState({
    principal_amount: '2500000',
    term_months: '12',
    disbursement_date: new Date().toISOString().split('T')[0],
    interest_rate: '3.5',
    management_fee_rate: '2.0',
    calculation_method: 'reducing_balance' as 'flat_rate' | 'reducing_balance' | 'balloon_structure'
  });

  const [calculatedTotals, setCalculatedTotals] = useState({
    totalInterest: 0,
    totalManagementFee: 0,
    totalRepayment: 0,
    upfrontFeesSum: 0,
    emi: 0
  });

  const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentScheduleEntry[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  
  const [assessmentData, setAssessmentData] = useState({
    creditScore: 720,
    riskGrade: 'A-',
    paymentHistory: 95,
    creditUtilization: 85,
    lengthOfHistory: 70,
    incomeStability: 90,
    debtToIncomeRatio: 35,
    employmentHistory: 3,
    collateralValue: 3000000
  });
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  
  // Enhanced workflow state
  const [committeeApprovalRequired, setCommitteeApprovalRequired] = useState(false);
  const [committeeApprovalStatus, setCommitteeApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | 'not_required'>('not_required');

  // Populate application data from real data
  useEffect(() => {
    console.log('Assessment page useEffect triggered:', {
      loanApplication: loanApplication?.length,
      client: client,
      loanApplicationId
    });
    
    if (loanApplication && loanApplication.length > 0 && client) {
      const app = loanApplication[0];
      const clientData = client;
      
      console.log('Setting application data:', { app, clientData });
      
      setApplication({
        id: app.id,
        clientName: clientData.full_name || 'Unknown Client',
        clientId: app.client_id,
        loanAmount: app.requested_amount || 0,
        product: loanProducts?.find(p => p.id === app.product_id)?.name || 'Unknown Product',
        productId: app.product_id,
        status: app.status || 'Pending',
        submissionDate: app.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        kycStatus: app.kyc_status || 'Pending',
        crbStatus: app.crb_status || 'Pending',
        assessmentScore: app.credit_score || 0,
        riskGrade: app.risk_grade || 'Unknown',
        autoDeclineFlags: app.auto_decline_flags || [],
        paymentHistory: app.payment_history || 0,
        creditUtilization: app.credit_utilization || 0,
        incomeStability: app.income_stability || 0,
        debtToIncomeRatio: app.debt_to_income_ratio || 0,
        termMonths: app.term_months || 12
      });

      // Update loan parameters with real data
      setLoanParams({
        principal_amount: String(app.requested_amount || 0),
        term_months: String(app.term_months || 12),
        disbursement_date: app.disbursement_date || new Date().toISOString().split('T')[0],
        interest_rate: String(app.interest_rate || 3.5),
        management_fee_rate: String(app.management_fee_rate || 2.0),
        calculation_method: app.calculation_method || 'reducing_balance'
      });

      // Load existing assessment data if available
      if (app.assessment_score || app.risk_grade) {
        setAssessmentData({
          creditScore: app.assessment_score || 720,
          riskGrade: app.risk_grade || 'A-',
          paymentHistory: app.payment_history || 95,
          creditUtilization: app.credit_utilization || 85,
          lengthOfHistory: app.length_of_history || 70,
          incomeStability: app.income_stability || 90,
          debtToIncomeRatio: app.debt_to_income_ratio || 35,
          employmentHistory: app.employment_history || 3,
          collateralValue: app.collateral_value || 3000000
        });
      }
    }
  }, [loanApplication, client, loanProducts]);
  const [contractStatus, setContractStatus] = useState<'not_generated' | 'generated' | 'signed' | 'uploaded' | 'approved'>('not_generated');
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [showContractUpload, setShowContractUpload] = useState(false);
  const [finalApprovalStatus, setFinalApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // Progress tracking state
  const [currentStep, setCurrentStep] = useState('assessment');
  const [showProgressSidebar, setShowProgressSidebar] = useState(true);
  
  // Workflow control state
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [recallReason, setRecallReason] = useState('');


  // Combined loading and error states
  const loanLoading = applicationLoading || productsLoading;
  const loanError = applicationError || productsError;

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Using shared rounding utility from utils/roundingUtils.ts

  const calculateLoanTotals = () => {
    const principal = parseFloat(loanParams.principal_amount) || 0;
    const termMonths = parseInt(loanParams.term_months) || 0;
    const monthlyInterestRate = (parseFloat(loanParams.interest_rate) || 0) / 100;
    const monthlyManagementFeeRate = (parseFloat(loanParams.management_fee_rate) || 0) / 100;

    if (principal <= 0 || termMonths <= 0) {
      setCalculatedTotals({
        totalInterest: 0,
        totalManagementFee: 0,
        totalRepayment: 0,
        upfrontFeesSum: 0,
        emi: 0
      });
      setRepaymentSchedule([]);
      return;
    }

    let totalInterest = 0;
    let totalManagementFee = 0;
    let emi = 0;
    const schedule: RepaymentScheduleEntry[] = [];

    if (loanParams.calculation_method === 'flat_rate') {
      // Flat Rate Method
      totalInterest = principal * monthlyInterestRate * termMonths;
      totalManagementFee = principal * monthlyManagementFeeRate * termMonths;
      const totalRepayment = principal + totalInterest + totalManagementFee;
      emi = totalRepayment / termMonths;

      // Generate flat rate schedule
      let remainingBalance = principal;
      const monthlyPrincipal = principal / termMonths;
      const monthlyInterest = totalInterest / termMonths;
      const monthlyManagementFee = totalManagementFee / termMonths;

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(loanParams.disbursement_date);
        dueDate.setMonth(dueDate.getMonth() + i);

        remainingBalance -= monthlyPrincipal;

        schedule.push({
          paymentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          principalPortion: roundAmount(monthlyPrincipal),
          interestPortion: roundAmount(monthlyInterest),
          managementFeePortion: roundAmount(monthlyManagementFee),
          totalPayment: roundAmount(emi),
          remainingBalance: Math.max(0, roundAmount(remainingBalance))
        });
      }
    } else if (loanParams.calculation_method === 'balloon_structure') {
      // Balloon Structure Method
      let remainingBalance = principal;

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(loanParams.disbursement_date);
        dueDate.setMonth(dueDate.getMonth() + i);

        const interestPortion = remainingBalance * monthlyInterestRate;
        const managementFeePortion = remainingBalance * monthlyManagementFeeRate;
        
        let principalPortion = 0;
        let totalPayment = 0;

        if (i < termMonths) {
          // Months 1 to 11: Small payments (fees + interest only)
          principalPortion = 0;
          totalPayment = interestPortion + managementFeePortion;
        } else {
          // Month 12: Large balloon payment (principal + final interest + fees)
          principalPortion = remainingBalance;
          totalPayment = remainingBalance + interestPortion + managementFeePortion;
        }

        remainingBalance -= principalPortion;
        totalInterest += interestPortion;
        totalManagementFee += managementFeePortion;

        schedule.push({
          paymentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          principalPortion: roundAmount(principalPortion),
          interestPortion: roundAmount(interestPortion),
          managementFeePortion: roundAmount(managementFeePortion),
          totalPayment: roundAmount(totalPayment),
          remainingBalance: Math.max(0, roundAmount(remainingBalance))
        });
      }

      // Calculate average monthly payment for display
      const totalPayments = schedule.reduce((sum, entry) => sum + entry.totalPayment, 0);
      emi = totalPayments / termMonths;
    } else {
      // Default: Reducing Balance Method (PMT Formula)
      const combinedRate = monthlyInterestRate + monthlyManagementFeeRate;
      
      if (combinedRate > 0) {
        emi = (principal * combinedRate * Math.pow(1 + combinedRate, termMonths)) / 
              (Math.pow(1 + combinedRate, termMonths) - 1);
      } else {
        emi = principal / termMonths;
      }

      // Generate reducing balance schedule
      let remainingBalance = principal;
      let totalPrincipalPaid = 0;

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(loanParams.disbursement_date);
        dueDate.setMonth(dueDate.getMonth() + i);

        const interestPortion = remainingBalance * monthlyInterestRate;
        const managementFeePortion = remainingBalance * monthlyManagementFeeRate;
        let principalPortion = emi - interestPortion - managementFeePortion;

        // For the last payment, ensure the remaining balance is exactly 0
        if (i === termMonths) {
          principalPortion = remainingBalance;
        }

        remainingBalance -= principalPortion;
        totalPrincipalPaid += principalPortion;
        totalInterest += interestPortion;
        totalManagementFee += managementFeePortion;

        schedule.push({
          paymentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          principalPortion: roundAmount(principalPortion),
          interestPortion: roundAmount(interestPortion),
          managementFeePortion: roundAmount(managementFeePortion),
          totalPayment: roundAmount(emi),
          remainingBalance: Math.max(0, roundAmount(remainingBalance))
        });
      }
    }

    const totalRepayment = principal + totalInterest + totalManagementFee;

    setCalculatedTotals({
      totalInterest,
      totalManagementFee,
      totalRepayment,
      upfrontFeesSum: 0,
      emi
    });

    setRepaymentSchedule(schedule);
  };

  const handleParamChange = (field: string, value: any) => {
    setLoanParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Note: Application data initialization is now handled by the database data loading useEffect above

  // Auto-populate loan parameters when product is found
  useEffect(() => {
    if (application?.productId && loanProducts) {
      const product = loanProducts.find((p: any) => p.id === application?.productId);
      if (product) {
        setLoanParams(prev => ({
          ...prev,
          interest_rate: product.interest_rate?.toString() || '',
          management_fee_rate: product.management_fee_rate?.toString() || ''
        }));
      }
    }
  }, [application?.productId, loanProducts]);

  // Recalculate totals and schedule when parameters change
  useEffect(() => {
    if (loanParams.principal_amount && loanParams.term_months && loanParams.interest_rate) {
      calculateLoanTotals();
    }
  }, [
    loanParams.principal_amount,
    loanParams.term_months,
    loanParams.interest_rate,
    loanParams.management_fee_rate,
    loanParams.calculation_method,
    loanParams.disbursement_date
  ]);

  const validateForm = () => {
    const principal = parseFloat(loanParams.principal_amount) || 0;
    const interestRate = parseFloat(loanParams.interest_rate) || 0;
    const managementFeeRate = parseFloat(loanParams.management_fee_rate) || 0;

    if (principal <= 0) {
      alert('Principal amount must be greater than 0');
      return false;
    }

    if (interestRate < 0 || interestRate > 100) {
      alert('Interest rate must be between 0% and 100%');
      return false;
    }

    if (managementFeeRate < 0 || managementFeeRate > 100) {
      alert('Management fee rate must be between 0% and 100%');
      return false;
    }

    // Tanzania regulatory compliance check
    if (interestRate > 30) {
      alert('Interest rate exceeds regulatory limit of 30% monthly');
      return false;
    }

    return true;
  };

  const handleSaveAssessment = async () => {
    if (!validateForm()) return;
    
    if (!loanApplicationId || !user) {
      alert('Missing required data for saving assessment');
      return;
    }

    try {
      // Prepare assessment data
      const assessmentDataToSave: CreditAssessmentData = {
        creditScore: assessmentData.creditScore,
        riskGrade: assessmentData.riskGrade,
        assessmentScore: assessmentData.creditScore,
        paymentHistory: assessmentData.paymentHistory,
        creditUtilization: assessmentData.creditUtilization,
        incomeStability: assessmentData.incomeStability,
        debtToIncomeRatio: assessmentData.debtToIncomeRatio,
        employmentHistory: assessmentData.employmentHistory,
        collateralValue: assessmentData.collateralValue,
        interestRate: parseFloat(loanParams.interest_rate),
        managementFeeRate: parseFloat(loanParams.management_fee_rate),
        calculationMethod: loanParams.calculation_method,
        approvedAmount: parseFloat(loanParams.principal_amount),
        approvedTenor: parseInt(loanParams.term_months),
        disbursementDate: loanParams.disbursement_date,
        decision: decision,
        comments: comments,
        committeeReferralReason: decision === 'refer_committee' ? comments : undefined
      };

      // Save complete assessment data using the service
      await CreditAssessmentService.saveAssessment(loanApplicationId, assessmentDataToSave, user.id);

      // Also update the loan_applications table with basic info
      const { error: updateError } = await supabase
        .from('loan_applications')
        .update({
          assessment_score: assessmentData.creditScore,
          risk_grade: assessmentData.riskGrade,
          interest_rate: parseFloat(loanParams.interest_rate),
          management_fee_rate: parseFloat(loanParams.management_fee_rate),
          calculation_method: loanParams.calculation_method,
          disbursement_date: loanParams.disbursement_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanApplicationId);

      if (updateError) {
        console.error('❌ Failed to update loan application:', updateError);
        // Don't fail the whole operation, just log the error
      }

      console.log('✅ Assessment data saved successfully');
      alert(`Assessment saved successfully for ${application?.clientName}`);
      
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert(`Error saving assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Determine if committee approval is required
  useEffect(() => {
    const checkCommitteeRequirement = async () => {
      const loanAmount = parseFloat(loanParams.principal_amount) || 0;
      
      try {
        // Use the proper approval levels service to determine committee requirement
        const isCommitteeRequired = await ApprovalLevelsService.isCommitteeApprovalRequired(loanAmount);
        
        if (isCommitteeRequired && (decision === 'approve' || decision === 'approve_modified')) {
          setCommitteeApprovalRequired(true);
          setCommitteeApprovalStatus('pending');
        } else {
          setCommitteeApprovalRequired(false);
          setCommitteeApprovalStatus('not_required');
        }
      } catch (error) {
        console.error('Error checking committee approval requirement:', error);
        // Fallback to false if there's an error
        setCommitteeApprovalRequired(false);
        setCommitteeApprovalStatus('not_required');
      }
    };
    
    checkCommitteeRequirement();
  }, [decision, loanParams.principal_amount]);

  // Check workflow state and submission eligibility
  useEffect(() => {
    const checkWorkflowState = async () => {
      if (!loanApplicationId || !user) return;
      
      try {
        const state = await LoanWorkflowControls.getWorkflowState(loanApplicationId);
        setWorkflowState(state);
        
        if (state) {
          const { canSubmit: canSubmitToNext, reason } = await LoanWorkflowControls.canSubmitToNextStage(
            loanApplicationId,
            'contract_generation',
            user.id
          );
          
          setCanSubmit(canSubmitToNext);
          setSubmitMessage(reason || '');
        }
      } catch (error) {
        console.error('Error checking workflow state:', error);
      }
    };
    
    checkWorkflowState();
  }, [loanApplicationId, user, decision]);

  // Update application state when loan application data is loaded
  useEffect(() => {
    if (loanApplication && loanApplication.length > 0) {
      const app = loanApplication[0];
      const clientData = app.client;
      
      setApplication({
        id: app.id,
        clientName: clientData ? 
          (clientData.full_name || 
           `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || 
           'Unknown Client') : 
          'Unknown Client',
        clientId: clientData?.id || 'N/A',
        loanAmount: parseFloat(app.requested_amount) || 0,
        product: app.product_name || 'SME Loan',
        productId: app.product_id || '1',
        status: app.status || 'Validated',
        submissionDate: app.created_at ? new Date(app.created_at).toISOString().split('T')[0] : '2025-01-08',
        kycStatus: clientData?.kyc_status || 'Verified',
        crbStatus: 'Completed',
        assessmentScore: app.assessment_score || 720,
        riskGrade: app.risk_grade || 'A-',
        autoDeclineFlags: [],
        paymentHistory: 95,
        creditUtilization: 85,
        incomeStability: 90,
        debtToIncomeRatio: 35,
        termMonths: parseInt(app.repayment_period_months) || 12
      });

      // Update loan parameters
      setLoanParams({
        principal_amount: app.requested_amount?.toString() || '2500000',
        term_months: app.repayment_period_months?.toString() || '12',
        disbursement_date: app.disbursement_date || new Date().toISOString().split('T')[0],
        interest_rate: app.interest_rate?.toString() || '3.5',
        management_fee_rate: app.management_fee_rate?.toString() || '2.0',
        calculation_method: (app.calculation_method as any) || 'reducing_balance'
      });

      // 🎯 DYNAMIC ASSESSMENT DATA CALCULATION
      const loanAmount = parseFloat(app.requested_amount) || 0;
      const monthlyIncome = 0; // Income data not available in current schema
      const collateralValue = parseFloat(app.collateral_current_value) || 0;
      
      // Calculate debt-to-income ratio
      const debtToIncomeRatio = monthlyIncome > 0 ? Math.round((loanAmount / (monthlyIncome * 12)) * 100) : 0;
      
      // Calculate employment history (years)
      const employmentStartDate = app.employment_start_date;
      const employmentHistory = employmentStartDate ? 
        Math.max(0, new Date().getFullYear() - new Date(employmentStartDate).getFullYear()) : 0;
      
      // Calculate credit score based on real data
      let creditScore = 300; // Base score
      
      // Income factor (0-200 points)
      if (monthlyIncome > 1000000) creditScore += 200;
      else if (monthlyIncome > 500000) creditScore += 150;
      else if (monthlyIncome > 200000) creditScore += 100;
      else if (monthlyIncome > 100000) creditScore += 50;
      
      // Employment stability (0-100 points)
      if (employmentHistory > 5) creditScore += 100;
      else if (employmentHistory > 3) creditScore += 75;
      else if (employmentHistory > 1) creditScore += 50;
      else if (employmentHistory > 0) creditScore += 25;
      
      // Debt-to-income ratio (0-100 points)
      if (debtToIncomeRatio < 20) creditScore += 100;
      else if (debtToIncomeRatio < 30) creditScore += 75;
      else if (debtToIncomeRatio < 40) creditScore += 50;
      else if (debtToIncomeRatio < 50) creditScore += 25;
      
      // Collateral factor (0-50 points)
      if (collateralValue > loanAmount * 1.5) creditScore += 50;
      else if (collateralValue > loanAmount) creditScore += 25;
      
      // Previous loan history (0-30 points)
      if (app.previous_loan_taken && app.previous_repayment_date) {
        creditScore += 30;
      } else if (!app.previous_loan_taken) {
        creditScore += 10;
      }
      
      // CRB consent factor (0-20 points)
      if (app.crb_consent_given) creditScore += 20;
      else creditScore -= 10;
      
      // Cap the score between 300-850
      creditScore = Math.min(850, Math.max(300, creditScore));
      
      // Determine risk grade
      let riskGrade = 'High';
      if (creditScore >= 750) riskGrade = 'Low';
      else if (creditScore >= 650) riskGrade = 'Medium';
      
      // Calculate individual metrics
      const paymentHistory = Math.min(100, Math.max(0, creditScore - 600));
      const creditUtilization = Math.min(100, Math.max(0, 100 - debtToIncomeRatio));
      const lengthOfHistory = Math.min(100, employmentHistory * 20);
      const incomeStability = Math.min(100, Math.max(0, (monthlyIncome / 100000) * 10));
      
      // Update assessment data with REAL calculated values
      setAssessmentData({
        creditScore: creditScore,
        riskGrade: riskGrade,
        paymentHistory: Math.round(paymentHistory),
        creditUtilization: Math.round(creditUtilization),
        lengthOfHistory: Math.round(lengthOfHistory),
        incomeStability: Math.round(incomeStability),
        debtToIncomeRatio: debtToIncomeRatio,
        employmentHistory: employmentHistory,
        collateralValue: collateralValue || 0
      });
    }
  }, [loanApplication]);

  // Load existing contracts
  useEffect(() => {
    const loadContracts = async () => {
      if (loanApplicationId) {
        try {
          const existingContracts = await ContractService.getContractsByLoanApplication(loanApplicationId);
          setContracts(existingContracts);
          if (existingContracts.length > 0) {
            const contract = existingContracts[0];
            if (contract.status === 'signed') {
              setContractStatus('uploaded');
            } else if (contract.status === 'generated') {
              setContractStatus('generated');
            }
          }
        } catch (error) {
          console.error('Error loading contracts:', error);
        }
      }
    };
    loadContracts();
  }, [loanApplicationId]);

  const handleApproveLoan = async () => {
    if (!decision) {
      alert('Please select a decision before approving');
      return;
    }
    
    if (!validateForm()) return;
    
    // Only allow approval decisions to proceed
    if (decision !== 'approve' && decision !== 'approve_modified') {
      alert('Only approved loans can proceed to contract generation');
      return;
    }
    
    if (!user) {
      alert('User not authenticated. Please log in again.');
      return;
    }

    // Check if submission is allowed
    if (!canSubmit) {
      alert(`Cannot submit loan: ${submitMessage}`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Approving loan with data:', {
        loanApplicationId,
        userId: user.id,
        decision,
        comments: comments
      });

      // Auto-save complete assessment data before approving
      const assessmentDataToSave: CreditAssessmentData = {
        creditScore: assessmentData.creditScore,
        riskGrade: assessmentData.riskGrade,
        assessmentScore: assessmentData.creditScore,
        paymentHistory: assessmentData.paymentHistory,
        creditUtilization: assessmentData.creditUtilization,
        incomeStability: assessmentData.incomeStability,
        debtToIncomeRatio: assessmentData.debtToIncomeRatio,
        employmentHistory: assessmentData.employmentHistory,
        collateralValue: assessmentData.collateralValue,
        interestRate: parseFloat(loanParams.interest_rate),
        managementFeeRate: parseFloat(loanParams.management_fee_rate),
        calculationMethod: loanParams.calculation_method,
        approvedAmount: parseFloat(loanParams.principal_amount),
        approvedTenor: parseInt(loanParams.term_months),
        disbursementDate: loanParams.disbursement_date,
        decision: decision,
        comments: comments
      };

      // Save complete assessment data using the service
      await CreditAssessmentService.saveAssessment(loanApplicationId, assessmentDataToSave, user.id);
      
      // Store approved loan parameters (schedule will be created during disbursement)
      console.log('💾 Storing approved loan parameters...');
      
      const { error: updateError } = await supabase
        .from('loan_applications')
        .update({
          approved_amount: parseFloat(loanParams.principal_amount),
          approved_interest_rate: parseFloat(loanParams.interest_rate),
          approved_tenor: parseInt(loanParams.term_months),
          calculation_method: loanParams.calculation_method,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanApplicationId);
        
      if (updateError) {
        console.error('❌ Failed to store approved loan parameters:', updateError);
        alert('Warning: Loan parameters could not be saved. Please try again.');
        return;
      } else {
        console.log('✅ Approved loan parameters stored successfully');
        console.log('ℹ️ Repayment schedule will be created during disbursement when loan record is created');
      }
      
      // Submit to next stage using workflow controls
      const { success, message } = await LoanWorkflowControls.submitToNextStage(
        loanApplicationId!,
        'contract_generation',
        user.id,
        `Assessment completed: ${decision} - ${comments}`
      );
      
      if (!success) {
        alert(`Failed to submit loan: ${message}`);
        return;
      }
      
      // Update progress
      setCurrentStep('contract_generation');
      
      // Show success message
      alert(`Loan approved successfully for ${application?.clientName}! Proceeding to contract generation.`);
      
      // Navigate to contract generation page
      navigate(`/staff/loan-processing/${loanApplicationId}/contract-generation`);
      
    } catch (error) {
      console.error('Error approving loan:', error);
      alert(`Failed to approve loan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectLoan = async () => {
    if (!decision) {
      alert('Please select a decision before rejecting');
      return;
    }
    
    if (decision !== 'reject') {
      alert('Only rejection decisions can be processed with this action');
      return;
    }
    
    if (!user) {
      alert('User not authenticated. Please log in again.');
      return;
    }

    if (!comments.trim()) {
      alert('Please provide rejection comments');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Rejecting loan with data:', {
        loanApplicationId,
        userId: user.id,
        decision,
        comments: comments
      });

      // Auto-save complete assessment data before rejecting
      const assessmentDataToSave: CreditAssessmentData = {
        creditScore: assessmentData.creditScore,
        riskGrade: assessmentData.riskGrade,
        assessmentScore: assessmentData.creditScore,
        paymentHistory: assessmentData.paymentHistory,
        creditUtilization: assessmentData.creditUtilization,
        incomeStability: assessmentData.incomeStability,
        debtToIncomeRatio: assessmentData.debtToIncomeRatio,
        employmentHistory: assessmentData.employmentHistory,
        collateralValue: assessmentData.collateralValue,
        interestRate: parseFloat(loanParams.interest_rate),
        managementFeeRate: parseFloat(loanParams.management_fee_rate),
        calculationMethod: loanParams.calculation_method,
        approvedAmount: parseFloat(loanParams.principal_amount),
        approvedTenor: parseInt(loanParams.term_months),
        disbursementDate: loanParams.disbursement_date,
        decision: decision,
        comments: comments
      };

      // Save complete assessment data using the service
      await CreditAssessmentService.saveAssessment(loanApplicationId, assessmentDataToSave, user.id);
      
      // Update loan application status directly
      const { error: updateError } = await supabase
        .from('loan_applications')
        .update({
          status: 'rejected',
          rejection_reason: comments,
          workflow_stage: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', loanApplicationId);

      if (updateError) {
        console.error('❌ Failed to reject loan:', updateError);
        alert(`Failed to reject loan: ${updateError.message}`);
        return;
      }

      console.log('✅ Loan rejected successfully');
      alert('Loan application has been rejected successfully');
      
      // Navigate to loan applications with rejected tab active
      navigate('/staff/loan-applications?tab=rejected');
      
    } catch (error: any) {
      console.error('Error rejecting loan:', error);
      alert(`Error rejecting loan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReferToCommittee = async () => {
    if (!decision) {
      alert('Please select a decision before referring to committee');
      return;
    }
    
    if (decision !== 'refer_committee') {
      alert('Only committee referral decisions can be processed with this action');
      return;
    }
    
    if (!user) {
      alert('User not authenticated. Please log in again.');
      return;
    }

    if (!comments.trim()) {
      alert('Please provide comments for committee referral');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Referring loan to committee with data:', {
        loanApplicationId,
        userId: user.id,
        decision,
        comments: comments
      });

      // Auto-save complete assessment data before referring to committee
      const assessmentDataToSave: CreditAssessmentData = {
        creditScore: assessmentData.creditScore,
        riskGrade: assessmentData.riskGrade,
        assessmentScore: assessmentData.creditScore,
        paymentHistory: assessmentData.paymentHistory,
        creditUtilization: assessmentData.creditUtilization,
        incomeStability: assessmentData.incomeStability,
        debtToIncomeRatio: assessmentData.debtToIncomeRatio,
        employmentHistory: assessmentData.employmentHistory,
        collateralValue: assessmentData.collateralValue,
        interestRate: parseFloat(loanParams.interest_rate),
        managementFeeRate: parseFloat(loanParams.management_fee_rate),
        calculationMethod: loanParams.calculation_method,
        approvedAmount: parseFloat(loanParams.principal_amount),
        approvedTenor: parseInt(loanParams.term_months),
        disbursementDate: loanParams.disbursement_date,
        decision: decision,
        comments: comments,
        committeeReferralReason: comments
      };

      // Save complete assessment data using the service
      await CreditAssessmentService.saveAssessment(loanApplicationId, assessmentDataToSave, user.id);

      // Update loan application status to pending committee review
      const { error: updateError } = await supabase
        .from('loan_applications')
        .update({
          status: 'pending_committee_review',
          approval_status: 'pending_committee_review',
          assessment_score: assessmentData?.creditScore || 0,
          committee_review_reason: comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanApplicationId);

      if (updateError) {
        throw new Error(`Failed to update loan status: ${updateError.message}`);
      }

      alert('Loan successfully referred to credit committee for review!');
      navigate('/staff/loan-committee-approval');
      
    } catch (error: any) {
      console.error('Error referring loan to committee:', error);
      alert(`Error referring loan to committee: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecallLoan = async () => {
    if (!recallReason.trim()) {
      alert('Please provide a reason for recalling the loan');
      return;
    }

    if (!user) {
      alert('User not authenticated. Please log in again.');
      return;
    }

    try {
      const { success, message } = await LoanWorkflowControls.recallLoan(
        loanApplicationId!,
        user.id,
        recallReason,
        'assessment'
      );

      if (success) {
        alert('Loan successfully recalled. You can now continue working on the assessment.');
        setShowRecallModal(false);
        setRecallReason('');
        // Refresh workflow state
        const state = await LoanWorkflowControls.getWorkflowState(loanApplicationId!);
        setWorkflowState(state);
      } else {
        alert(`Failed to recall loan: ${message}`);
      }
    } catch (error) {
      console.error('Error recalling loan:', error);
      alert(`Failed to recall loan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStepClick = (stepId: string) => {
    switch (stepId) {
      case 'assessment':
        // Already on assessment page
        break;
      case 'contract_generation':
        navigate(`/staff/loan-processing/${loanApplicationId}/contract-generation`);
        break;
      case 'contract_upload':
        // This would be handled in contract generation page
        break;
      case 'final_approval':
        // This would be handled after contract upload
        break;
      case 'disbursement':
        navigate('/staff/disbursement');
        break;
    }
  };

  const handleGenerateContract = () => {
    navigate(`/staff/loan-processing/${loanApplicationId}/contract-generation`);
  };

  const handleContractUpload = async () => {
    try {
      const existingContracts = await ContractService.getContractsByLoanApplication(loanApplicationId);
      setContracts(existingContracts);
      if (existingContracts.length === 0) {
        // Create contract if it doesn't exist
        const contractData = {
          loan_application_id: loanApplicationId!,
          client_id: application?.clientId || '',
          status: 'generated' as const,
          contract_text: '',
          loan_amount: parseFloat(loanParams.principal_amount) || 0,
          interest_rate: parseFloat(loanParams.interest_rate) || 0,
          management_fee_rate: parseFloat(loanParams.management_fee_rate) || 8.5,
          repayment_period_months: parseInt(loanParams.term_months) || 0,
          total_repayment_amount: calculatedTotals.totalRepayment,
          monthly_payment: calculatedTotals.emi,
          created_by_user_id: 'system',
          updated_by_user_id: 'system'
        };
        const newContract = await ContractService.createContract(contractData);
        setContracts([newContract]);
      }
    } catch (error) {
      console.error('Failed to load/create contract:', error);
    }
    setShowContractUpload(true);
  };

  const handleContractUpdated = async () => {
    try {
      const updatedContracts = await ContractService.getContractsByLoanApplication(loanApplicationId!);
      setContracts(updatedContracts);
      if (updatedContracts.length > 0) {
        const contract = updatedContracts[0];
        if (contract.status === 'signed') {
          setContractStatus('uploaded');
        }
      }
    } catch (error) {
      console.error('Failed to refresh contracts:', error);
    }
  };

  const handleCommitteeApproval = (status: 'approved' | 'rejected') => {
    setCommitteeApprovalStatus(status);
  };

  const handleFinalDisbursementApproval = () => {
    if (contractStatus === 'uploaded') {
      setFinalApprovalStatus('approved');
      setContractStatus('approved');
      alert('Final disbursement approval granted! Loan is ready for disbursement.');
    } else {
      alert('Contract must be uploaded before final approval can be granted.');
    }
  };

  const exportSchedule = (format: 'pdf' | 'excel') => {
    const fileName = `repayment_schedule_${application?.clientName?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`;
    alert(`Exporting ${fileName}`);
  };

  // Loading state
  console.log('Assessment page render state:', {
    applicationLoading,
    productsLoading,
    loanApplication: loanApplication?.length,
    client: client,
    loanApplicationId,
    loanApplicationData: loanApplication,
    clientData: client
  });
  
  if (applicationLoading || !application) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading loan application...</span>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (loanError) {
    console.error('Assessment page errors:', {
      applicationError,
      clientError,
      productsError,
      loanApplicationId
    });
    
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading loan application</h3>
                <p className="text-sm text-red-700 mt-1">
                  Application Error: {applicationError ? JSON.stringify(applicationError) : 'None'}<br/>
                  Client Error: {clientError ? JSON.stringify(clientError) : 'None'}<br/>
                  Products Error: {productsError ? JSON.stringify(productsError) : 'None'}<br/>
                  Loan Application ID: {loanApplicationId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // No data state
  if (!loanApplication || loanApplication.length === 0) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Loan Application Not Found</h3>
                <p className="text-sm text-yellow-700 mt-1">No loan application found with ID: {loanApplicationId}</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="flex space-x-6">
        {/* Main Content */}
        <div className="flex-1 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Credit Assessment</h1>
              <p className="text-purple-100">
                Comprehensive credit assessment - Application ID: {loanApplicationId}
              </p>
            </div>
            <button
              onClick={() => navigate('/staff/loan-processing')}
              className="bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Processing
            </button>
          </div>
        </div>

        {/* Application Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Application Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Client</p>
              <p className="font-medium text-gray-900">{application?.clientName || 'Loading...'}</p>
              <p className="text-sm text-gray-500">{application?.clientId || 'Loading...'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Requested Amount</p>
              <p className="font-medium text-gray-900">{formatCurrency(application?.loanAmount || 0)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Product</p>
              <p className="font-medium text-gray-900">{application?.product || 'Loading...'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Submission Date</p>
              <p className="font-medium text-gray-900">{application?.submissionDate || 'Loading...'}</p>
            </div>
          </div>
        </div>

        {/* Loan Parameters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-purple-600" />
            Loan Parameters & Calculation Method
          </h3>

          {/* Calculation Method Tabs */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleParamChange('calculation_method', 'reducing_balance')}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loanParams.calculation_method === 'reducing_balance'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reducing Balance
                <span className="block text-xs text-gray-500">Interest on outstanding amount</span>
              </button>
              <button
                type="button"
                onClick={() => handleParamChange('calculation_method', 'flat_rate')}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loanParams.calculation_method === 'flat_rate'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Flat Rate
                <span className="block text-xs text-gray-500">Fixed interest on full principal</span>
              </button>
              <button
                type="button"
                onClick={() => handleParamChange('calculation_method', 'balloon_structure')}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loanParams.calculation_method === 'balloon_structure'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Balloon Structure
                <span className="block text-xs text-gray-500">Small payments + large balloon</span>
              </button>
            </div>
          </div>

          {/* Core Parameters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principal Amount (TZS) *
              </label>
              <input
                type="number"
                value={loanParams.principal_amount}
                onChange={(e) => handleParamChange('principal_amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term in Months *
              </label>
              <input
                type="number"
                value={loanParams.term_months}
                onChange={(e) => handleParamChange('term_months', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter months"
                min="1"
                max="60"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disbursement Date *
              </label>
              <input
                type="date"
                value={loanParams.disbursement_date}
                onChange={(e) => handleParamChange('disbursement_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (% monthly) *
                {parseFloat(loanParams.interest_rate) > 30 && (
                  <span className="text-red-600 text-xs ml-2">⚠ Exceeds regulatory limit</span>
                )}
              </label>
              <input
                type="number"
                step="0.1"
                value={loanParams.interest_rate}
                onChange={(e) => handleParamChange('interest_rate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 3.5"
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          {/* Management Fee Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Management Fee Rate (% monthly)
              </label>
              <input
                type="number"
                step="0.1"
                value={loanParams.management_fee_rate}
                onChange={(e) => handleParamChange('management_fee_rate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2.0"
                min="0"
                max="100"
              />
            </div>
            
          </div>
        </div>

        {/* Calculated Totals */}
        {(calculatedTotals.totalRepayment > 0) && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Calculated Totals ({loanParams.calculation_method === 'flat_rate' ? 'Flat Rate' : 
                                  loanParams.calculation_method === 'balloon_structure' ? 'Balloon Structure' : 'Reducing Balance'})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Total Interest</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(calculatedTotals.totalInterest)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600">Total Management Fee</p>
                <p className="text-xl font-bold text-purple-700">{formatCurrency(calculatedTotals.totalManagementFee)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Monthly EMI</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(calculatedTotals.emi)}</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total Repayment Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculatedTotals.totalRepayment)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Principal</p>
                  <p className="text-lg font-medium text-gray-700">{formatCurrency(parseFloat(loanParams.principal_amount) || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Amortization Preview */}
        {repaymentSchedule.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
              Dynamic Amortization Preview
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(parseFloat(loanParams.principal_amount) || 0)}</p>
                  <p className="text-sm text-gray-600">Principal Amount</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{loanParams.interest_rate}%</p>
                  <p className="text-sm text-gray-600">Interest Rate (Monthly)</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{loanParams.term_months} months</p>
                  <p className="text-sm text-gray-600">Repayment Period</p>
                </div>
              </div>
            </div>

            {/* Repayment Schedule Preview */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Repayment Schedule Preview
                </h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {showSchedule ? 'Hide' : 'Show'} Full Schedule
                  </button>
                  {showSchedule && (
                    <>
                      <button
                        type="button"
                        onClick={() => exportSchedule('pdf')}
                        className="text-green-600 hover:text-green-800 text-sm flex items-center"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => exportSchedule('excel')}
                        className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Excel
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left border-b">Payment</th>
                      <th className="px-3 py-2 text-left border-b">Due Date</th>
                      <th className="px-3 py-2 text-left border-b">Principal</th>
                      <th className="px-3 py-2 text-left border-b">Interest</th>
                      <th className="px-3 py-2 text-left border-b">Mgmt Fee</th>
                      <th className="px-3 py-2 text-left border-b">Total Payment</th>
                      <th className="px-3 py-2 text-left border-b">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repaymentSchedule.slice(0, showSchedule ? repaymentSchedule.length : 3).map((entry, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="px-3 py-2">{entry.paymentNumber}</td>
                        <td className="px-3 py-2">{entry.dueDate}</td>
                        <td className="px-3 py-2">{formatCurrency(entry.principalPortion)}</td>
                        <td className="px-3 py-2">{formatCurrency(entry.interestPortion)}</td>
                        <td className="px-3 py-2">{formatCurrency(entry.managementFeePortion)}</td>
                        <td className="px-3 py-2 font-medium">{formatCurrency(entry.totalPayment)}</td>
                        <td className="px-3 py-2">{formatCurrency(entry.remainingBalance)}</td>
                      </tr>
                    ))}
                    {!showSchedule && repaymentSchedule.length > 3 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-2 text-center text-gray-500">
                          ... and {repaymentSchedule.length - 3} more payments
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Credit Assessment Cards - One Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Rule-Based & ML Scorecard */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Rule-Based & ML Scorecard
            </h3>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-700">{assessmentData.creditScore}</p>
                <p className="text-sm text-gray-600">Credit Score</p>
                <p className="text-lg font-medium text-green-700 mt-1">{assessmentData.riskGrade}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Payment History:</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                    <div 
                      className="bg-green-600 h-1.5 rounded-full" 
                      style={{ width: `${assessmentData.paymentHistory}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-green-600">{assessmentData.paymentHistory}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Credit Utilization:</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                    <div 
                      className="bg-green-600 h-1.5 rounded-full" 
                      style={{ width: `${assessmentData.creditUtilization}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-green-600">{assessmentData.creditUtilization}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Length of History:</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                    <div 
                      className="bg-yellow-600 h-1.5 rounded-full" 
                      style={{ width: `${assessmentData.lengthOfHistory}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-yellow-600">{assessmentData.lengthOfHistory}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Income Stability:</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                    <div 
                      className="bg-green-600 h-1.5 rounded-full" 
                      style={{ width: `${assessmentData.incomeStability}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-green-600">{assessmentData.incomeStability}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Analysis */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-purple-600" />
              Financial Analysis
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Debt-to-Income Ratio</p>
                <p className="text-xl font-bold text-blue-700">{assessmentData.debtToIncomeRatio}%</p>
                <p className="text-xs text-blue-600">Acceptable (≤ 40%)</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Employment History</p>
                <p className="text-xl font-bold text-green-700">{assessmentData.employmentHistory}</p>
                <p className="text-xs text-green-600">years</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Collateral Value</p>
                <p className="text-lg font-bold text-purple-700">
                  {formatCurrency(assessmentData.collateralValue)}
                </p>
                <p className="text-xs text-purple-600">
                  LTV: {((parseFloat(loanParams.principal_amount) || 0) / assessmentData.collateralValue * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Risk Assessment Matrix */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-red-600" />
              Risk Assessment Matrix
            </h3>
            
            <div className="space-y-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Credit Risk:</span>
                  <span className="text-xs font-medium text-green-600">Low</span>
                </div>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Market Risk:</span>
                  <span className="text-xs font-medium text-yellow-600">Medium</span>
                </div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Operational Risk:</span>
                  <span className="text-xs font-medium text-green-600">Low</span>
                </div>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Liquidity Risk:</span>
                  <span className="text-xs font-medium text-blue-600">Low</span>
                </div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Concentration Risk:</span>
                  <span className="text-xs font-medium text-green-600">Low</span>
                </div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Overall Risk:</span>
                  <span className="text-xs font-medium text-green-600">Low-Medium</span>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-Decline Rules */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-600" />
              Auto-Decline Rules
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-xs text-gray-700">Age ≥ 18 years</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-xs text-gray-700">No active write-off</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-xs text-gray-700">PAR 90 {'< 10%'}</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-xs text-gray-700">Sanctions/PEP clear</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              
              {application?.autoDeclineFlags && application.autoDeclineFlags.length > 0 && (
                <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center mb-1">
                    <AlertTriangle className="w-3 h-3 text-red-600 mr-1" />
                    <span className="text-xs font-medium text-red-800">Auto-Decline Flags</span>
                  </div>
                  {application?.autoDeclineFlags.map((flag: string, index: number) => (
                    <div key={index} className="text-xs text-red-700">• {flag}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assessment Data Points */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Assessment Data Points
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-medium text-gray-900 mb-1 text-sm">CRB Data</h5>
                <div className="text-xs text-blue-800 space-y-1">
                  <p>• Credit score: {assessmentData.creditScore}</p>
                  <p>• Payment history: {assessmentData.paymentHistory >= 80 ? 'Excellent' : assessmentData.paymentHistory >= 60 ? 'Good' : 'Fair'}</p>
                  <p>• Active accounts: {application?.clientId ? '1' : '0'}</p>
                  <p>• Total exposure: {formatCurrency(parseFloat(loanParams.principal_amount) || 0)}</p>
                  <p>• Defaults: {application?.crbStatus === 'Completed' ? 'None' : 'Pending'}</p>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-medium text-gray-900 mb-1 text-sm">Income Verification</h5>
                <div className="text-xs text-green-800 space-y-1">
                  <p>• Monthly income: {formatCurrency(parseFloat(application?.loanAmount || 0) / 12)}</p>
                  <p>• Employment: {assessmentData.employmentHistory} years {assessmentData.employmentHistory > 3 ? 'stable' : 'new'}</p>
                  <p>• Income source: {application?.kycStatus === 'Verified' ? 'Verified' : 'Pending'}</p>
                  <p>• DTI ratio: {assessmentData.debtToIncomeRatio}%</p>
                </div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <h5 className="font-medium text-gray-900 mb-1 text-sm">Collateral Evaluation</h5>
                <div className="text-xs text-purple-800 space-y-1">
                  <p>• Type: {application?.collateralType || 'Motor vehicle'}</p>
                  <p>• Current value: {formatCurrency(assessmentData.collateralValue)}</p>
                  <p>• LTV ratio: {assessmentData.collateralValue > 0 ? ((parseFloat(loanParams.principal_amount) || 0) / assessmentData.collateralValue * 100).toFixed(1) : '0'}%</p>
                  <p>• Marketability: {assessmentData.collateralValue > parseFloat(loanParams.principal_amount || '0') ? 'High' : 'Medium'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Decision - Bottom of Page */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Assessment Decision
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decision *
              </label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select decision...</option>
                <option value="approve">Approve as Requested</option>
                <option value="approve_modified">Approve with Modifications</option>
                <option value="refer_committee">Refer to Credit Committee</option>
                <option value="reject">Reject Application</option>
              </select>
            </div>

            {decision === 'approve_modified' && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h5 className="font-medium text-gray-900 mb-2">Proposed Modifications</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Approved Amount</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      defaultValue={loanParams.principal_amount}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      defaultValue={loanParams.interest_rate}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tenor (months)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      defaultValue={loanParams.term_months}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Additional Conditions</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="e.g., Additional guarantor required"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments & Justification
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter assessment comments and decision justification..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSaveAssessment}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Assessment
              </button>
              
              {/* Workflow Control Buttons */}
              {workflowState?.canBeRecalled && (
                <button
                  onClick={() => setShowRecallModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Recall Loan
                </button>
              )}
              
              {decision === 'reject' ? (
                <button
                  onClick={handleRejectLoan}
                  disabled={!canSubmit || isSubmitting}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    canSubmit && !isSubmitting
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Reject Application
                    </>
                  )}
                </button>
              ) : decision === 'refer_committee' ? (
                <button
                  onClick={handleReferToCommittee}
                  disabled={!canSubmit || isSubmitting}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    canSubmit && !isSubmitting
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Referring...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Refer to Credit Committee
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleApproveLoan}
                  disabled={!canSubmit || isSubmitting}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                    canSubmit && !isSubmitting
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Loan
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Workflow Status Messages */}
            {!canSubmit && submitMessage && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 text-sm">{submitMessage}</p>
                </div>
              </div>
            )}
            
            {workflowState && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-blue-800 text-sm font-medium">Current Stage: {workflowState.currentStage.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-blue-600 text-xs">Status: {workflowState.status.replace('_', ' ').toUpperCase()}</p>
                    </div>
                  </div>
                  {workflowState.canBeRecalled && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      Can be recalled
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Workflow Sections - Only show if decision is approved */}
        {(decision === 'approve' || decision === 'approve_modified') && (
          <>
            {/* Committee Approval Section */}
            {committeeApprovalRequired && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  Committee Approval Required
                </h3>
                
                <div className="bg-purple-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Loan Amount: {formatCurrency(parseFloat(loanParams.principal_amount) || 0)}</p>
                      <p className="text-xs text-purple-600">Requires committee approval based on loan amount</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        committeeApprovalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        committeeApprovalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {committeeApprovalStatus === 'approved' ? 'Approved' :
                         committeeApprovalStatus === 'rejected' ? 'Rejected' :
                         'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {committeeApprovalStatus === 'pending' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleCommitteeApproval('approved')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleCommitteeApproval('rejected')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Contract Management Section */}
            {(committeeApprovalStatus === 'approved' || !committeeApprovalRequired) && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileCheck className="w-5 h-5 mr-2 text-blue-600" />
                  Contract Management
                </h3>
                
                <div className="space-y-4">
                  {/* Contract Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        contractStatus === 'approved' ? 'bg-green-500' :
                        contractStatus === 'uploaded' ? 'bg-blue-500' :
                        contractStatus === 'generated' ? 'bg-yellow-500' :
                        'bg-gray-300'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">Contract Status</p>
                        <p className="text-sm text-gray-600">
                          {contractStatus === 'approved' ? 'Contract approved and ready for disbursement' :
                           contractStatus === 'uploaded' ? 'Contract uploaded and awaiting approval' :
                           contractStatus === 'generated' ? 'Contract generated, awaiting signature' :
                           'Contract not yet generated'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      contractStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      contractStatus === 'uploaded' ? 'bg-blue-100 text-blue-800' :
                      contractStatus === 'generated' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {contractStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Contract Actions */}
                  <div className="flex space-x-3">
                    {contractStatus === 'not_generated' && (
                      <button
                        onClick={handleGenerateContract}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Contract
                      </button>
                    )}
                    
                    {contractStatus === 'generated' && (
                      <button
                        onClick={handleContractUpload}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Signed Contract
                      </button>
                    )}

                    {contractStatus === 'generated' && (
                      <button
                        onClick={handleGenerateContract}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Contract
                      </button>
                    )}
                  </div>

                  {/* Contract Details */}
                  {contracts.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Contract Details</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Contract ID:</span>
                          <span className="ml-2 font-mono">{contracts[0].id}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Created:</span>
                          <span className="ml-2">{contracts[0].created_at ? new Date(contracts[0].created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Final Disbursement Approval Section */}
            {contractStatus === 'uploaded' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Final Disbursement Approval
                </h3>
                
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium text-green-900">Ready for Final Approval</p>
                      <p className="text-sm text-green-700">All requirements have been met. Contract has been uploaded and verified.</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleFinalDisbursementApproval}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve for Disbursement
                  </button>
                  <button
                    onClick={() => setFinalApprovalStatus('rejected')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Disbursement Status */}
            {finalApprovalStatus === 'approved' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-green-600" />
                  Disbursement Status
                </h3>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium text-green-900">Approved for Disbursement</p>
                      <p className="text-sm text-green-700">Loan is ready for disbursement. All approvals and contracts are complete.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Contract Upload Modal */}
        {showContractUpload && (
          <ContractUploadModal
            isOpen={showContractUpload}
            onClose={() => setShowContractUpload(false)}
            loanApplicationId={loanApplicationId!}
            clientId={application?.clientId || ''}
            contractData={contracts[0]}
            onContractUpdated={handleContractUpdated}
          />
        )}

        {/* Recall Modal */}
        {showRecallModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recall Loan</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to recall this loan? This will move it back to the assessment stage for further review.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Recall
                </label>
                <textarea
                  value={recallReason}
                  onChange={(e) => setRecallReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Please provide a reason for recalling this loan..."
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRecallModal(false);
                    setRecallReason('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecallLoan}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Recall Loan
                </button>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Progress Sidebar */}
        {showProgressSidebar && (
          <div className="w-80">
            <LoanProcessingProgress
              currentStep={currentStep}
              loanStatus={application?.status || 'pending'}
              contractStatus={contractStatus}
              onStepClick={handleStepClick}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LoanAssessmentPage;
