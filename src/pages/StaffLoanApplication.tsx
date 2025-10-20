import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseQuery, useSupabaseInsert } from '../hooks/useSupabase';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import QuickApplicationForm from '../components/QuickApplicationForm';
import LoyaltyTierDisplay from '../components/LoyaltyTierDisplay';
import CustomerAnalytics from '../components/CustomerAnalytics';
import LoyaltyService from '../services/loyaltyService';
import { FeesConfigService, FeesConfig } from '../services/feesConfigService';
import { CreditScoringService, CreditScoringData, CreditScoreResult } from '../services/creditScoringService';
import {
  FileText,
  User,
  DollarSign,
  Building,
  CreditCard,
  Shield,
  ArrowLeft,
  TrendingUp,
  BarChart3,
  Plus,
  X,
  Zap,
  Star,
  BarChart3 as Analytics,
  Save,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

interface Guarantor {
  id: string;
  full_name: string;
  residence: string;
  occupation: string;
  company_business_name: string;
  office_location: string;
  relationship: string;
}

interface CollateralAsset {
  id: string;
  asset_type: string;
  value: string;
}


const StaffLoanApplication: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { } = useLanguage();
  
  // Detect if it's a mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      // More accurate mobile detection - only consider it mobile if it's actually a mobile device
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Only show mobile form if it's actually a mobile device, not just a small screen
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [client, setClient] = useState<any>(null);
  const [showQuickApplication, setShowQuickApplication] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [customerTier, setCustomerTier] = useState<any>(null);
  const [preApprovals, setPreApprovals] = useState<any[]>([]);
  const [customerBenefits, setCustomerBenefits] = useState<any[]>([]);
  const [, setFeesConfig] = useState<FeesConfig | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [_isSubmitting, setIsSubmitting] = useState(false);
  const [clientType, setClientType] = useState<string>('');
  const [guarantors] = useState<any[]>([]);
  
  // Enhanced credit scoring state
  const [creditScoreResult, setCreditScoreResult] = useState<CreditScoreResult | null>(null);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [autoCalculationEnabled, setAutoCalculationEnabled] = useState(true);
  const [formData, setFormData] = useState({
    loan_product_id: '',
    requested_amount: '',
    repayment_period_months: '',
    loan_purpose: '',
    repayment_capacity: '',
    source_of_income: '',
    employment_company_name: '',
    employment_office_location: '',
    employment_position: '',
    employment_start_date: '',
    net_monthly_salary: '',
    salary_slip_url: '',
    average_monthly_income: '',
    previous_loan_taken: false,
    previous_institution_name: '',
    previous_loan_date: '',
    previous_loan_amount: '',
    previous_repayment_amount: '',
    previous_repayment_date: '',
    crb_consent_given: false,
    // Upfront fees
    application_fee: '',
    legal_fee: '',
    processing_fee_method: 'upfront', // 'upfront' or 'deduct_at_disbursement'
    upfront_fees_paid: false,
    payment_transaction_code: '',
    payment_receipt_url: '',
    // Enhanced features
    guarantors: [] as Guarantor[],
    collateral_type: '',
    collateral_registration_number: '',
    collateral_appearance: '',
    collateral_current_value: '',
    collateral_other_details: '',
    collateral_assets: [] as CollateralAsset[],
    credit_score: 0,
    risk_rating: '',
    credit_factors: '',
    crb_report_available: false,
    crb_score: 0,
    crb_rating: '',
    
    // Enhanced credit scoring fields
    age: '',
    dependents: '',
    education_level: 'secondary',
    residence_stability: '',
    phone_stability: '',
    income_stability: '5',
    previous_repayment_history: 'good',
    has_collateral: false,
    has_guarantors: false,
    guarantor_count: '0',
    
    // Additional fields referenced in code
    gender: '',
    marital_status: '',
    existing_loans: '',
    monthly_expenses: '',
    assets: '',
    liabilities: '',
    references: [] as any[],
    
    // Business information fields (for individual clients with business income)
    business_name: '',
    business_type: '',
    business_registration_number: '',
    business_location: '',
    business_start_date: '',
    business_monthly_revenue: '',
    business_monthly_expenses: '',
    business_net_profit: '',
    business_employees: '',
    business_bank_statements: false,
    business_tax_returns: false,
    
    status: 'submitted',
    application_id: '',
    submitted_at: ''
  });

  const [loading, setLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [_draftSaved, setDraftSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch loan products
  const { data: loanProducts } = useSupabaseQuery('loan_products', {
    filter: [{ column: 'status', operator: 'eq', value: 'active' }],
    orderBy: { column: 'name', ascending: true }
  });

  // Hook for inserting loan application
  const { insert: insertApplication, loading: insertLoading } = useSupabaseInsert('loan_applications');

  // Draft functionality
  const saveDraft = () => {
    try {
      const draftData = {
        ...formData,
        clientId,
        savedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      localStorage.setItem(`loan_application_draft_${clientId}`, JSON.stringify(draftData));
      setDraftSaved(true);
      setLastSaved(new Date());
      setIsDraft(true);
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  const loadDraft = () => {
    try {
      const savedDraft = localStorage.getItem(`loan_application_draft_${clientId}`);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        setFormData(draftData);
        setIsDraft(true);
        setDraftSaved(true);
        setLastSaved(new Date(draftData.savedAt));
        toast.success('Draft loaded successfully!');
      } else {
        toast.error('No draft found for this client');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load draft');
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(`loan_application_draft_${clientId}`);
      setIsDraft(false);
      setDraftSaved(false);
      setLastSaved(null);
      toast.success('Draft cleared successfully!');
    } catch (error) {
      console.error('Error clearing draft:', error);
      toast.error('Failed to clear draft');
    }
  };

  const exportDraft = () => {
    try {
      const draftData = {
        ...formData,
        clientId,
        savedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(draftData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `loan_application_draft_${clientId}_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('Draft exported successfully!');
    } catch (error) {
      console.error('Error exporting draft:', error);
      toast.error('Failed to export draft');
    }
  };

  const importDraft = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        setFormData(importedData);
        setIsDraft(true);
        setDraftSaved(true);
        setLastSaved(new Date(importedData.savedAt));
        toast.success('Draft imported successfully!');
      } catch (error) {
        console.error('Error importing draft:', error);
        toast.error('Failed to import draft - invalid file format');
      }
    };
    reader.readAsText(file);
  };

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (isDraft) {
      const autoSaveInterval = setInterval(() => {
        saveDraft();
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [isDraft, formData]);

  // Check for existing draft on component mount
  useEffect(() => {
    if (clientId) {
      const savedDraft = localStorage.getItem(`loan_application_draft_${clientId}`);
      if (savedDraft) {
        setIsDraft(true);
        setDraftSaved(true);
        const draftData = JSON.parse(savedDraft);
        setLastSaved(new Date(draftData.savedAt));
      }
    }
  }, [clientId]);

  // Fetch client details
  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (error) {
          console.error('Error fetching client:', error);
          toast.error('Failed to load client details');
          return;
        }

        setClient(data);
        setClientType(data?.client_type || '');
        setIsDataLoaded(true);
        
        // Fetch loyalty data for existing customers
        if (data?.client_category === 'existing') {
          await fetchLoyaltyData(data.id);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load client details');
      }
    };

    fetchClient();
  }, [clientId]);

  const fetchLoyaltyData = async (clientId: string) => {
    try {
      // Fetch customer tier
      const tier = await LoyaltyService.getCustomerTier(clientId);
      setCustomerTier(tier);

      // Fetch pre-approvals
      const approvals = await LoyaltyService.getCustomerPreApprovals(clientId);
      setPreApprovals(approvals);

      // Fetch customer benefits
      const benefits = await LoyaltyService.getCustomerBenefits(clientId);
      setCustomerBenefits(benefits);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    }
  };

  // Auto-populate form data based on client information
  const populateFormFromClientData = () => {
    if (!client) return;

    const updatedFormData = { ...formData };

    // Auto-populate based on client type
    switch (client.client_type) {
      case 'individual':
        // Populate employment information for individual clients
        if (client.employment_status === 'employed') {
          updatedFormData.employment_company_name = client.employer_name || '';
          updatedFormData.employment_position = client.occupation || '';
          updatedFormData.employment_office_location = client.employer_address || '';
          updatedFormData.net_monthly_salary = client.monthly_income || '';
          updatedFormData.source_of_income = 'employment';
        } else if (client.employment_status === 'self_employed') {
          updatedFormData.business_name = client.occupation || '';
          updatedFormData.business_location = client.employer_address || '';
          updatedFormData.average_monthly_income = client.monthly_income || '';
          updatedFormData.business_type = client.occupation || '';
          updatedFormData.source_of_income = 'business';
        }
        break;

      case 'corporate':
        // Populate business information for corporate clients
        updatedFormData.business_name = client.company_name || '';
        updatedFormData.business_location = client.registered_address || '';
        updatedFormData.average_monthly_income = client.monthly_income || '';
        updatedFormData.business_type = client.business_type || '';
        updatedFormData.source_of_income = 'business';
        break;

      case 'group':
        // Populate group information for group clients
        updatedFormData.business_name = client.group_name || '';
        updatedFormData.business_location = client.registered_address || '';
        updatedFormData.average_monthly_income = client.monthly_income || '';
        updatedFormData.business_type = 'group';
        updatedFormData.source_of_income = 'group_activities';
        break;
    }

    // Set repayment capacity based on income
    if (client.monthly_income) {
      const monthlyIncome = parseFloat(client.monthly_income);
      if (monthlyIncome > 0) {
        // Calculate 30% of monthly income as recommended repayment capacity
        const recommendedCapacity = Math.round(monthlyIncome * 0.3);
        updatedFormData.repayment_capacity = recommendedCapacity.toString();
      }
    }

    setFormData(updatedFormData);
  };

  // Auto-populate form when client data is loaded
  useEffect(() => {
    if (client && isDataLoaded) {
      populateFormFromClientData();
    }
  }, [client, isDataLoaded]);

  // Load fees configuration on component mount
  useEffect(() => {
    const loadFeesConfig = async () => {
      try {
        const config = await FeesConfigService.getActiveFeesConfig();
        if (config) {
          setFeesConfig(config);
        } else {
          // Use default configuration if none found
          setFeesConfig(FeesConfigService.getDefaultFeesConfig());
        }
      } catch (error) {
        console.error('Error loading fees config:', error);
        setFeesConfig(FeesConfigService.getDefaultFeesConfig());
      }
    };

    loadFeesConfig();
  }, []);

  // Calculate total upfront fees dynamically
  const calculateTotalFees = () => {
    const applicationFee = parseFloat(formData.application_fee || '0');
    const legalFee = parseFloat(formData.legal_fee || '0');
    return applicationFee + legalFee;
  };



  const addGuarantor = () => {
    if (formData.guarantors && formData.guarantors.length >= 3) {
      toast.error('Maximum 3 guarantors allowed');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      guarantors: [...prev.guarantors, {
        id: Date.now().toString(),
        full_name: '',
        residence: '',
        occupation: '',
        company_business_name: '',
        office_location: '',
        relationship: ''
      }]
    }));
  };

  const removeGuarantor = (id: string) => {
    setFormData(prev => ({
      ...prev,
      guarantors: prev.guarantors.filter(g => g.id !== id)
    }));
  };

  const updateGuarantor = (id: string, field: keyof Guarantor, value: string) => {
    setFormData(prev => ({
      ...prev,
      guarantors: prev.guarantors.map(g => 
        g.id === id ? { ...g, [field]: value } : g
      )
    }));
  };

  // Collateral asset functions (commented out for now)
  // const addCollateralAsset = () => {
  //   if (formData.collateral_assets.length >= 5) {
  //     toast.error('Maximum 5 assets allowed');
  //     return;
  //   }
  //   
  //   setFormData(prev => ({
  //     ...prev,
  //     collateral_assets: [...prev.collateral_assets, {
  //       id: Date.now().toString(),
  //       asset_type: '',
  //       value: ''
  //     }]
  //   }));
  // };

  // const removeCollateralAsset = (id: string) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     collateral_assets: prev.collateral_assets.filter(a => a.id !== id)
  //   }));
  // };

  // const updateCollateralAsset = (id: string, field: keyof CollateralAsset, value: string) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     collateral_assets: prev.collateral_assets.map(a => 
  //       a.id === id ? { ...a, [field]: value } : a
  //     )
  //   }));
  // };


  const calculateCreditScore = async () => {
    if (isCalculatingScore) return;
    
    setIsCalculatingScore(true);
    
    try {
      // Determine if this is a business loan for an individual client
      const isBusinessLoan = formData.loan_purpose?.toLowerCase().includes('business') || 
                            formData.loan_purpose?.toLowerCase().includes('enterprise') ||
                            formData.loan_purpose?.toLowerCase().includes('commercial');
      
      // Prepare data for ML credit scoring
      const scoringData: CreditScoringData = {
        // Personal Information
        age: parseInt(formData.age) || 30,
        gender: formData.gender || 'other',
        maritalStatus: formData.marital_status || 'single',
        dependents: parseInt(formData.dependents) || 0,
        clientType: 'individual', // This is always individual for staff loan application
        
        // Income Information
        incomeSource: formData.source_of_income as any || 'employment',
        monthlyIncome: parseFloat(formData.net_monthly_salary) || 0,
        incomeStability: parseInt(formData.income_stability) || 5,
        businessYears: formData.business_start_date ? 
          new Date().getFullYear() - new Date(formData.business_start_date).getFullYear() : undefined,
        employmentYears: formData.employment_start_date ? 
          new Date().getFullYear() - new Date(formData.employment_start_date).getFullYear() : undefined,
        
        // Business Information (for individual clients with business income)
        businessName: formData.business_name || undefined,
        businessType: formData.business_type || undefined,
        businessRegistrationNumber: formData.business_registration_number || undefined,
        businessLocation: formData.business_location || undefined,
        businessStartDate: formData.business_start_date || undefined,
        businessMonthlyRevenue: parseFloat(formData.business_monthly_revenue) || undefined,
        businessMonthlyExpenses: parseFloat(formData.business_monthly_expenses) || undefined,
        businessNetProfit: parseFloat(formData.business_net_profit) || undefined,
        businessEmployees: parseInt(formData.business_employees) || undefined,
        businessBankStatements: formData.business_bank_statements || false,
        businessTaxReturns: formData.business_tax_returns || false,
        
        // Financial Information
        requestedAmount: parseFloat(formData.requested_amount) || 0,
        existingLoans: parseFloat(formData.existing_loans) || 0,
        monthlyExpenses: parseFloat(formData.monthly_expenses) || 0,
        assets: parseFloat(formData.assets) || 0,
        liabilities: parseFloat(formData.liabilities) || 0,
        
        // Loan Information
        loanType: isBusinessLoan ? 'business' : (formData.loan_purpose as any || 'personal'),
        loanPurpose: formData.loan_purpose || '',
        repaymentPeriod: parseInt(formData.repayment_period_months) || 12,
        isBusinessLoanForIndividual: isBusinessLoan,
        
        // Credit History
        previousLoans: formData.previous_loan_taken ? 1 : 0,
        previousLoanAmount: parseFloat(formData.previous_loan_amount) || undefined,
        previousRepaymentHistory: formData.previous_repayment_history as any || 'good',
        crbScore: formData.crb_score || undefined,
        crbConsent: formData.crb_consent_given || false,
        
        // Collateral
        hasCollateral: formData.has_collateral || formData.collateral_type !== '',
        collateralValue: parseFloat(formData.collateral_current_value) || undefined,
        collateralType: formData.collateral_type || undefined,
        
        // Guarantors
        hasGuarantors: formData.has_guarantors || guarantors.length > 0,
        guarantorCount: parseInt(formData.guarantor_count) || guarantors.length,
        
        // Additional Factors
        educationLevel: formData.education_level as any || 'secondary',
        residenceStability: parseFloat(formData.residence_stability) || 0,
        phoneStability: parseFloat(formData.phone_stability) || 0,
      };
      
      // Calculate credit score using ML service
      const result = await CreditScoringService.calculateCreditScore(scoringData);
      
      // Update form data with results
      setFormData(prev => ({
        ...prev,
        credit_score: result.score,
        risk_rating: result.riskRating,
        credit_factors: [...result.factors.positive, ...result.factors.negative, ...result.factors.neutral].join(', ')
      }));
      
      // Store the full result for display
      setCreditScoreResult(result);
      
      // Save scoring result for ML training
      if (formData.application_id) {
        await CreditScoringService.saveScoringResult(formData.application_id, scoringData, result);
      }
      
      toast.success(`Credit score calculated: ${result.score} (${result.riskRating} Risk) - Confidence: ${Math.round(result.confidence * 100)}%`);
      
    } catch (error) {
      console.error('Error calculating credit score:', error);
      toast.error('Failed to calculate credit score. Please try again.');
    } finally {
      setIsCalculatingScore(false);
    }
  };

  // Auto-calculation effect
  useEffect(() => {
    if (!autoCalculationEnabled) return;
    
    // Debounce auto-calculation to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      // Only auto-calculate if we have minimum required data
      if (formData.net_monthly_salary && formData.requested_amount && formData.loan_purpose) {
        calculateCreditScore();
      }
    }, 2000); // 2 second delay
    
    return () => clearTimeout(timeoutId);
  }, [
    formData.net_monthly_salary,
    formData.requested_amount,
    formData.loan_purpose,
    formData.source_of_income,
    formData.employment_start_date,
    formData.business_start_date,
    formData.previous_loan_taken,
    formData.crb_consent_given,
    formData.age,
    formData.dependents,
    formData.education_level,
    formData.residence_stability,
    formData.phone_stability,
    formData.income_stability,
    formData.previous_repayment_history,
    formData.has_collateral,
    formData.has_guarantors,
    formData.business_name,
    formData.business_type,
    formData.business_registration_number,
    formData.business_monthly_revenue,
    formData.business_monthly_expenses,
    formData.business_net_profit,
    formData.business_employees,
    formData.business_bank_statements,
    formData.business_tax_returns,
    guarantors.length,
    autoCalculationEnabled
  ]);

  const generateCRBReport = () => {
    // Simulate CRB report generation
    const crbScore = Math.floor(Math.random() * 200) + 300; // 300-500 range
    let crbRating = 'Poor';
    
    if (crbScore >= 450) crbRating = 'Excellent';
    else if (crbScore >= 400) crbRating = 'Good';
    else if (crbScore >= 350) crbRating = 'Fair';
    else if (crbScore >= 300) crbRating = 'Poor';
    else crbRating = 'Bad';
    
    setFormData(prev => ({
      ...prev,
      crb_report_available: true,
      crb_score: crbScore,
      crb_rating: crbRating
    }));
    
    toast.success(`CRB report generated: ${crbScore} (${crbRating})`);
  };

  const handleQuickApplicationSubmit = async (applicationData: any) => {
    try {
      setIsSubmitting(true);
      
      // Apply loyalty benefits
      await LoyaltyService.applyLoyaltyBenefits(applicationData.loan_application_id);
      
      // Insert the application
      const result = await insertApplication(applicationData);

      if (result) {
        toast.success('Quick application submitted successfully!');
        setShowQuickApplication(false);
        navigate('/staff/loan-applications');
      }
    } catch (error) {
      console.error('Error submitting quick application:', error);
      toast.error('Failed to submit quick application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    // Only require upfront fees payment confirmation if processing fee method is 'upfront'
    if (formData.processing_fee_method === 'upfront' && !formData.upfront_fees_paid) {
      toast.error('Please verify upfront fees payment before submitting');
      return;
    }
    
    if (!formData.crb_consent_given) {
      toast.error('Please provide CRB consent before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      const applicationId = `LA-${Date.now()}`;
      
      // Production mode - actual database insertion
      const applicationData = {
        application_id: applicationId,
        client_id: clientId,
        loan_product_id: formData.loan_product_id,
        requested_amount: parseFloat(formData.requested_amount),
        repayment_period_months: parseInt(formData.repayment_period_months),
        loan_purpose: formData.loan_purpose,
        affordable_repayment_amount: parseFloat(formData.repayment_capacity),
        source_of_income: formData.source_of_income,
        employment_company_name: formData.employment_company_name,
        employment_office_location: formData.employment_office_location,
        employment_position: formData.employment_position,
        employment_start_date: formData.employment_start_date || null,
        net_monthly_salary: parseFloat(formData.net_monthly_salary) || null,
        salary_slip_url: formData.salary_slip_url || null,
        business_name: formData.business_name || null,
        business_location: formData.business_location || null,
        average_monthly_income: parseFloat(formData.average_monthly_income) || null,
        business_type: formData.business_type || null,
        business_start_date: formData.business_start_date || null,
        previous_loan_taken: formData.previous_loan_taken,
        previous_institution_name: formData.previous_institution_name || null,
        previous_loan_date: formData.previous_loan_date || null,
        previous_loan_amount: parseFloat(formData.previous_loan_amount) || null,
        previous_repayment_amount: parseFloat(formData.previous_repayment_amount) || null,
        previous_repayment_date: formData.previous_repayment_date || null,
        application_fee: parseFloat(formData.application_fee) || 0,
        legal_fee: parseFloat(formData.legal_fee) || 0,
        processing_fee_method: formData.processing_fee_method,
        upfront_fees_paid: formData.upfront_fees_paid,
        payment_transaction_code: formData.payment_transaction_code || null,
        payment_receipt_url: formData.payment_receipt_url || null,
        collateral_type: formData.collateral_type || null,
        collateral_registration_number: formData.collateral_registration_number || null,
        collateral_appearance: formData.collateral_appearance || null,
        collateral_current_value: parseFloat(formData.collateral_current_value) || null,
        collateral_other_details: formData.collateral_other_details || null,
        assessment_score: formData.credit_score || null,
        risk_grade: formData.risk_rating || null,
        crb_consent_given: formData.crb_consent_given,
        crb_consent_timestamp: new Date().toISOString(),
        crb_status: formData.crb_report_available ? 'completed' : 'pending',
        status: 'submitted',
        approval_status: 'submitted',
        approval_level: 'staff'
      };
      
      // Insert main application
      const { data: insertedApplication, error: applicationError } = await supabase
        .from('loan_applications')
        .insert(applicationData)
        .select()
        .single();
      
      if (applicationError) {
        throw applicationError;
      }
      
      // Insert guarantors
      if (formData.guarantors && formData.guarantors.length > 0) {
        const guarantorData = formData.guarantors.map(guarantor => ({
          loan_application_id: insertedApplication.id,
          full_name: guarantor.full_name,
          residence: guarantor.residence,
          occupation: guarantor.occupation,
          company_business_name: guarantor.company_business_name,
          office_location: guarantor.office_location,
          relationship: guarantor.relationship
        }));
        
        const { error: guarantorError } = await supabase
          .from('loan_guarantors')
          .insert(guarantorData);
        
        if (guarantorError) {
          throw guarantorError;
        }
      }
      
      // Insert references
      if (formData.references && formData.references.length > 0) {
        const referenceData = formData.references.map((reference: any) => ({
          loan_application_id: insertedApplication.id,
          name: reference.name,
          phone_number: reference.phone_number,
          occupation: reference.occupation
        }));
        
        const { error: referenceError } = await supabase
          .from('loan_references')
          .insert(referenceData);
        
        if (referenceError) {
          throw referenceError;
        }
      }
      
      // Insert collateral assets
      if (formData.collateral_assets && formData.collateral_assets.length > 0) {
        const collateralData = formData.collateral_assets.map(asset => ({
          loan_application_id: insertedApplication.id,
          asset_type: asset.asset_type,
          value: parseFloat(asset.value),
          description: asset.asset_type
        }));
        
        const { error: collateralError } = await supabase
          .from('loan_collateral_assets')
          .insert(collateralData);
        
        if (collateralError) {
          throw collateralError;
        }
      }
      
      toast.success(`Loan application submitted successfully! Application ID: ${applicationId}. The application has been sent to the loan committee for review.`);
      
      // Clear draft after successful submission
      clearDraft();
      
      // Log success for debugging
      console.log('✅ Loan application submitted successfully:', {
        applicationId,
        insertedApplicationId: insertedApplication.id,
        guarantorsCount: formData.guarantors?.length || 0,
        referencesCount: formData.references?.length || 0,
        collateralAssetsCount: formData.collateral_assets?.length || 0
      });
      
      // Navigate back to loan applications list
      navigate('/staff/loan-applications');
      
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit loan application: ' + (error as any)?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!client) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }


  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/staff/loan-applications')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 hover:border-gray-400"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Applications</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Loan Application</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Features for Existing Customers */}
        {client?.client_category === 'existing' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Customer Loyalty Features
              </h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAnalytics(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Analytics className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickApplication(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>Quick Apply</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Customer Tier */}
              {customerTier && (
                <LoyaltyTierDisplay
                  tier={client.client_category}
                  status={client.status}
                  performanceScore={0}
                  lifetimeValue={0}
                  totalLoans={0}
                  compact={true}
                />
              )}

              {/* Pre-Approvals */}
              {preApprovals.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Pre-Approved Loans</h4>
                  {preApprovals.map((approval) => (
                    <div key={approval.id} className="text-sm text-green-700">
                      <div className="font-medium">
                        {new Intl.NumberFormat('en-TZ', {
                          style: 'currency',
                          currency: 'TZS',
                          minimumFractionDigits: 0
                        }).format(approval.pre_approved_amount)}
                      </div>
                      <div>Rate: {approval.max_interest_rate}%</div>
                      <div>Term: {approval.max_term_months} months</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Benefits */}
              {customerBenefits.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Active Benefits</h4>
                  {customerBenefits.slice(0, 3).map((benefit) => (
                    <div key={benefit.id} className="text-sm text-blue-700">
                      <div className="font-medium">{benefit.benefit_description}</div>
                      {benefit.benefit_percentage > 0 && (
                        <div>{benefit.benefit_percentage}% discount</div>
                      )}
                    </div>
                  ))}
                  {customerBenefits.length > 3 && (
                    <div className="text-xs text-blue-600 mt-1">
                      +{customerBenefits.length - 3} more benefits
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {!isDataLoaded && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
              <span className="text-yellow-800 font-medium">Loading client information and auto-populating form...</span>
            </div>
          </div>
        )}

        {/* Client Information Summary */}
        {client && isDataLoaded && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Client Information Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Client Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {`${client.first_name || ''} ${client.middle_name || ''} ${client.last_name || ''}`.trim() || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Client Type</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{client.client_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Phone Number</p>
                <p className="text-lg font-semibold text-gray-900">{client.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email Address</p>
                <p className="text-lg font-semibold text-gray-900">{client.email_address || 'N/A'}</p>
              </div>
            </div>
            
            {/* Employment/Business Information Preview */}
            {client.employment_status && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Employment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className="ml-2 capitalize">{client.employment_status}</span>
                  </div>
                  {client.employment_status === 'employed' && (
                    <>
                      <div>
                        <span className="font-medium text-gray-600">Employer:</span>
                        <span className="ml-2">{client.employer_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Position:</span>
                        <span className="ml-2">{client.occupation || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Monthly Income:</span>
                        <span className="ml-2 font-semibold text-green-600">
                          {client.monthly_income ? `TZS ${parseInt(client.monthly_income).toLocaleString()}` : 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                  {client.employment_status === 'self_employed' && (
                    <>
                      <div>
                        <span className="font-medium text-gray-600">Occupation:</span>
                        <span className="ml-2">{client.occupation || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Monthly Income:</span>
                        <span className="ml-2 font-semibold text-green-600">
                          {client.monthly_income ? `TZS ${parseInt(client.monthly_income).toLocaleString()}` : 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Corporate/Group Information Preview */}
            {(client.client_type === 'corporate' || client.client_type === 'group') && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-2">
                  {client.client_type === 'corporate' ? 'Business Information' : 'Group Information'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      {client.client_type === 'corporate' ? 'Company Name:' : 'Group Name:'}
                    </span>
                    <span className="ml-2">{client.company_name || client.group_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Registration Number:</span>
                    <span className="ml-2">{client.registration_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      {client.client_type === 'corporate' ? 'Business Type:' : 'Group Type:'}
                    </span>
                    <span className="ml-2">{client.business_type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Monthly Income:</span>
                    <span className="ml-2 font-semibold text-green-600">
                      {client.monthly_income ? `TZS ${parseInt(client.monthly_income).toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Draft Controls */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Save className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Draft Management</span>
              </div>
              {isDraft && (
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Draft Active</span>
                  {lastSaved && (
                    <span className="text-xs text-blue-600">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={saveDraft}
                className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </button>
              <button
                type="button"
                onClick={loadDraft}
                className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Load Draft
              </button>
              <button
                type="button"
                onClick={exportDraft}
                className="flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <label className="flex items-center px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importDraft}
                  className="hidden"
                />
              </label>
              {isDraft && (
                <button
                  type="button"
                  onClick={clearDraft}
                  className="flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Draft
                </button>
              )}
            </div>
          </div>
        </div>


        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Show full form for mobile, streamlined form for web */}
          {isMobile ? (
            // Full form for mobile users
            <>
              {/* Loan Details, Income Information, and Upfront Fees Payment - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Loan Details */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Loan Details
                  </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Product *</label>
                  <select
                    required
                    value={formData.loan_product_id}
                    onChange={(e) => setFormData({...formData, loan_product_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Loan Product</option>
                    {loanProducts?.map((product: any) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.interest_rate}% p.a.
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount of Loan Requested (TZS) *</label>
                  <input
                    type="number"
                    required
                    value={formData.requested_amount}
                    onChange={(e) => setFormData({...formData, requested_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter loan amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Loan *</label>
                  <input
                    type="text"
                    required
                    value={formData.loan_purpose}
                    onChange={(e) => setFormData({...formData, loan_purpose: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter loan purpose"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repayment Capacity (TZS) *</label>
                  <input
                    type="number"
                    required
                    value={formData.repayment_capacity}
                    onChange={(e) => setFormData({...formData, repayment_capacity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Amount you can repay without problems"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source of Income *</label>
                  <input
                    type="text"
                    required
                    value={formData.source_of_income}
                    onChange={(e) => setFormData({...formData, source_of_income: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Primary source of income"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Repayment Period (Months) *</label>
                  <input
                    type="number"
                    required
                    value={formData.repayment_period_months}
                    onChange={(e) => setFormData({...formData, repayment_period_months: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Repayment period in months"
                  />
                </div>
              </div>
            </div>

            {/* Income Information - Auto-populated from client data */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Income Information
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Auto-populated from client data
                </span>
              </h3>
              
              {/* Client Type Indicator */}
              {clientType && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      Client Type: {clientType.charAt(0).toUpperCase() + clientType.slice(1)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Source of Income - Read-only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source of Income</label>
                  <input
                    type="text"
                    value={formData.source_of_income ? formData.source_of_income.charAt(0).toUpperCase() + formData.source_of_income.slice(1).replace('_', ' ') : 'N/A'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    readOnly
                  />
                </div>

                {/* Employment Information - Show for employed individuals */}
                {formData.source_of_income === 'employment' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Net Monthly Salary (TZS)</label>
                      <input
                        type="text"
                        value={formData.net_monthly_salary ? `TZS ${parseInt(formData.net_monthly_salary).toLocaleString()}` : 'N/A'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Start Date</label>
                      <input
                        type="text"
                        value={formData.employment_start_date || 'N/A'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={formData.employment_company_name || 'N/A'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <input
                        type="text"
                        value={formData.employment_position || 'N/A'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Office Location</label>
                      <input
                        type="text"
                        value={formData.employment_office_location || 'N/A'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                  </>
                )}

                {/* Business Information - Show for self-employed, corporate, and group clients */}
                {(formData.source_of_income === 'business' || formData.source_of_income === 'group_activities') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {clientType === 'group' ? 'Group Name' : 'Business Name'}
                      </label>
                      <input
                        type="text"
                        value={formData.business_name || 'N/A'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {clientType === 'group' ? 'Group Location' : 'Business Location'}
                      </label>
                      <input
                        type="text"
                        value={formData.business_location || 'N/A'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Average Monthly Income (TZS)</label>
                      <input
                        type="text"
                        value={formData.average_monthly_income ? `TZS ${parseInt(formData.average_monthly_income).toLocaleString()}` : 'N/A'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {clientType === 'group' ? 'Group Type' : 'Business Type'}
                      </label>
                      <input
                        type="text"
                        value={formData.business_type || 'N/A'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {clientType === 'group' ? 'Group Start Date' : 'Business Start Date'}
                      </label>
                      <input
                        type="text"
                        value={formData.business_start_date || 'N/A'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        readOnly
                      />
                    </div>
                  </>
                )}

                {/* Repayment Capacity - Auto-calculated and read-only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repayment Capacity (TZS)</label>
                  <input
                    type="text"
                    value={formData.repayment_capacity ? `TZS ${parseInt(formData.repayment_capacity).toLocaleString()}` : 'N/A'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculated as 30% of monthly income
                  </p>
                </div>

              </div>
            </div>

            {/* Upfront Fees Payment */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Upfront Fees Payment
              </h3>
              <div className="space-y-4">
                <div className="mb-4">
                  <h4 className="text-md font-medium text-gray-900">Fee Amounts</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Application Fee (TZS) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.application_fee}
                      onChange={(e) => setFormData({...formData, application_fee: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter application fee amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the application fee amount</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Legal Fee (TZS) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.legal_fee}
                      onChange={(e) => setFormData({...formData, legal_fee: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter legal fee amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the legal fee amount</p>
                  </div>
                </div>
                
                {/* Processing Fee Collection Method */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Processing Fee Collection Method</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="processing_fee_method"
                          value="upfront"
                          checked={formData.processing_fee_method === 'upfront'}
                          onChange={(e) => setFormData({...formData, processing_fee_method: e.target.value})}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Pay Upfront (Recommended)
                        </span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="processing_fee_method"
                          value="deduct_at_disbursement"
                          checked={formData.processing_fee_method === 'deduct_at_disbursement'}
                          onChange={(e) => setFormData({...formData, processing_fee_method: e.target.value})}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Deduct at Disbursement
                        </span>
                      </label>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {formData.processing_fee_method === 'upfront' 
                        ? "Processing fee will be paid upfront with other fees"
                        : "Processing fee will be deducted from the loan amount at disbursement"
                      }
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800">Total Upfront Fees</div>
                  <div className="text-xl font-bold text-yellow-900">
                    {calculateTotalFees().toLocaleString()} TZS
                  </div>
                  {formData.processing_fee_method === 'deduct_at_disbursement' && (
                    <div className="text-sm text-orange-600 mt-1">
                      * Processing fee will be deducted at disbursement
                    </div>
                  )}
                </div>
                
                {/* Payment Verification - Only show when processing fee method is 'upfront' */}
                {formData.processing_fee_method === 'upfront' && (
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Payment Verification</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transaction Code
                        </label>
                        <input
                          type="text"
                          value={formData.payment_transaction_code}
                          onChange={(e) => setFormData({...formData, payment_transaction_code: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter transaction code from payment"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Receipt
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // In a real app, you'd upload this to your storage service
                              setFormData({...formData, payment_receipt_url: file.name});
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {formData.payment_receipt_url && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ Receipt uploaded: {formData.payment_receipt_url}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Confirmation checkbox - Only show when processing fee method is 'upfront' */}
                {formData.processing_fee_method === 'upfront' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="upfront_fees_paid"
                      checked={formData.upfront_fees_paid}
                      onChange={(e) => setFormData({...formData, upfront_fees_paid: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="upfront_fees_paid" className="text-sm font-medium text-gray-700">
                      I confirm that the total upfront fees have been paid
                    </label>
                  </div>
                )}

                {/* Show message when deduct at disbursement is selected */}
                {formData.processing_fee_method === 'deduct_at_disbursement' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Upfront Fees Will Be Deducted at Disbursement
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            Since you selected "Deduct at Disbursement", the total upfront fees of{' '}
                            <strong>{calculateTotalFees().toLocaleString()} TZS</strong> will be automatically 
                            deducted from your loan amount when it is disbursed. No upfront payment is required now.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>

          {/* Guarantor Details and Collateral Details - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Guarantor Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Guarantor Details
                </h3>
                <button
                  type="button"
                  onClick={addGuarantor}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Guarantor
                </button>
              </div>
              <div className="space-y-4">
                {formData.guarantors.map((guarantor, index) => (
                  <div key={guarantor.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Guarantor {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeGuarantor(guarantor.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={guarantor.full_name}
                          onChange={(e) => updateGuarantor(guarantor.id, 'full_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Residence *</label>
                        <input
                          type="text"
                          required
                          value={guarantor.residence}
                          onChange={(e) => updateGuarantor(guarantor.id, 'residence', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Occupation *</label>
                        <input
                          type="text"
                          required
                          value={guarantor.occupation}
                          onChange={(e) => updateGuarantor(guarantor.id, 'occupation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company/Business Name *</label>
                        <input
                          type="text"
                          required
                          value={guarantor.company_business_name}
                          onChange={(e) => updateGuarantor(guarantor.id, 'company_business_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Office Location *</label>
                        <input
                          type="text"
                          required
                          value={guarantor.office_location}
                          onChange={(e) => updateGuarantor(guarantor.id, 'office_location', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                        <input
                          type="text"
                          required
                          value={guarantor.relationship}
                          onChange={(e) => updateGuarantor(guarantor.id, 'relationship', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Collateral Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Collateral Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type of Collateral *</label>
                    <input
                      type="text"
                      required
                      value={formData.collateral_type}
                      onChange={(e) => setFormData({...formData, collateral_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Land, Vehicle, Property"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.collateral_registration_number}
                      onChange={(e) => setFormData({...formData, collateral_registration_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Appearance of Collateral *</label>
                    <input
                      type="text"
                      required
                      value={formData.collateral_appearance}
                      onChange={(e) => setFormData({...formData, collateral_appearance: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Physical description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (TZS) *</label>
                    <input
                      type="number"
                      required
                      value={formData.collateral_current_value}
                      onChange={(e) => setFormData({...formData, collateral_current_value: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Details</label>
                    <textarea
                      value={formData.collateral_other_details}
                      onChange={(e) => setFormData({...formData, collateral_other_details: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional information about the collateral"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Credit Scoring */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                AI-Powered Credit Scoring
              </h3>
              
              {/* Auto-calculation toggle */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto-calculation-mobile"
                    checked={autoCalculationEnabled}
                    onChange={(e) => setAutoCalculationEnabled(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="auto-calculation-mobile" className="text-sm font-medium text-gray-700">
                    Auto-calculate on form changes
                  </label>
                </div>
                <button
                  type="button"
                  onClick={calculateCreditScore}
                  disabled={isCalculatingScore}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isCalculatingScore ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    'Calculate Credit Score'
                  )}
                </button>
              </div>

              {/* Enhanced form fields for credit scoring */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your age"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Dependents
                  </label>
                  <input
                    type="number"
                    value={formData.dependents}
                    onChange={(e) => setFormData({...formData, dependents: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Number of dependents"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education Level
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => setFormData({...formData, education_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="diploma">Diploma</option>
                    <option value="degree">Degree</option>
                    <option value="masters">Masters</option>
                    <option value="phd">PhD</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years at Current Address
                  </label>
                  <input
                    type="number"
                    value={formData.residence_stability}
                    onChange={(e) => setFormData({...formData, residence_stability: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Years at current address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years with Same Phone Number
                  </label>
                  <input
                    type="number"
                    value={formData.phone_stability}
                    onChange={(e) => setFormData({...formData, phone_stability: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Years with same phone"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Income Stability (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.income_stability}
                    onChange={(e) => setFormData({...formData, income_stability: e.target.value})}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.income_stability}/10 - {parseInt(formData.income_stability) <= 3 ? 'Unstable' : parseInt(formData.income_stability) <= 6 ? 'Moderate' : 'Stable'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous Loan Repayment History
                  </label>
                  <select
                    value={formData.previous_repayment_history}
                    onChange={(e) => setFormData({...formData, previous_repayment_history: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="default">Default</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.has_collateral}
                      onChange={(e) => setFormData({...formData, has_collateral: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Has Collateral</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.has_guarantors}
                      onChange={(e) => setFormData({...formData, has_guarantors: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Has Guarantors</span>
                  </label>
                </div>
              </div>

              {/* Business Information Section - Show when business income or business loan */}
              {(formData.source_of_income === 'business' || 
                formData.loan_purpose?.toLowerCase().includes('business') ||
                formData.loan_purpose?.toLowerCase().includes('enterprise') ||
                formData.loan_purpose?.toLowerCase().includes('commercial')) && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">
                    Business Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter business name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Type
                      </label>
                      <select
                        value={formData.business_type}
                        onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select business type</option>
                        <option value="retail">Retail</option>
                        <option value="wholesale">Wholesale</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="services">Services</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="construction">Construction</option>
                        <option value="transport">Transport</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Registration Number
                      </label>
                      <input
                        type="text"
                        value={formData.business_registration_number}
                        onChange={(e) => setFormData({...formData, business_registration_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter registration number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Location
                      </label>
                      <input
                        type="text"
                        value={formData.business_location}
                        onChange={(e) => setFormData({...formData, business_location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter business location"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.business_start_date}
                        onChange={(e) => setFormData({...formData, business_start_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Revenue (TZS)
                      </label>
                      <input
                        type="number"
                        value={formData.business_monthly_revenue}
                        onChange={(e) => setFormData({...formData, business_monthly_revenue: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Monthly revenue"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Expenses (TZS)
                      </label>
                      <input
                        type="number"
                        value={formData.business_monthly_expenses}
                        onChange={(e) => setFormData({...formData, business_monthly_expenses: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Monthly expenses"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Employees
                      </label>
                      <input
                        type="number"
                        value={formData.business_employees}
                        onChange={(e) => setFormData({...formData, business_employees: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Number of employees"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.business_bank_statements}
                          onChange={(e) => setFormData({...formData, business_bank_statements: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Has Bank Statements</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.business_tax_returns}
                          onChange={(e) => setFormData({...formData, business_tax_returns: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Has Tax Returns</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
                
              {/* Enhanced results display */}
              {creditScoreResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-blue-600">Credit Score</div>
                      <div className="text-2xl font-bold text-blue-900">{creditScoreResult.score}</div>
                      <div className="text-xs text-blue-700">Confidence: {Math.round(creditScoreResult.confidence * 100)}%</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-orange-600">Risk Rating</div>
                      <div className="text-2xl font-bold text-orange-900 capitalize">{creditScoreResult.riskRating}</div>
                      <div className="text-xs text-orange-700">Default Risk: {Math.round(creditScoreResult.probabilityOfDefault * 100)}%</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-green-600">Positive Factors</div>
                      <div className="text-sm text-green-700">
                        {creditScoreResult.factors.positive.slice(0, 2).join(', ')}
                        {creditScoreResult.factors.positive.length > 2 && '...'}
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-red-600">Risk Factors</div>
                      <div className="text-sm text-red-700">
                        {creditScoreResult.factors.negative.slice(0, 2).join(', ')}
                        {creditScoreResult.factors.negative.length > 2 && '...'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed factors */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {creditScoreResult.factors.positive.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Positive Factors</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          {creditScoreResult.factors.positive.map((factor, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {creditScoreResult.factors.negative.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Risk Factors</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {creditScoreResult.factors.negative.map((factor, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {creditScoreResult.recommendations.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {creditScoreResult.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CRB Report Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              CRB Report Card
            </h3>
            <div className="space-y-4">
              <button
                type="button"
                onClick={generateCRBReport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Generate CRB Report
              </button>
              
              {formData.crb_report_available && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-600">CRB Score</div>
                    <div className="text-2xl font-bold text-green-900">{formData.crb_score}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-purple-600">CRB Rating</div>
                    <div className="text-2xl font-bold text-purple-900">{formData.crb_rating}</div>
                  </div>
                </div>
              )}
              
              {/* CRB Consent Checkbox */}
              <div className="border-t pt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="crb_consent"
                    checked={formData.crb_consent_given}
                    onChange={(e) => setFormData({...formData, crb_consent_given: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="crb_consent" className="text-sm font-medium text-gray-700">
                    I consent to credit bureau checks and data sharing *
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This consent is required by the Microfinance Act 2018 and will be logged with timestamp and AES-256 encryption per Data Protection Act 2022.
                </p>
              </div>
            </div>
          </div>
          
              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/staff/loan-applications')}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || insertLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || insertLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </>
          ) : (
            // Streamlined form for web users - only specified sections
            <>
              {/* Section 4: Loan Details */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  4. Loan Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loan Product *</label>
                    <select
                      required
                      value={formData.loan_product_id}
                      onChange={(e) => setFormData({...formData, loan_product_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Loan Product</option>
                      {loanProducts?.map((product: any) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.interest_rate}% p.a.
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount of Loan Requested (TZS) *</label>
                    <input
                      type="number"
                      required
                      value={formData.requested_amount}
                      onChange={(e) => setFormData({...formData, requested_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter loan amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Loan *</label>
                    <input
                      type="text"
                      required
                      value={formData.loan_purpose}
                      onChange={(e) => setFormData({...formData, loan_purpose: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter loan purpose"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repayment Capacity (TZS) *</label>
                    <input
                      type="number"
                      required
                      value={formData.repayment_capacity}
                      onChange={(e) => setFormData({...formData, repayment_capacity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Amount you can repay without problems"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source of Income *</label>
                    <input
                      type="text"
                      required
                      value={formData.source_of_income}
                      onChange={(e) => setFormData({...formData, source_of_income: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Primary source of income"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loan Repayment Period (Months) *</label>
                    <input
                      type="number"
                      required
                      value={formData.repayment_period_months}
                      onChange={(e) => setFormData({...formData, repayment_period_months: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Repayment period in months"
                    />
                  </div>
                </div>
              </div>

              {/* Income Information - Auto-populated from client data */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Income Information
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Auto-populated from client data
                  </span>
                </h3>
                
                {/* Client Type Indicator */}
                {clientType && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">
                        Client Type: {clientType.charAt(0).toUpperCase() + clientType.slice(1)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Source of Income - Read-only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source of Income</label>
                    <input
                      type="text"
                      value={formData.source_of_income ? formData.source_of_income.charAt(0).toUpperCase() + formData.source_of_income.slice(1).replace('_', ' ') : 'N/A'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      readOnly
                    />
                  </div>

                  {/* Employment Information - Show for employed individuals */}
                  {formData.source_of_income === 'employment' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Net Monthly Salary (TZS)</label>
                        <input
                          type="text"
                          value={formData.net_monthly_salary ? `TZS ${parseInt(formData.net_monthly_salary).toLocaleString()}` : 'N/A'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employment Start Date</label>
                        <input
                          type="text"
                          value={formData.employment_start_date || 'N/A'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input
                          type="text"
                          value={formData.employment_company_name || 'N/A'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                        <input
                          type="text"
                          value={formData.employment_position || 'N/A'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Office Location</label>
                        <input
                          type="text"
                          value={formData.employment_office_location || 'N/A'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          readOnly
                        />
                      </div>
                    </>
                  )}

                  {/* Business Information - Show for self-employed, corporate, and group clients */}
                  {(formData.source_of_income === 'business' || formData.source_of_income === 'group_activities') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {clientType === 'group' ? 'Group Name' : 'Business Name'}
                        </label>
                        <input
                          type="text"
                          value={formData.business_name || 'N/A'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {clientType === 'group' ? 'Group Location' : 'Business Location'}
                        </label>
                        <input
                          type="text"
                          value={formData.business_location || 'N/A'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Average Monthly Income (TZS)</label>
                        <input
                          type="text"
                          value={formData.average_monthly_income ? `TZS ${parseInt(formData.average_monthly_income).toLocaleString()}` : 'N/A'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {clientType === 'group' ? 'Group Type' : 'Business Type'}
                        </label>
                        <input
                          type="text"
                          value={formData.business_type || 'N/A'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {clientType === 'group' ? 'Group Start Date' : 'Business Start Date'}
                        </label>
                        <input
                          type="text"
                          value={formData.business_start_date || 'N/A'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                          readOnly
                        />
                      </div>
                    </>
                  )}

                </div>
              </div>

              {/* Section 5: Upfront Fees Payment */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  5. Upfront Fees Payment
                </h3>
                <div className="space-y-4">
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-900">Fee Amounts</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Application Fee (TZS) *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.application_fee}
                        onChange={(e) => setFormData({...formData, application_fee: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter application fee amount"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter the application fee amount</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Legal Fee (TZS) *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.legal_fee}
                        onChange={(e) => setFormData({...formData, legal_fee: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter legal fee amount"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter the legal fee amount</p>
                    </div>
                  </div>
                  
                  {/* Processing Fee Collection Method */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Processing Fee Collection Method</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="processing_fee_method"
                            value="upfront"
                            checked={formData.processing_fee_method === 'upfront'}
                            onChange={(e) => setFormData({...formData, processing_fee_method: e.target.value})}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Pay Upfront (Recommended)
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="processing_fee_method"
                            value="deduct_at_disbursement"
                            checked={formData.processing_fee_method === 'deduct_at_disbursement'}
                            onChange={(e) => setFormData({...formData, processing_fee_method: e.target.value})}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Deduct at Disbursement
                          </span>
                        </label>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        {formData.processing_fee_method === 'upfront' 
                          ? "Processing fee will be paid upfront with other fees"
                          : "Processing fee will be deducted from the loan amount at disbursement"
                        }
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800">Total Upfront Fees</div>
                    <div className="text-xl font-bold text-yellow-900">
                      {calculateTotalFees().toLocaleString()} TZS
                    </div>
                    {formData.processing_fee_method === 'deduct_at_disbursement' && (
                      <div className="text-sm text-orange-600 mt-1">
                        * Processing fee will be deducted at disbursement
                      </div>
                    )}
                  </div>
                  
                  {/* Payment Verification - Only show when processing fee method is 'upfront' */}
                  {formData.processing_fee_method === 'upfront' && (
                    <div className="border-t pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Payment Verification</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transaction Code
                          </label>
                          <input
                            type="text"
                            value={formData.payment_transaction_code}
                            onChange={(e) => setFormData({...formData, payment_transaction_code: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter transaction code from payment"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Receipt
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // In a real app, you'd upload this to your storage service
                                setFormData({...formData, payment_receipt_url: file.name});
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {formData.payment_receipt_url && (
                            <p className="text-sm text-green-600 mt-1">
                              ✓ Receipt uploaded: {formData.payment_receipt_url}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Confirmation checkbox - Only show when processing fee method is 'upfront' */}
                  {formData.processing_fee_method === 'upfront' && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="upfront_fees_paid"
                        checked={formData.upfront_fees_paid}
                        onChange={(e) => setFormData({...formData, upfront_fees_paid: e.target.checked})}
                        className="mr-2"
                      />
                      <label htmlFor="upfront_fees_paid" className="text-sm font-medium text-gray-700">
                        I confirm that the total upfront fees have been paid
                      </label>
                    </div>
                  )}

                  {/* Show message when deduct at disbursement is selected */}
                  {formData.processing_fee_method === 'deduct_at_disbursement' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Upfront Fees Will Be Deducted at Disbursement
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>
                              Since you selected "Deduct at Disbursement", the total upfront fees of{' '}
                              <strong>{calculateTotalFees().toLocaleString()} TZS</strong> will be automatically 
                              deducted from your loan amount when it is disbursed. No upfront payment is required now.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 6: Guarantor Details */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    6. Guarantor Details
                  </h3>
                  <button
                    type="button"
                    onClick={addGuarantor}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Guarantor
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.guarantors.map((guarantor, index) => (
                    <div key={guarantor.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Guarantor {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeGuarantor(guarantor.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={guarantor.full_name}
                            onChange={(e) => updateGuarantor(guarantor.id, 'full_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Residence *</label>
                          <input
                            type="text"
                            required
                            value={guarantor.residence}
                            onChange={(e) => updateGuarantor(guarantor.id, 'residence', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Occupation *</label>
                          <input
                            type="text"
                            required
                            value={guarantor.occupation}
                            onChange={(e) => updateGuarantor(guarantor.id, 'occupation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company/Business Name *</label>
                          <input
                            type="text"
                            required
                            value={guarantor.company_business_name}
                            onChange={(e) => updateGuarantor(guarantor.id, 'company_business_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Office Location *</label>
                          <input
                            type="text"
                            required
                            value={guarantor.office_location}
                            onChange={(e) => updateGuarantor(guarantor.id, 'office_location', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                          <input
                            type="text"
                            required
                            value={guarantor.relationship}
                            onChange={(e) => updateGuarantor(guarantor.id, 'relationship', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 7: Collateral Details */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  7. Collateral Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type of Collateral *</label>
                      <input
                        type="text"
                        required
                        value={formData.collateral_type}
                        onChange={(e) => setFormData({...formData, collateral_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Land, Vehicle, Property"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                      <input
                        type="text"
                        required
                        value={formData.collateral_registration_number}
                        onChange={(e) => setFormData({...formData, collateral_registration_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Appearance of Collateral *</label>
                      <input
                        type="text"
                        required
                        value={formData.collateral_appearance}
                        onChange={(e) => setFormData({...formData, collateral_appearance: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Physical description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (TZS) *</label>
                      <input
                        type="number"
                        required
                        value={formData.collateral_current_value}
                        onChange={(e) => setFormData({...formData, collateral_current_value: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Other Details</label>
                      <textarea
                        value={formData.collateral_other_details}
                        onChange={(e) => setFormData({...formData, collateral_other_details: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Additional information about the collateral"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 8: CRB Report Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  8. CRB Report Card
                </h3>
                <div className="space-y-4">
                  {/* CRB Consent Checkbox - moved above Generate button */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="crb_consent"
                        checked={formData.crb_consent_given}
                        onChange={(e) => setFormData({...formData, crb_consent_given: e.target.checked})}
                        className="mr-2"
                      />
                      <label htmlFor="crb_consent" className="text-sm font-medium text-gray-700">
                        I consent to credit bureau checks and data sharing *
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This consent is required by the Microfinance Act 2018 and will be logged with timestamp and AES-256 encryption per Data Protection Act 2022.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={generateCRBReport}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Generate CRB Report
                  </button>
                  
                  {formData.crb_report_available && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-green-600">CRB Score</div>
                        <div className="text-2xl font-bold text-green-900">{formData.crb_score}</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-purple-600">CRB Rating</div>
                        <div className="text-2xl font-bold text-purple-900">{formData.crb_rating}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 9: Automated Credit Scoring */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  9. Automated Credit Scoring
                </h3>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={calculateCreditScore}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Calculate Credit Score
                  </button>
                  
                  {formData.credit_score > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-600">Credit Score</div>
                        <div className="text-2xl font-bold text-blue-900">{formData.credit_score}</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-orange-600">Risk Rating</div>
                        <div className="text-2xl font-bold text-orange-900">{formData.risk_rating}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-600">Key Factors</div>
                        <div className="text-sm text-gray-900">{formData.credit_factors}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>


              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/staff/loan-applications')}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || insertLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || insertLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Quick Application Modal */}
        {showQuickApplication && client && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <QuickApplicationForm
                customer={client}
                onApplicationSubmit={handleQuickApplicationSubmit}
                onCancel={() => setShowQuickApplication(false)}
              />
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalytics && client && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <CustomerAnalytics
                clientId={client.id}
                onClose={() => setShowAnalytics(false)}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StaffLoanApplication;