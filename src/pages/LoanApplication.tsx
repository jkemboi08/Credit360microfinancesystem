import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { supabase } from '../lib/supabaseClient';
import { DraftStorage } from '../utils/draftStorage';
import toast from 'react-hot-toast';
import {
  User,
  DollarSign,
  Calendar,
  FileText,
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calculator,
  CreditCard,
  Upload,
  Camera,
  Fingerprint,
  Building,
  Users as UsersIcon,
  Home,
  Phone,
  Mail,
  Clock,
  Eye,
  Scan,
  Brain,
  Target,
  BarChart3,
  Send,
  Database
} from 'lucide-react';

const LoanApplication: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clientId: urlClientId } = useParams<{ clientId: string }>();
  
  // Check if we're editing an existing application
  const editApplicationId = searchParams.get('edit');
  const searchClientId = searchParams.get('client');
  const clientId = urlClientId || searchClientId;
  const isEditMode = Boolean(editApplicationId);
  
  const [formData, setFormData] = useState({
    // Personal Details
    fullName: '',
    nationalId: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    photo: null,
    fingerprint: null,
    
    // Employment Information
    companyName: '',
    officeLocation: '',
    position: '',
    employmentStartDate: '',
    netMonthlySalary: '',
    salarySlip: null,
    
    // Business Information
    businessName: '',
    businessLocation: '',
    averageMonthlyIncome: '',
    businessType: '',
    businessStartDate: '',
    
    // Loan Details
    loanAmount: '',
    repaymentPeriod: '',
    loanPurpose: '',
    loanPurposeOther: '',
    productId: '',
    affordableRepayment: '',
    sourceOfIncome: '',
    
    // Guarantor Information
    guarantorName: '',
    guarantorNationalId: '',
    guarantorPhone: '',
    guarantorAddress: '',
    guarantorRelationship: '',
    guarantorRelationshipOther: '',
    
    // Credit History
    previousLoan: false,
    institutionName: '',
    loanTakenDate: '',
    previousLoanAmount: '',
    repaymentAmount: '',
    repaymentDate: '',
    
    // Collateral Information
    collateralType: '',
    collateralTypeOther: '',
    registrationNumber: '',
    collateralDescription: '',
    currentValue: '',
    collateralDocument: null,
    
    // Consent
    crbConsent: false,
    
    // Selected Product
    selectedProduct: ''
  });

  const [validationErrors, setValidationErrors] = useState<any>({});
  const [showTermsPreview, setShowTermsPreview] = useState(false);
  const [showAmortization, setShowAmortization] = useState(false);
  const [loanSchedule, setLoanSchedule] = useState<any[]>([]);
  const [nidaStatus, setNidaStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  
  // Enhanced workflow states
  const [biometricStatus, setBiometricStatus] = useState<'pending' | 'verified' | 'failed' | 'not_required'>('pending');
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [riskRating, setRiskRating] = useState<string>('');
  const [creditFactors, setCreditFactors] = useState<string[]>([]);
  const [isDataEnrichmentComplete, setIsDataEnrichmentComplete] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'draft' | 'submitted' | 'pending_review' | 'approved' | 'rejected'>('draft');
  const [showCreditScoring, setShowCreditScoring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Fetch existing application data if in edit mode
  const { data: existingApplication, loading: applicationLoading } = useSupabaseQuery('loan_applications', {
    select: '*',
    filter: [{ column: 'id', operator: 'eq', value: editApplicationId }],
    enabled: Boolean(editApplicationId)
  });

  // Fetch client data if we have a clientId (either for edit mode or new application)
  const { data: existingClient, loading: clientLoading } = useSupabaseQuery('clients', {
    select: '*',
    filter: [{ column: 'id', operator: 'eq', value: clientId }],
    enabled: Boolean(clientId)
  });

  // Load existing data when in edit mode
  useEffect(() => {
    if (isEditMode && existingApplication && existingApplication.length > 0 && existingClient && existingClient.length > 0) {
      const app = existingApplication[0];
      const client = existingClient[0];
      
      console.log('Loading existing application data:', { app, client });
      
      // Populate form with existing data
      setFormData({
        // Personal Details
        fullName: client.full_name || client.first_name + ' ' + client.last_name || '',
        nationalId: client.national_id_number || '',
        phoneNumber: client.phone_number || '',
        address: client.street_name + ' ' + client.house_number + ', ' + client.area_of_residence || '',
        dateOfBirth: client.date_of_birth || '',
        photo: null,
        fingerprint: null,
        
        // Employment Information
        companyName: client.company_name || '',
        officeLocation: client.area_of_residence || '',
        position: client.position || '',
        netMonthlySalary: client.net_monthly_salary || '',
        businessName: client.business_name || '',
        businessType: client.type_of_business || '',
        averageMonthlyIncome: client.average_monthly_income || '',
        
        // Loan Details
        loanAmount: app.requested_amount || '',
        loanPurpose: app.loan_purpose || '',
        repaymentPeriod: app.term_months || '',
        productId: app.product_id || '',
        
        // Guarantor Information
        guarantorName: app.guarantor_name || '',
        guarantorPhone: app.guarantor_phone || '',
        guarantorAddress: app.guarantor_address || '',
        guarantorRelationship: app.guarantor_relationship || '',
        
        // Credit History
        previousLoan: app.previous_loan || false,
        institutionName: app.previous_institution || '',
        loanTakenDate: app.previous_loan_date || '',
        previousLoanAmount: app.previous_loan_amount || '',
        repaymentStatus: app.previous_loan_status || '',
        
        // Consent
        crbConsent: app.crb_consent || false
      });
      
      // Set other state values
      setCreditScore(app.credit_score || null);
      setRiskRating(app.risk_grade || '');
      setApplicationStatus(app.status || 'draft');
      
      setIsLoading(false);
    }
  }, [isEditMode, existingApplication, existingClient]);

  // Load client data for new application
  useEffect(() => {
    if (!isEditMode && existingClient && existingClient.length > 0) {
      const client = existingClient[0];
      
      console.log('Loading client data for new application:', { client });
      
      // Pre-populate form with client data
      setFormData(prev => ({
        ...prev,
        // Personal Details
        fullName: client.full_name || client.first_name + ' ' + client.last_name || '',
        nationalId: client.national_id_number || '',
        phoneNumber: client.phone_number || '',
        address: client.street_name + ' ' + client.house_number + ', ' + client.area_of_residence || '',
        dateOfBirth: client.date_of_birth || '',
        
        // Employment Information
        companyName: client.company_name || '',
        officeLocation: client.area_of_residence || '',
        position: client.position || '',
        netMonthlySalary: client.net_monthly_salary || '',
        businessName: client.business_name || '',
        businessType: client.type_of_business || '',
        averageMonthlyIncome: client.average_monthly_income || ''
      }));
      
      setIsLoading(false);
    }
  }, [isEditMode, existingClient]);

  // Fetch loan products from database
  const { data: loanProducts, loading: productsLoading } = useSupabaseQuery('loan_products', {
    select: 'id, name, min_amount, max_amount, interest_rate, tenor_max_months',
    orderBy: { column: 'name', ascending: true }
  });

  // Generate repayment period options (1-12 months)
  const repaymentPeriods = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: { 
      en: `${i + 1} ${i === 0 ? 'month' : 'months'}`, 
      sw: `${i + 1} ${i === 0 ? 'mwezi' : 'miezi'}` 
    }
  }));

  const loanPurposes = [
    { value: 'business_expansion', label: { en: 'Business Expansion', sw: 'Kupanua Biashara' } },
    { value: 'agriculture', label: { en: 'Agriculture', sw: 'Kilimo' } },
    { value: 'education', label: { en: 'Education', sw: 'Elimu' } },
    { value: 'emergency', label: { en: 'Emergency', sw: 'Dharura' } },
    { value: 'personal', label: { en: 'Personal Use', sw: 'Matumizi ya Kibinafsi' } },
    { value: 'working_capital', label: { en: 'Working Capital', sw: 'Mtaji wa Kazi' } },
    { value: 'equipment_purchase', label: { en: 'Equipment Purchase', sw: 'Kununua Vifaa' } },
    { value: 'inventory', label: { en: 'Inventory', sw: 'Malighafi' } },
    { value: 'medical', label: { en: 'Medical', sw: 'Matibabu' } },
    { value: 'construction', label: { en: 'Construction', sw: 'Ujenzi' } },
    { value: 'other', label: { en: 'Other', sw: 'Mwingine' } }
  ];

  const businessTypes = [
    { value: 'retail', label: { en: 'Retail Trade', sw: 'Biashara ya Rejareja' } },
    { value: 'agriculture', label: { en: 'Agriculture', sw: 'Kilimo' } },
    { value: 'manufacturing', label: { en: 'Manufacturing', sw: 'Utengenezaji' } },
    { value: 'services', label: { en: 'Services', sw: 'Huduma' } },
    { value: 'transport', label: { en: 'Transport', sw: 'Usafiri' } },
    { value: 'other', label: { en: 'Other', sw: 'Mengineyo' } }
  ];

  const collateralTypes = [
    { value: 'vehicle', label: { en: 'Vehicle', sw: 'Gari' } },
    { value: 'property', label: { en: 'Property', sw: 'Mali' } },
    { value: 'equipment', label: { en: 'Equipment', sw: 'Vifaa' } },
    { value: 'inventory', label: { en: 'Inventory', sw: 'Bidhaa' } },
    { value: 'other', label: { en: 'Other', sw: 'Mengineyo' } }
  ];

  const guarantorRelationships = [
    { value: 'family', label: { en: 'Family Member', sw: 'Mwanafamilia' } },
    { value: 'colleague', label: { en: 'Colleague', sw: 'Mwenzangu Kazini' } },
    { value: 'friend', label: { en: 'Friend', sw: 'Rafiki' } },
    { value: 'business_partner', label: { en: 'Business Partner', sw: 'Mshirika wa Biashara' } },
    { value: 'other', label: { en: 'Other', sw: 'Mwingine' } }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev: any) => ({ ...prev, [field]: null }));
    }

    // Trigger NIDA validation for National ID
    if (field === 'nationalId' && value.length >= 20) {
      validateNIDA(value);
    }

    // Generate amortization when loan amount or product changes
    if ((field === 'loanAmount' || field === 'selectedProduct') && formData.selectedProduct && formData.loanAmount) {
      generateAmortizationSchedule();
    }
  };

  const validateNIDA = async (nid: string) => {
    setNidaStatus('pending');
    // Mock NIDA validation
    setTimeout(() => {
      if (nid.length === 20) {
        setNidaStatus('verified');
        // Trigger data enrichment after NIDA verification
        performDataEnrichment(nid);
      } else {
        setNidaStatus('failed');
      }
    }, 2000);
  };

  const performDataEnrichment = async (nid: string) => {
    // Mock data enrichment process
    const enrichmentSteps = [
      'Checking existing client records',
      'Verifying identity against national database',
      'Retrieving historical loan data',
      'Updating client profile'
    ];
    
    console.log('Performing data enrichment:', enrichmentSteps);
    
    setTimeout(() => {
      setIsDataEnrichmentComplete(true);
      // Trigger biometric verification after data enrichment
      if (formData.fingerprint) {
        performBiometricVerification();
      }
    }, 3000);
  };

  const performBiometricVerification = async () => {
    setBiometricStatus('pending');
    
    // Mock biometric verification process
    const biometricSteps = [
      'Capturing fingerprint scan',
      'Processing biometric data',
      'Matching against enrolled profiles',
      'Verifying identity match'
    ];
    
    console.log('Performing biometric verification:', biometricSteps);
    
    setTimeout(() => {
      // Mock verification result
      const isMatch = Math.random() > 0.1; // 90% success rate for demo
      if (isMatch) {
        setBiometricStatus('verified');
        // Trigger credit scoring after biometric verification
        performCreditScoring();
      } else {
        setBiometricStatus('failed');
        alert('Biometric verification failed. Please try again or contact support.');
      }
    }, 4000);
  };

  const performCreditScoring = async () => {
    setShowCreditScoring(true);
    
    // Mock credit scoring algorithm
    const scoringSteps = [
      'Analyzing historical repayment data',
      'Calculating debt-to-income ratio',
      'Evaluating payment behavior patterns',
      'Assessing income stability',
      'Generating risk rating'
    ];
    
    console.log('Performing credit scoring:', scoringSteps);
    
    setTimeout(() => {
      // Mock credit score calculation
      const baseScore = 600;
      const paymentHistory = formData.previousLoan ? 85 : 70;
      const incomeStability = formData.netMonthlySalary ? 90 : 60;
      const debtRatio = formData.affordableRepayment ? 
        Math.min(100, (parseFloat(formData.affordableRepayment) / (parseFloat(formData.netMonthlySalary) || 1)) * 100) : 50;
      
      const calculatedScore = Math.min(850, baseScore + paymentHistory + incomeStability - debtRatio);
      const riskLevel = calculatedScore >= 750 ? 'Low' : calculatedScore >= 650 ? 'Medium' : 'High';
      
      setCreditScore(calculatedScore);
      setRiskRating(riskLevel);
      
      // Generate credit factors
      const factors = [];
      if (paymentHistory >= 80) factors.push('Good repayment history');
      if (incomeStability >= 80) factors.push('Stable income source');
      if (debtRatio <= 40) factors.push('Low debt-to-income ratio');
      if (formData.previousLoan) factors.push('Previous loan experience');
      if (calculatedScore < 650) factors.push('High debt-to-income ratio');
      if (calculatedScore < 600) factors.push('Limited credit history');
      
      setCreditFactors(factors);
    }, 5000);
  };

  const generateAmortizationSchedule = () => {
    const product = loanProducts.find(p => p.id === formData.selectedProduct);
    if (!product || !formData.loanAmount) return;

    const principal = parseFloat(formData.loanAmount);
    const monthlyRate = product.interestRate / 100 / 12;
    const periods = 12; // Default to 12 months
    
    let schedule = [];
    let balance = principal;

    if (product.id === 'sharia') {
      // Murabaha calculation
      const totalProfit = principal * (product.profitMargin / 100);
      const totalAmount = principal + totalProfit;
      const monthlyPayment = totalAmount / periods;

      for (let i = 1; i <= periods; i++) {
        const profitPortion = totalProfit / periods;
        const principalPortion = principal / periods;
        balance -= principalPortion;

        schedule.push({
          month: i,
          payment: monthlyPayment,
          principal: principalPortion,
          profit: profitPortion,
          balance: Math.max(0, balance)
        });
      }
    } else {
      // Conventional loan calculation
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, periods)) / (Math.pow(1 + monthlyRate, periods) - 1);

      for (let i = 1; i <= periods; i++) {
        const interest = balance * monthlyRate;
        const principalPayment = monthlyPayment - interest;
        balance -= principalPayment;

        schedule.push({
          month: i,
          payment: monthlyPayment,
          principal: principalPayment,
          interest: interest,
          balance: Math.max(0, balance)
        });
      }
    }

    setLoanSchedule(schedule);
  };

  const validateForm = () => {
    const errors: any = {};

    // Personal Details validation
    if (!formData.fullName) errors.fullName = language === 'en' ? 'Full name is required' : 'Jina kamili linahitajika';
    if (!formData.nationalId) errors.nationalId = language === 'en' ? 'National ID is required' : 'Kitambulisho cha taifa kinahitajika';
    if (!formData.phoneNumber) errors.phoneNumber = language === 'en' ? 'Phone number is required' : 'Namba ya simu inahitajika';
    if (!formData.address) errors.address = language === 'en' ? 'Address is required' : 'Anwani inahitajika';
    if (!formData.dateOfBirth) errors.dateOfBirth = language === 'en' ? 'Date of birth is required' : 'Tarehe ya kuzaliwa inahitajika';

    // Age validation (≥ 18)
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        errors.dateOfBirth = language === 'en' ? 'Must be 18 years or older' : 'Lazima uwe na umri wa miaka 18 au zaidi';
      }
    }

    // Loan Details validation
    if (!formData.loanAmount) errors.loanAmount = language === 'en' ? 'Loan amount is required' : 'Kiasi cha mkopo kinahitajika';
    if (!formData.productId) errors.productId = language === 'en' ? 'Please select a loan product' : 'Tafadhali chagua aina ya mkopo';
    if (!formData.repaymentPeriod) errors.repaymentPeriod = language === 'en' ? 'Repayment period is required' : 'Muda wa kulipa mkopo unahitajika';
    if (!formData.loanPurpose) errors.loanPurpose = language === 'en' ? 'Loan purpose is required' : 'Dhumuni la mkopo linahitajika';
    
    // Validate "Other" fields
    if (formData.loanPurpose === 'other' && !formData.loanPurposeOther.trim()) {
      errors.loanPurposeOther = language === 'en' ? 'Please specify the loan purpose' : 'Tafadhali eleza dhumuni la mkopo';
    }
    if (formData.guarantorRelationship === 'other' && !formData.guarantorRelationshipOther.trim()) {
      errors.guarantorRelationshipOther = language === 'en' ? 'Please specify the relationship' : 'Tafadhali eleza uhusiano';
    }
    if (formData.collateralType === 'other' && !formData.collateralTypeOther.trim()) {
      errors.collateralTypeOther = language === 'en' ? 'Please specify the collateral type' : 'Tafadhali eleza aina ya dhamana';
    }

    // CRB Consent validation
    if (!formData.crbConsent) errors.crbConsent = language === 'en' ? 'CRB consent is required' : 'Idhini ya CRB inahitajika';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Draft functionality
  const saveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const success = DraftStorage.saveDraft('loan', formData, 1, {});
      
      if (success) {
        setHasDraft(true);
        toast.success('Draft saved successfully!');
      } else {
        toast.error('Failed to save draft. Please try again.');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Error saving draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };


  // Check for existing draft on component mount
  React.useEffect(() => {
    const draft = DraftStorage.loadDraft('loan');
    if (draft) {
      setHasDraft(true);
    }
  }, []);

  // Auto-save draft when form data changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData && Object.keys(formData).length > 1) {
        DraftStorage.saveDraft('loan', formData, 1, {});
        setHasDraft(true);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        if (isEditMode) {
          // Update existing application
          const { error: updateError } = await supabase
            .from('loan_applications')
            .update({
              requested_amount: parseFloat(formData.loanAmount),
              loan_purpose: formData.loanPurpose,
              term_months: parseInt(formData.repaymentPeriod),
              product_id: formData.productId,
              guarantor_name: formData.guarantorName,
              guarantor_phone: formData.guarantorPhone,
              guarantor_address: formData.guarantorAddress,
              guarantor_relationship: formData.guarantorRelationship,
              previous_loan: formData.previousLoan,
              previous_institution: formData.institutionName,
              previous_loan_date: formData.loanTakenDate,
              previous_loan_amount: formData.loanAmount,
              previous_loan_status: formData.repaymentStatus,
              crb_consent: formData.crbConsent,
              status: 'submitted',
              updated_at: new Date().toISOString()
            })
            .eq('id', editApplicationId);

          if (updateError) {
            throw updateError;
          }

          // Clear draft on successful update
          DraftStorage.clearDraft('loan');
          setHasDraft(false);
          toast.success('Application updated successfully!');
          navigate('/staff/loan-applications?tab=applications');
        } else {
          // Create new application
          const { error: insertError } = await supabase
            .from('loan_applications')
            .insert({
              client_id: clientId,
              requested_amount: parseFloat(formData.loanAmount),
              loan_purpose: formData.loanPurpose,
              term_months: parseInt(formData.repaymentPeriod),
              product_id: formData.productId,
              guarantor_name: formData.guarantorName,
              guarantor_phone: formData.guarantorPhone,
              guarantor_address: formData.guarantorAddress,
              guarantor_relationship: formData.guarantorRelationship,
              previous_loan: formData.previousLoan,
              previous_institution: formData.institutionName,
              previous_loan_date: formData.loanTakenDate,
              previous_loan_amount: formData.loanAmount,
              previous_loan_status: formData.repaymentStatus,
              crb_consent: formData.crbConsent,
              status: 'submitted',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            throw insertError;
          }

          // Clear draft on successful submission
          DraftStorage.clearDraft('loan');
          setHasDraft(false);
          toast.success('Application submitted successfully!');
          navigate('/staff/loan-applications?tab=applications');
        }
        
      } catch (error) {
        console.error('Error submitting application:', error);
        toast.error('Error submitting application. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const selectedProduct = loanProducts.find(p => p.id === formData.selectedProduct);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {isEditMode 
              ? (language === 'en' ? 'Edit Loan Application' : 'Hariri Maombi ya Mkopo')
              : (language === 'en' ? 'Loan Application Form' : 'Fomu ya Maombi ya Mkopo')
            }
          </h1>
          <p className="text-emerald-100">
            {language === 'en' 
              ? 'Complete loan application with comprehensive details and compliance features'
              : 'Jaza maombi ya mkopo kwa undani na vipengele vya utii'
            }
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            {language === 'en' ? 'Instructions' : 'Maelekezo'}
          </h3>
          <p className="text-blue-800">
            {language === 'en' 
              ? 'Please fill out this form in capital letters and check the appropriate boxes.'
              : 'Tafadhali jaza fomu hii kwa herufi kubwa na weka alama ya ☑ kwenye kisanduku kuonyesha uchaguzi.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Details Block */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              {language === 'en' ? 'A. Personal Details' : 'A. Maelezo Binafsi ya Mwombaji'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Full Name' : 'Jina Kamili'} *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={language === 'en' ? 'Enter full name in CAPITAL LETTERS' : 'Andika jina kamili kwa HERUFI KUBWA'}
                />
                {validationErrors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'National ID Number' : 'Namba ya Kitambulisho cha Taifa'} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                      validationErrors.nationalId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="19850425-12345-67890-85"
                    maxLength={20}
                  />
                  <div className="absolute right-3 top-3">
                    {nidaStatus === 'verified' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {nidaStatus === 'failed' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {nidaStatus === 'pending' && <Clock className="w-4 h-4 text-yellow-600" />}
                  </div>
                </div>
                {nidaStatus === 'verified' && (
                  <p className="text-green-600 text-xs mt-1">
                    {language === 'en' ? '✓ NIDA verified' : '✓ NIDA imethibitishwa'}
                  </p>
                )}
                {validationErrors.nationalId && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.nationalId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Phone Number' : 'Namba ya Simu'} *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+255 712 345 678"
                />
                {validationErrors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.phoneNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Date of Birth' : 'Tarehe ya Kuzaliwa'} *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
                {validationErrors.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Physical Address' : 'Anwani ya Kimwili'} *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder={language === 'en' ? 'Enter full address in CAPITAL LETTERS' : 'Andika anwani kamili kwa HERUFI KUBWA'}
                />
                {validationErrors.address && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Photo Upload' : 'Pakia Picha'} *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Upload client photo (AES-256 encrypted)' : 'Pakia picha ya mteja (iliyosimbwa na AES-256)'}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleInputChange('photo', e.target.files?.[0])}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Fingerprint Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Fingerprint Upload' : 'Pakia Alama za Vidole'} *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Fingerprint className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Upload fingerprints (AES-256 encrypted)' : 'Pakia alama za vidole (zilizosimbwa na AES-256)'}
                  </p>
                  <input
                    type="file"
                    accept=".dat,.fpt,.wsq"
                    onChange={(e) => handleInputChange('fingerprint', e.target.files?.[0])}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information Block */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-green-600" />
              {language === 'en' ? '2. Employment Information' : '2. Taarifa za Ajira'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Company/Employer Name' : 'Jina la Kampuni/Mwajiri'}
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={language === 'en' ? 'Enter company name' : 'Andika jina la kampuni'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Office Location' : 'Mahali Ofisi Ilipo'}
                </label>
                <input
                  type="text"
                  value={formData.officeLocation}
                  onChange={(e) => handleInputChange('officeLocation', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={language === 'en' ? 'Enter office location' : 'Andika mahali ofisi ilipo'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Your Position' : 'Wadhifa Wako'}
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={language === 'en' ? 'Enter your position' : 'Andika wadhifa wako'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Employment Start Date' : 'Unafanya Kazi Hapo Toka Lini'}
                </label>
                <input
                  type="date"
                  value={formData.employmentStartDate}
                  onChange={(e) => handleInputChange('employmentStartDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Net Monthly Salary After Deductions (TZS)' : 'Mshahara Halisi kwa Mwezi Baada ya Makato (TZS)'}
                </label>
                <input
                  type="number"
                  value={formData.netMonthlySalary}
                  onChange={(e) => handleInputChange('netMonthlySalary', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Salary Slip Upload' : 'Pakia Salary Slip ya Mwezi Uliopita'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Upload salary slip (encrypted)' : 'Pakia salary slip (iliyosimbwa)'}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    onChange={(e) => handleInputChange('salarySlip', e.target.files?.[0])}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Information Block */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-purple-600" />
              {language === 'en' ? '3. Business Information' : '3. Taarifa za Biashara'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Business Name' : 'Jina la Biashara'}
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={language === 'en' ? 'Enter business name' : 'Andika jina la biashara'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Business Location' : 'Mahali Biashara Ilipo'}
                </label>
                <input
                  type="text"
                  value={formData.businessLocation}
                  onChange={(e) => handleInputChange('businessLocation', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={language === 'en' ? 'Enter business location' : 'Andika mahali biashara ilipo'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Business Type' : 'Aina ya Biashara'}
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{language === 'en' ? 'Select business type' : 'Chagua aina ya biashara'}</option>
                  {businessTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label[language]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Business Start Date' : 'Unafanya Biashara Hii Tangu Lini'}
                </label>
                <input
                  type="date"
                  value={formData.businessStartDate}
                  onChange={(e) => handleInputChange('businessStartDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Average Monthly Income (TZS)' : 'Wastani wa Kipato kwa Mwezi (TZS)'}
                </label>
                <input
                  type="number"
                  value={formData.averageMonthlyIncome}
                  onChange={(e) => handleInputChange('averageMonthlyIncome', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Loan Details Block */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-orange-600" />
              {language === 'en' ? '4. Loan Details' : '4. Kiasi cha Mkopo Kinachoombwa'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Loan Product' : 'Aina ya Mkopo'} *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleInputChange('productId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.productId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{language === 'en' ? 'Select loan product' : 'Chagua aina ya mkopo'}</option>
                  {loanProducts?.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.interest_rate}% p.a.
                    </option>
                  ))}
                </select>
                {validationErrors.productId && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.productId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Loan Amount (TZS)' : 'Kiasi cha Mkopo (TZS)'} *
                </label>
                <input
                  type="number"
                  value={formData.loanAmount}
                  onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.loanAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min={selectedProduct?.minAmount || 0}
                  max={selectedProduct?.maxAmount || 0}
                />
                {selectedProduct && (
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'en' ? 'Range' : 'Kiwango'}: TZS {selectedProduct.minAmount.toLocaleString()} - {selectedProduct.maxAmount.toLocaleString()}
                  </p>
                )}
                {validationErrors.loanAmount && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.loanAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Repayment Period' : 'Muda wa Kulipa Mkopo'} *
                </label>
                <select
                  value={formData.repaymentPeriod}
                  onChange={(e) => handleInputChange('repaymentPeriod', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.repaymentPeriod ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{language === 'en' ? 'Select period' : 'Chagua muda'}</option>
                  {repaymentPeriods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label[language]}
                    </option>
                  ))}
                </select>
                {validationErrors.repaymentPeriod && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.repaymentPeriod}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Loan Purpose' : 'Dhumuni la Mkopo'} *
                </label>
                <select
                  value={formData.loanPurpose}
                  onChange={(e) => handleInputChange('loanPurpose', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.loanPurpose ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{language === 'en' ? 'Select purpose' : 'Chagua dhumuni'}</option>
                  {loanPurposes.map((purpose) => (
                    <option key={purpose.value} value={purpose.value}>
                      {purpose.label[language]}
                    </option>
                  ))}
                </select>
                {formData.loanPurpose === 'other' && (
                  <input
                    type="text"
                    value={formData.loanPurposeOther}
                    onChange={(e) => handleInputChange('loanPurposeOther', e.target.value)}
                    placeholder={language === 'en' ? 'Please specify other purpose' : 'Tafadhali eleza dhumuni lingine'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-2 ${
                      validationErrors.loanPurposeOther ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                )}
                {validationErrors.loanPurposeOther && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.loanPurposeOther}</p>
                )}
                {validationErrors.loanPurpose && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.loanPurpose}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Affordable Repayment Amount (TZS)' : 'Ni Kiasi Gani cha Rejesho Unaweza Kurejesha Bila Matatizo (TZS)'}
                </label>
                <input
                  type="number"
                  value={formData.affordableRepayment}
                  onChange={(e) => handleInputChange('affordableRepayment', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Source of Income' : 'Chanzo cha Mapato'}
                </label>
                <input
                  type="text"
                  value={formData.sourceOfIncome}
                  onChange={(e) => handleInputChange('sourceOfIncome', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={language === 'en' ? 'Describe your source of income' : 'Eleza chanzo chako cha mapato'}
                />
              </div>
            </div>
          </div>

          {/* Guarantor Information Block */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UsersIcon className="w-5 h-5 mr-2 text-indigo-600" />
              {language === 'en' ? '5. Guarantor Information' : '5. Taarifa za Mdhamini'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Guarantor Name' : 'Jina la Mdhamini'}
                </label>
                <input
                  type="text"
                  value={formData.guarantorName}
                  onChange={(e) => handleInputChange('guarantorName', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={language === 'en' ? 'Enter guarantor name' : 'Andika jina la mdhamini'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Guarantor National ID' : 'Namba ya Kitambulisho cha Mdhamini'}
                </label>
                <input
                  type="text"
                  value={formData.guarantorNationalId}
                  onChange={(e) => handleInputChange('guarantorNationalId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="19850425-12345-67890-85"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Guarantor Phone Number' : 'Namba ya Simu ya Mdhamini'}
                </label>
                <input
                  type="tel"
                  value={formData.guarantorPhone}
                  onChange={(e) => handleInputChange('guarantorPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+255 712 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Relationship with Guarantor' : 'Uhusiano na Mdhamini'}
                </label>
                <select
                  value={formData.guarantorRelationship}
                  onChange={(e) => handleInputChange('guarantorRelationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{language === 'en' ? 'Select relationship' : 'Chagua uhusiano'}</option>
                  {guarantorRelationships.map((relationship) => (
                    <option key={relationship.value} value={relationship.value}>
                      {relationship.label[language]}
                    </option>
                  ))}
                </select>
                {formData.guarantorRelationship === 'other' && (
                  <input
                    type="text"
                    value={formData.guarantorRelationshipOther}
                    onChange={(e) => handleInputChange('guarantorRelationshipOther', e.target.value)}
                    placeholder={language === 'en' ? 'Please specify other relationship' : 'Tafadhali eleza uhusiano mwingine'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-2 ${
                      validationErrors.guarantorRelationshipOther ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                )}
                {validationErrors.guarantorRelationshipOther && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.guarantorRelationshipOther}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Guarantor Address' : 'Anwani ya Mdhamini'}
                </label>
                <textarea
                  value={formData.guarantorAddress}
                  onChange={(e) => handleInputChange('guarantorAddress', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder={language === 'en' ? 'Enter guarantor address' : 'Andika anwani ya mdhamini'}
                />
              </div>
            </div>
          </div>

          {/* Credit History Block */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-red-600" />
              {language === 'en' ? '6. Credit History' : '6. Historia ya Mkopo'}
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.previousLoan}
                    onChange={(e) => handleInputChange('previousLoan', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'en' 
                      ? 'Have you previously taken a loan from any financial institution?' 
                      : 'Je Umeshawahi Kukopa Katika Taasisi Yoyote ya Kifedha?'
                    }
                  </span>
                </label>
              </div>

              {formData.previousLoan && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'en' ? 'Institution Name' : 'Jina la Taasisi'}
                    </label>
                    <input
                      type="text"
                      value={formData.institutionName}
                      onChange={(e) => handleInputChange('institutionName', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={language === 'en' ? 'Enter institution name' : 'Andika jina la taasisi'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'en' ? 'Loan Taken Date' : 'Ulichukua Mkopo Lini'}
                    </label>
                    <input
                      type="date"
                      value={formData.loanTakenDate}
                      onChange={(e) => handleInputChange('loanTakenDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'en' ? 'Loan Amount (TZS)' : 'Kiasi cha Mkopo (TZS)'}
                    </label>
                    <input
                      type="number"
                      value={formData.previousLoanAmount}
                      onChange={(e) => handleInputChange('previousLoanAmount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'en' ? 'Repayment Amount (TZS)' : 'Kiasi cha Marejesho (TZS)'}
                    </label>
                    <input
                      type="number"
                      value={formData.repaymentAmount}
                      onChange={(e) => handleInputChange('repaymentAmount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'en' ? 'Repayment Date' : 'Tarehe ya Marejesho'}
                    </label>
                    <input
                      type="date"
                      value={formData.repaymentDate}
                      onChange={(e) => handleInputChange('repaymentDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collateral Information Block */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2 text-yellow-600" />
              {language === 'en' ? '7. Collateral Information' : '7. Maelezo Kuhusu Dhamana'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Collateral Type' : 'Je Unataka Kuweka Dhamana Gani'}
                </label>
                <select
                  value={formData.collateralType}
                  onChange={(e) => handleInputChange('collateralType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{language === 'en' ? 'Select collateral type' : 'Chagua aina ya dhamana'}</option>
                  {collateralTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label[language]}
                    </option>
                  ))}
                </select>
                {formData.collateralType === 'other' && (
                  <input
                    type="text"
                    value={formData.collateralTypeOther}
                    onChange={(e) => handleInputChange('collateralTypeOther', e.target.value)}
                    placeholder={language === 'en' ? 'Please specify other collateral type' : 'Tafadhali eleza aina nyingine ya dhamana'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-2 ${
                      validationErrors.collateralTypeOther ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                )}
                {validationErrors.collateralTypeOther && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.collateralTypeOther}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Registration Number' : 'Namba ya Usajili'}
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={language === 'en' ? 'Enter registration number' : 'Andika namba ya usajili'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Current Value (TZS)' : 'Thamani ya Dhamana kwa Sasa (TZS)'}
                </label>
                <input
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => handleInputChange('currentValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Collateral Document' : 'Hati ya Dhamana'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Upload document (encrypted)' : 'Pakia hati (iliyosimbwa)'}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    onChange={(e) => handleInputChange('collateralDocument', e.target.files?.[0])}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Collateral Description' : 'Muonekano wa Dhamana'}
                </label>
                <textarea
                  value={formData.collateralDescription}
                  onChange={(e) => handleInputChange('collateralDescription', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder={language === 'en' ? 'Describe the collateral' : 'Eleza kuhusu dhamana'}
                />
              </div>
            </div>
          </div>

          {/* Biometric Verification Block */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Scan className="w-5 h-5 mr-2 text-purple-600" />
              {language === 'en' ? 'Biometric Verification' : 'Uthibitishaji wa Alama za Mwili'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Fingerprint className="w-6 h-6 text-gray-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {language === 'en' ? 'Fingerprint Verification' : 'Uthibitishaji wa Alama za Vidole'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {language === 'en' 
                        ? 'Required for identity verification and fraud prevention'
                        : 'Inahitajika kwa uthibitishaji wa utambulisho na kuzuia udanganyifu'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {biometricStatus === 'verified' && <CheckCircle className="w-6 h-6 text-green-600" />}
                  {biometricStatus === 'failed' && <AlertTriangle className="w-6 h-6 text-red-600" />}
                  {biometricStatus === 'pending' && <Clock className="w-6 h-6 text-yellow-600" />}
                  {biometricStatus === 'not_required' && <Database className="w-6 h-6 text-gray-400" />}
                </div>
              </div>
              
              {biometricStatus === 'failed' && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-red-800 font-medium">
                      {language === 'en' ? 'Biometric verification failed' : 'Uthibitishaji wa alama za mwili umeshindwa'}
                    </p>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    {language === 'en' 
                      ? 'Please try again or contact support for assistance'
                      : 'Tafadhali jaribu tena au wasiliana na msaada'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Automated Data Enrichment Block */}
          {isDataEnrichmentComplete && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-green-600" />
                {language === 'en' ? 'Data Enrichment Complete' : 'Ujazaji wa Data Umekamilika'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">
                      {language === 'en' ? 'Client Records Found' : 'Rekodi za Mteja Zimepatikana'}
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    {language === 'en' 
                      ? 'Historical data retrieved and verified'
                      : 'Data ya kihistoria imepatikana na kuthibitishwa'
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">
                      {language === 'en' ? 'Identity Verified' : 'Utambulisho Umehakikiwa'}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {language === 'en' 
                      ? 'NIDA verification completed successfully'
                      : 'Uthibitishaji wa NIDA umekamilika kwa mafanikio'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Credit Scoring Block */}
          {showCreditScoring && creditScore && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-orange-600" />
                {language === 'en' ? 'Automated Credit Scoring' : 'Uchambuzi wa Mikopo wa Kiotomatiki'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="text-4xl font-bold text-blue-700 mb-2">{creditScore}</div>
                    <p className="text-sm text-gray-600 mb-2">
                      {language === 'en' ? 'Credit Score' : 'Alama ya Mikopo'}
                    </p>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      riskRating === 'Low' ? 'bg-green-100 text-green-800' :
                      riskRating === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {riskRating} {language === 'en' ? 'Risk' : 'Hatari'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {language === 'en' ? 'Credit Factors' : 'Sababu za Mikopo'}
                  </h4>
                  {creditFactors.map((factor, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        factor.includes('Good') || factor.includes('Stable') || factor.includes('Low') ? 'bg-green-500' :
                        factor.includes('High') || factor.includes('Limited') ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CRB Consent Block */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              {language === 'en' ? 'Credit Bureau Consent' : 'Idhini ya Uchunguzi wa Mikopo'}
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.crbConsent}
                  onChange={(e) => handleInputChange('crbConsent', e.target.checked)}
                  className={`mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                    validationErrors.crbConsent ? 'border-red-500' : ''
                  }`}
                />
                <div>
                  <span className="text-sm font-medium text-blue-900">
                    {language === 'en' 
                      ? 'I consent to credit bureau checks and data sharing'
                      : 'Ninaidhinisha Uchunguzi wa Taasisi za Mikopo na Kushiriki Taarifa'
                    } *
                  </span>
                  <p className="text-xs text-blue-700 mt-1">
                    {language === 'en'
                      ? 'This consent is required by the Microfinance Act 2018 and will be logged with timestamp and AES-256 encryption per Data Protection Act 2022.'
                      : 'Idhini hii inahitajika na Sheria ya Microfinance 2018 na itarekodiwa kwa muda na usimbaji wa AES-256 kulingana na Sheria ya Ulinzi wa Data 2022.'
                    }
                  </p>
                </div>
              </label>
              {validationErrors.crbConsent && (
                <p className="text-red-500 text-xs">{validationErrors.crbConsent}</p>
              )}
            </div>
          </div>

          {/* Loan Terms Preview */}
          {selectedProduct && formData.loanAmount && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-green-600" />
                {language === 'en' ? 'Loan Terms Preview' : 'Muhtasari wa Masharti ya Mkopo'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Product' : 'Bidhaa'}:
                    </span>
                    <span className="font-medium">{selectedProduct.name[language]}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Nominal Rate' : 'Kiwango cha Kawaida'}:
                    </span>
                    <span className="font-medium">{selectedProduct.interestRate}% p.a.</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Effective Rate (APR)' : 'Kiwango cha Ufanisi (APR)'}:
                    </span>
                    <span className="font-medium">{selectedProduct.effectiveRate}% p.a.</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Processing Fee' : 'Ada ya Uchakataji'}:
                    </span>
                    <span className="font-medium">
                      {selectedProduct.id === 'sharia' 
                        ? `${language === 'en' ? 'Profit Margin' : 'Faida'}: ${selectedProduct.profitMargin}%`
                        : `${selectedProduct.processingFee}%`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Tenor' : 'Muda'}:
                    </span>
                    <span className="font-medium">{selectedProduct.tenor[language]}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">
                      {language === 'en' ? 'Version' : 'Toleo'}:
                    </span>
                    <span className="font-medium">{selectedProduct.version}</span>
                  </div>
                </div>
              </div>

              {loanSchedule.length > 0 && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAmortization(!showAmortization)}
                    className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'View Amortization Schedule' : 'Ona Ratiba ya Malipo'}
                  </button>

                  {showAmortization && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">
                              {language === 'en' ? 'Month' : 'Mwezi'}
                            </th>
                            <th className="px-3 py-2 text-left">
                              {language === 'en' ? 'Payment' : 'Malipo'}
                            </th>
                            <th className="px-3 py-2 text-left">
                              {language === 'en' ? 'Principal' : 'Msingi'}
                            </th>
                            <th className="px-3 py-2 text-left">
                              {selectedProduct.id === 'sharia' 
                                ? (language === 'en' ? 'Profit' : 'Faida')
                                : (language === 'en' ? 'Interest' : 'Riba')
                              }
                            </th>
                            <th className="px-3 py-2 text-left">
                              {language === 'en' ? 'Balance' : 'Salio'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {loanSchedule.slice(0, 6).map((payment, index) => (
                            <tr key={index} className="border-b border-gray-200">
                              <td className="px-3 py-2">{payment.month}</td>
                              <td className="px-3 py-2">{payment.payment.toLocaleString()}</td>
                              <td className="px-3 py-2">{payment.principal.toLocaleString()}</td>
                              <td className="px-3 py-2">
                                {selectedProduct.id === 'sharia' 
                                  ? payment.profit?.toLocaleString() 
                                  : payment.interest?.toLocaleString()
                                }
                              </td>
                              <td className="px-3 py-2">{payment.balance.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {loanSchedule.length > 6 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {language === 'en' 
                            ? 'Showing first 6 payments. Full schedule available after approval.'
                            : 'Inaonyesha malipo 6 ya kwanza. Ratiba kamili itapatikana baada ya idhini.'
                          }
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Draft Controls */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {hasDraft && (
                  <div className="flex items-center text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {language === 'en' ? 'Draft saved' : 'Rasimu imehifadhiwa'}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={isSavingDraft}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSavingDraft ? (
                    <>
                      <Clock className="w-3 h-3 mr-1 animate-spin" />
                      {language === 'en' ? 'Saving...' : 'Inahifadhi...'}
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3 mr-1" />
                      {language === 'en' ? 'Save Draft' : 'Hifadhi Rasimu'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!formData.crbConsent || isSubmitting || applicationStatus === 'submitted'}
              className="bg-emerald-600 text-white py-4 px-8 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shadow-sm transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  {language === 'en' ? 'Submitting...' : 'Inawasilisha...'}
                </>
              ) : applicationStatus === 'submitted' ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {language === 'en' ? 'Submitted to Committee' : 'Imepelekwa kwa Kamati'}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {isEditMode 
                    ? (language === 'en' ? 'Update Application' : 'Sasisha Maombi')
                    : (language === 'en' ? 'Submit to Committee' : 'Wasilisha kwa Kamati')
                  }
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default LoanApplication;