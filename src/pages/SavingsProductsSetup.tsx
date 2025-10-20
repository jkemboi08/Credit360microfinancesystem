import React, { useState } from 'react';
import { 
  DollarSign,
  Percent,
  Clock,
  Users,
  Settings,
  FileText,
  CreditCard,
  PiggyBank
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_CURRENCY } from '../constants/currencies';
import CurrencySelector from '../components/CurrencySelector';
import CurrencyInput from '../components/CurrencyInput';
import Layout from '../components/Layout';

const SavingsProductsSetup: React.FC = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);
  
  const [saving, setSaving] = useState(false);

  // Product Configuration State
  const [productConfig, setProductConfig] = useState({
    productName: '',
    productCode: '',
    productType: 'voluntary_savings',
    description: '',
    status: 'active',
    launchDate: '',
    endDate: '',
    currency: DEFAULT_CURRENCY.code,
    // Enhanced product configuration
    productCategory: 'standard',
    targetSegment: 'individual',
    riskLevel: 'low',
    regulatoryClassification: 'deposit',
    taxTreatment: 'taxable',
    reportingRequirements: true
  });

  // Balance Settings State
  const [balanceSettings, setBalanceSettings] = useState({
    // Minimum/Maximum Balance Settings
    minOpeningBalance: 0,
    minOperatingBalance: 0,
    minBalanceForInterest: 0,
    maxBalanceLimit: 0,
    maxDailyDeposit: 0,
    maxMonthlyDeposit: 0,
    
    // Balance Maintenance
    belowMinPenalty: 0,
    gracePeriod: 0,
    penaltyWaiverConditions: '',
    balanceMaintenanceRequired: true,
    
    // Dormancy Management
    dormancyDays: 90,
    dormancyFee: 0,
    dormancyFeeFrequency: 'monthly',
    reactivationFee: 0,
    escheatmentPeriod: 365,
    
    // Limit Management
    limitReachedAction: 'block',
    exceptionApproval: false,
    escalationLevels: 2,
    managerOverrideLimit: 0,
    
    // Balance Verification
    dailyBalanceCheck: true,
    monthlyBalanceReview: true,
    quarterlyBalanceAudit: false,
    annualBalanceCertification: true
  });

  // Interest Rate Configuration State
  const [interestConfig, setInterestConfig] = useState({
    // Rate Structure
    rateStructure: 'fixed', // fixed, variable, tiered
    calculationMethod: 'daily_average', // daily_average, lowest_monthly, simple_interest
    frequency: 'monthly', // daily, weekly, monthly, quarterly, annually
    postingFrequency: 'monthly',
    
    // Rate Settings
    baseRate: 0,
    promotionalRate: 0,
    promotionalExpiry: '',
    centralBankRate: 0,
    rateSpread: 0,
    minimumRate: 0,
    maximumRate: 0,
    
    // Tiered Rate Configuration
    tieredRates: false,
    tierCalculationMethod: 'progressive', // progressive, flat
    tierRounding: 'nearest_cent',
    
    // Rate Management
    rateReviewFrequency: 'quarterly',
    rateChangeNotification: 30, // days
    rateCapProtection: true,
    rateFloorProtection: true,
    
    // Interest Accrual
    accrualMethod: 'daily',
    compoundingFrequency: 'monthly',
    leapYearHandling: 'actual_days',
    businessDayConvention: 'following',
    
    // Regulatory Compliance
    regulatoryReporting: true,
    taxWithholding: false,
    withholdingRate: 0,
    reportingFrequency: 'monthly'
  });

  const [interestTiers, setInterestTiers] = useState([
    {
      id: '1',
      fromAmount: 0,
      toAmount: 1000,
      rate: 2.5,
      effectiveDate: '',
      endDate: ''
    }
  ]);

  // Fee Structure State
  const [fees, setFees] = useState({
    // Account Maintenance Fees
    maintenanceFee: 0,
    maintenanceFrequency: 'monthly',
    maintenanceWaiver: false,
    maintenanceWaiverConditions: '',
    autoDebit: false,
    maintenanceFeeCap: 0,
    maintenanceFeeMinimum: 0,
    
    // Transaction Fees
    withdrawalFee: 0,
    withdrawalFeeType: 'fixed', // fixed, percentage, tiered
    freeTransactions: 0,
    excessTransactionFee: 0,
    interBranchFee: 0,
    atmFee: 0,
    mobileFee: 0,
    onlineFee: 0,
    
    // Deposit Fees
    depositFee: 0,
    depositFeeType: 'fixed',
    cashDepositFee: 0,
    checkDepositFee: 0,
    electronicDepositFee: 0,
    
    // Service Charges
    statementFee: 0,
    certificateFee: 0,
    closureFee: 0,
    checkbookFee: 0,
    duplicateStatementFee: 0,
    accountTransferFee: 0,
    accountConversionFee: 0,
    
    // Penalty Fees
    belowMinPenalty: 0,
    earlyWithdrawalPenalty: 0,
    overdraftFee: 0,
    returnedTransactionFee: 0,
    stopPaymentFee: 0,
    insufficientFundsFee: 0,
    
    // Dormancy Fees
    dormancyFee: 0,
    dormancyFeeFrequency: 'monthly',
    reactivationFee: 0,
    escheatmentFee: 0,
    
    // Fee Management
    feeCap: 0,
    feeWaiverConditions: '',
    feeEscalation: false,
    feeReviewFrequency: 'quarterly',
    
    // Regulatory Fees
    regulatoryFee: 0,
    insuranceFee: 0,
    complianceFee: 0,
    auditFee: 0
  });

  // Terms & Conditions State
  const [termsConditions, setTermsConditions] = useState({
    // Withdrawal Restrictions
    dailyWithdrawalLimit: 0,
    dailyTransactionLimit: 0,
    monthlyWithdrawalLimit: 0,
    yearlyWithdrawalLimit: 0,
    atmLimit: 0,
    branchLimit: 0,
    mobileLimit: 0,
    onlineLimit: 0,
    
    // Withdrawal Methods
    allowedChannels: {
      branch: true,
      atm: true,
      mobile: false,
      online: false,
      phone: false,
      mail: false
    },
    requiredAuthorization: 'single', // single, dual, multiple
    signatureRequired: true,
    biometricRequired: false,
    pinRequired: true,
    
    // Restriction Conditions
    noticePeriod: 0,
    coolingOffPeriod: 0,
    seasonalRestrictions: false,
    emergencyOverride: false,
    businessHoursOnly: false,
    weekendRestrictions: false,
    holidayRestrictions: false,
    
    // Penalty Settings
    earlyWithdrawalPenaltyType: 'percentage', // percentage, fixed, sliding_scale
    earlyWithdrawalPenaltyValue: 0,
    slidingScalePenalty: false,
    interestForfeiture: true,
    prematureClosurePenalty: 0,
    violationPenalty: 0,
    documentNonCompliancePenalty: 0,
    penaltyCap: 0,
    penaltyWaiverConditions: '',
    
    // Maturity Options
    maturityAction: 'auto_renew_same', // auto_renew_same, auto_renew_different, close, manual
    maturityNotificationDays: 30,
    notificationMethods: {
      sms: true,
      email: true,
      letter: false,
      phone: false,
      in_person: false
    },
    gracePeriod: 7,
    interestPaymentOption: 'at_maturity', // at_maturity, monthly, quarterly, annually
    principalRenewalOption: 'full', // full, partial, none
    
    // Auto-Renewal Settings
    renewalTerm: 'same',
    rateAdjustment: 'current_rate',
    minBalanceForRenewal: 0,
    accountStatusRequired: 'active',
    clientConsentRequired: true,
    preRenewalNotification: 30,
    optOutAllowed: true
  });

  // Eligibility Criteria State
  const [eligibilityCriteria, setEligibilityCriteria] = useState({
    // Client Type Restrictions
    allowedClientTypes: {
      individual: true,
      corporate: false,
      group: false
    },
    
    // Individual Client Requirements
    individualRequirements: {
      minAge: 18,
      maxAge: 0, // 0 means no maximum
      citizenshipRequired: true,
      residencyRequired: true,
      employmentStatusRequired: false,
      guardianRequired: false,
      ageVerificationDocs: ['id_card', 'birth_certificate'],
      ageBasedFeatures: false
    },
    
    // Corporate Client Requirements
    corporateRequirements: {
      businessRegistrationRequired: true,
      industryRestrictions: [],
      minYearsInOperation: 0,
      financialHealthCriteria: 'basic',
      annualRevenueMin: 0,
      annualRevenueMax: 0,
      employeeCountMin: 0,
      employeeCountMax: 0
    },
    
    // Group Client Requirements
    groupRequirements: {
      minGroupSize: 5,
      maxGroupSize: 0, // 0 means no maximum
      groupRegistrationRequired: true,
      groupTypeRestrictions: [],
      leadershipStructureRequired: true,
      minMembershipDuration: 0,
      goodStandingRequired: true,
      jointLiabilityRequired: false
    },
    
    // Income Thresholds
    incomeRequirements: {
      minMonthlyIncome: 0,
      maxMonthlyIncome: 0, // 0 means no maximum
      incomeVerificationRequired: true,
      incomeSourceDocumentation: true,
      multipleIncomeSourcesAllowed: true,
      regularIncomeReviewRequired: false,
      incomeCategories: {
        salary: true,
        business: true,
        investment: false,
        pension: true
      }
    },
    
    // Group Membership Requirements
    groupMembershipRequirements: {
      allowedGroupTypes: {
        savings_groups: true,
        investment_clubs: false,
        professional_associations: false,
        community_groups: true
      },
      minMembershipDuration: 0,
      goodStandingRequired: true,
      minGroupSize: 5,
      maxGroupSize: 0,
      groupGuaranteeRequired: false
    }
  });

  // Maturity Options State
  const [maturityOptions, setMaturityOptions] = useState({
    // Maturity Actions
    defaultMaturityAction: 'auto_renew_same',
    maturityActions: {
      auto_renew_same: true,
      auto_renew_different: false,
      transfer_savings: false,
      principal_renew_interest_payout: false,
      manual_decision: false
    },
    
    // Interest Payment Options
    interestPaymentOptions: {
      at_maturity: true,
      monthly: false,
      quarterly: false,
      annually: false,
      capitalization: false
    },
    
    // Maturity Notifications
    maturityNotifications: {
      notificationDays: 30,
      notificationMethods: {
        sms: true,
        email: true,
        letter: false,
        phone: false
      },
      gracePeriod: 7,
      reminderFrequency: 'weekly'
    },
    
    // Auto-Renewal Settings
    autoRenewal: {
      enabled: true,
      renewalTerm: 'same',
      rateAdjustment: 'current_rate',
      minBalanceForRenewal: 0,
      accountStatusRequired: 'active',
      clientConsentRequired: true,
      preRenewalNotification: 30,
      optOutAllowed: true,
      renewalNotificationMethods: {
        sms: true,
        email: true,
        letter: false
      }
    },
    
    // Maturity Terms
    maturityTerms: {
      minTerm: 1,
      maxTerm: 60,
      termIncrements: 1,
      termUnits: 'months',
      gracePeriodForRenewal: 7,
      earlyMaturityAllowed: false,
      earlyMaturityPenalty: 0
    }
  });

  const productTypes = [
    'Voluntary Savings',
    'Compulsory Savings', 
    'Term Deposits/Fixed Deposits',
    'Contractual Savings',
    'Emergency Savings',
    'Group Savings'
  ];

  const tabs = [
    { id: 'basic', label: 'Product Configuration', icon: Settings },
    { id: 'balance', label: 'Balance Settings', icon: DollarSign },
    { id: 'interest', label: 'Interest Rates', icon: Percent },
    { id: 'fees', label: 'Fee Structure', icon: CreditCard },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'maturity', label: 'Maturity Options', icon: Clock },
    { id: 'eligibility', label: 'Eligibility Criteria', icon: Users }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Savings product saved successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to save savings product');
    } finally {
      setSaving(false);
    }
  };

  const generateProductCode = () => {
    const prefix = productConfig.productType.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setProductConfig(prev => ({ ...prev, productCode: `${prefix}${random}` }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Savings Products Setup</h1>
                <p className="text-green-100">Configure and manage savings products</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-sm font-medium text-green-600 bg-white border border-white rounded-lg hover:bg-green-50"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

                 {/* Tab Content */}
                 <div className="p-6">
                   {activeTab === 'basic' && (
                     <div className="space-y-6">
                       <h3 className="text-lg font-semibold text-gray-900">Product Configuration</h3>
                
                {/* Product Name and Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      key={`productName-${isEditing}`}
                      type="text"
                      value={productConfig.productName}
                      onChange={(e) => setProductConfig(prev => ({ ...prev, productName: e.target.value }))}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
                      }`}
                      placeholder="e.g., Basic Savings, Youth Account"
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Code *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={productConfig.productCode}
                        onChange={(e) => setProductConfig(prev => ({ ...prev, productCode: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., SAV001"
                        disabled={!isEditing}
                      />
                      <button
                        onClick={generateProductCode}
                        disabled={!isEditing}
                        className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Type *
                    </label>
                    <select
                      value={productConfig.productType}
                      onChange={(e) => setProductConfig(prev => ({ ...prev, productType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!isEditing}
                    >
                      <option value="">Select Product Type</option>
                      {productTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <CurrencySelector
                      value={productConfig.currency}
                      onChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                      disabled={!isEditing}
                      showFullName={true}
                    />
                  </div>
                </div>

                {/* Product Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Description
                  </label>
                  <textarea
                    value={productConfig.description}
                    onChange={(e) => setProductConfig(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the product features and benefits..."
                    disabled={!isEditing}
                  />
                </div>

                {/* Status and Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="active"
                          checked={productConfig.status === 'active'}
                          onChange={(e) => setProductConfig(prev => ({ ...prev, status: e.target.value }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="inactive"
                          checked={productConfig.status === 'inactive'}
                          onChange={(e) => setProductConfig(prev => ({ ...prev, status: e.target.value }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Launch Date
                    </label>
                    <input
                      type="date"
                      value={productConfig.launchDate}
                      onChange={(e) => setProductConfig(prev => ({ ...prev, launchDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={productConfig.endDate}
                      onChange={(e) => setProductConfig(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Balance Settings Tab */}
            {activeTab === 'balance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Balance Settings</h3>
                
                {/* Opening Balance Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Opening Balance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Opening Balance *
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={balanceSettings.minOpeningBalance}
                          onChange={(e) => setBalanceSettings(prev => ({ ...prev, minOpeningBalance: parseFloat(e.target.value) || 0 }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                        <CurrencySelector
                          value={productConfig.currency}
                          onChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                          disabled={!isEditing}
                          showFullName={false}
                          className="w-24"
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={balanceSettings.exceptionApproval}
                          onChange={(e) => setBalanceSettings(prev => ({ ...prev, exceptionApproval: e.target.checked }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Allow waiver conditions (staff discretion, promotions)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Minimum Operating Balance Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Minimum Operating Balance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Daily Minimum Balance
                      </label>
                      <CurrencyInput
                        value={balanceSettings.minOperatingBalance}
                        currency={productConfig.currency}
                        onValueChange={(value) => setBalanceSettings(prev => ({ ...prev, minOperatingBalance: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Below Minimum Penalty
                      </label>
                      <CurrencyInput
                        value={balanceSettings.belowMinPenalty}
                        currency={productConfig.currency}
                        onValueChange={(value) => setBalanceSettings(prev => ({ ...prev, belowMinPenalty: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grace Period (Days)
                      </label>
                      <input
                        type="number"
                        value={balanceSettings.gracePeriod}
                        onChange={(e) => setBalanceSettings(prev => ({ ...prev, gracePeriod: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Maximum Balance Limit Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Maximum Balance Limit</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upper Limit for Deposits
                      </label>
                      <CurrencyInput
                        value={balanceSettings.maxBalanceLimit}
                        currency={productConfig.currency}
                        onValueChange={(value) => setBalanceSettings(prev => ({ ...prev, maxBalanceLimit: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action When Limit Reached
                      </label>
                      <select
                        value={balanceSettings.limitReachedAction}
                        onChange={(e) => setBalanceSettings(prev => ({ ...prev, limitReachedAction: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isEditing}
                      >
                        <option value="block">Block Deposits</option>
                        <option value="notify">Notify Client</option>
                        <option value="both">Block & Notify</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dormancy Settings Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Dormancy Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Days Without Activity
                      </label>
                      <input
                        type="number"
                        value={balanceSettings.dormancyDays}
                        onChange={(e) => setBalanceSettings(prev => ({ ...prev, dormancyDays: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="90"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dormancy Fee
                      </label>
                      <CurrencyInput
                        value={balanceSettings.dormancyFee}
                        currency={productConfig.currency}
                        onValueChange={(value) => setBalanceSettings(prev => ({ ...prev, dormancyFee: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reactivation Requirements
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={!isEditing}>
                        <option value="visit_branch">Visit Branch</option>
                        <option value="phone_verification">Phone Verification</option>
                        <option value="email_verification">Email Verification</option>
                        <option value="document_submission">Document Submission</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Waiver Conditions
                    </label>
                    <textarea
                      value={balanceSettings.waiverConditions}
                      onChange={(e) => setBalanceSettings(prev => ({ ...prev, waiverConditions: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe waiver conditions for minimum balance requirements..."
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Interest Rate Configuration Tab */}
            {activeTab === 'interest' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Interest Rate Configuration</h3>
                
                {/* Interest Rate Structure Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Interest Rate Structure</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate Structure *
                      </label>
                      <select
                        value={interestConfig.rateStructure}
                        onChange={(e) => setInterestConfig(prev => ({ ...prev, rateStructure: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isEditing}
                      >
                        <option value="fixed">Fixed Rate</option>
                        <option value="tiered">Tiered Rates</option>
                        <option value="variable">Variable Rate (Central Bank Linked)</option>
                        <option value="promotional">Promotional Rate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Interest Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={interestConfig.baseRate}
                        onChange={(e) => setInterestConfig(prev => ({ ...prev, baseRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  {/* Promotional Rate Section */}
                  {interestConfig.rateStructure === 'promotional' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Promotional Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={interestConfig.promotionalRate}
                          onChange={(e) => setInterestConfig(prev => ({ ...prev, promotionalRate: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Promotional Expiry Date
                        </label>
                        <input
                          type="date"
                          value={interestConfig.promotionalExpiry}
                          onChange={(e) => setInterestConfig(prev => ({ ...prev, promotionalExpiry: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  )}

                  {/* Variable Rate Section */}
                  {interestConfig.rateStructure === 'variable' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Central Bank Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={interestConfig.centralBankRate}
                          onChange={(e) => setInterestConfig(prev => ({ ...prev, centralBankRate: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate Spread (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={interestConfig.rateSpread}
                          onChange={(e) => setInterestConfig(prev => ({ ...prev, rateSpread: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Interest Calculation Method Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Interest Calculation Method</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calculation Method *
                      </label>
                      <select
                        value={interestConfig.calculationMethod}
                        onChange={(e) => setInterestConfig(prev => ({ ...prev, calculationMethod: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isEditing}
                      >
                        <option value="simple">Simple Interest</option>
                        <option value="compound_daily">Compound Interest (Daily)</option>
                        <option value="compound_monthly">Compound Interest (Monthly)</option>
                        <option value="compound_quarterly">Compound Interest (Quarterly)</option>
                        <option value="average_daily">Average Daily Balance</option>
                        <option value="minimum_daily">Minimum Daily Balance</option>
                        <option value="end_of_day">End of Day Balance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interest Frequency *
                      </label>
                      <select
                        value={interestConfig.frequency}
                        onChange={(e) => setInterestConfig(prev => ({ ...prev, frequency: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isEditing}
                      >
                        <option value="daily">Daily Accrual, Monthly Posting</option>
                        <option value="monthly">Monthly Posting</option>
                        <option value="quarterly">Quarterly Posting</option>
                        <option value="annually">Annual Posting</option>
                        <option value="maturity">Maturity Posting (Term Deposits)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Interest Rate Tiers Table */}
                {interestConfig.rateStructure === 'tiered' && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-gray-800">Interest Rate Tiers</h4>
                      <button
                        onClick={() => {
                          const newTier = {
                            id: Date.now().toString(),
                            fromAmount: 0,
                            toAmount: 0,
                            rate: 0,
                            effectiveDate: '',
                            endDate: ''
                          };
                          setInterestTiers(prev => [...prev, newTier]);
                        }}
                        disabled={!isEditing}
                        className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                      >
                        Add Tier
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              From Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              To Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Interest Rate (%)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Effective Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              End Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {interestTiers.map((tier, index) => (
                            <tr key={tier.id}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="number"
                                  value={tier.fromAmount}
                                  onChange={(e) => {
                                    const newTiers = [...interestTiers];
                                    newTiers[index].fromAmount = parseFloat(e.target.value) || 0;
                                    setInterestTiers(newTiers);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isEditing}
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="number"
                                  value={tier.toAmount}
                                  onChange={(e) => {
                                    const newTiers = [...interestTiers];
                                    newTiers[index].toAmount = parseFloat(e.target.value) || 0;
                                    setInterestTiers(newTiers);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isEditing}
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={tier.rate}
                                  onChange={(e) => {
                                    const newTiers = [...interestTiers];
                                    newTiers[index].rate = parseFloat(e.target.value) || 0;
                                    setInterestTiers(newTiers);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isEditing}
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="date"
                                  value={tier.effectiveDate}
                                  onChange={(e) => {
                                    const newTiers = [...interestTiers];
                                    newTiers[index].effectiveDate = e.target.value;
                                    setInterestTiers(newTiers);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isEditing}
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="date"
                                  value={tier.endDate}
                                  onChange={(e) => {
                                    const newTiers = [...interestTiers];
                                    newTiers[index].endDate = e.target.value;
                                    setInterestTiers(newTiers);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!isEditing}
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setInterestTiers(prev => prev.filter(t => t.id !== tier.id));
                                  }}
                                  disabled={!isEditing || interestTiers.length === 1}
                                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fee Structure Configuration Tab */}
            {activeTab === 'fees' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Fee Structure Setup</h3>
                
                {/* Account Maintenance Fees Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Account Maintenance Fees</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maintenance Fee Amount
                      </label>
                      <CurrencyInput
                        value={fees.maintenanceFee}
                        currency={productConfig.currency}
                        onValueChange={(value) => setFees(prev => ({ ...prev, maintenanceFee: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency
                      </label>
                      <select
                        value={fees.maintenanceFrequency}
                        onChange={(e) => setFees(prev => ({ ...prev, maintenanceFrequency: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isEditing}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={fees.maintenanceWaiver}
                          onChange={(e) => setFees(prev => ({ ...prev, maintenanceWaiver: e.target.checked }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Allow fee waiver conditions</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={fees.autoDebit}
                          onChange={(e) => setFees(prev => ({ ...prev, autoDebit: e.target.checked }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Enable auto-debit</span>
                      </label>
                    </div>
                  </div>
                  {fees.maintenanceWaiver && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Waiver Conditions
                      </label>
                      <textarea
                        value={fees.maintenanceWaiverConditions}
                        onChange={(e) => setFees(prev => ({ ...prev, maintenanceWaiverConditions: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe conditions for fee waivers..."
                        disabled={!isEditing}
                      />
                    </div>
                  )}
                </div>

                {/* Transaction Fees Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Transaction Fees</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Withdrawal Fee
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={fees.withdrawalFee}
                        onChange={(e) => setFees(prev => ({ ...prev, withdrawalFee: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fee Type
                      </label>
                      <select
                        value={fees.withdrawalFeeType}
                        onChange={(e) => setFees(prev => ({ ...prev, withdrawalFeeType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isEditing}
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Free Transactions per Month
                      </label>
                      <input
                        type="number"
                        value={fees.freeTransactions}
                        onChange={(e) => setFees(prev => ({ ...prev, freeTransactions: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Excess Transaction Fee
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={fees.excessTransactionFee}
                        onChange={(e) => setFees(prev => ({ ...prev, excessTransactionFee: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inter-Branch Transfer Fee
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={fees.interBranchFee}
                        onChange={(e) => setFees(prev => ({ ...prev, interBranchFee: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Service Charges Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Service Charges</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statement Generation Fee
                      </label>
                      <CurrencyInput
                        value={fees.statementFee}
                        currency={productConfig.currency}
                        onValueChange={(value) => setFees(prev => ({ ...prev, statementFee: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate Issuance Fee
                      </label>
                      <CurrencyInput
                        value={fees.certificateFee}
                        currency={productConfig.currency}
                        onValueChange={(value) => setFees(prev => ({ ...prev, certificateFee: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Closure Fee
                      </label>
                      <CurrencyInput
                        value={fees.closureFee}
                        currency={productConfig.currency}
                        onValueChange={(value) => setFees(prev => ({ ...prev, closureFee: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Checkbook Fee (if applicable)
                      </label>
                      <CurrencyInput
                        value={fees.checkbookFee}
                        currency={productConfig.currency}
                        onValueChange={(value) => setFees(prev => ({ ...prev, checkbookFee: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Penalty Fees Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Penalty Fees</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Below Minimum Balance Penalty
                      </label>
                      <CurrencyInput
                        value={fees.belowMinPenalty}
                        currency={productConfig.currency}
                        onValueChange={(value) => setFees(prev => ({ ...prev, belowMinPenalty: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Early Withdrawal Penalty
                      </label>
                      <CurrencyInput
                        value={fees.earlyWithdrawalPenalty}
                        currency={productConfig.currency}
                        onValueChange={(value) => setFees(prev => ({ ...prev, earlyWithdrawalPenalty: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overdraft Fee (if allowed)
                      </label>
                      <CurrencyInput
                        value={fees.overdraftFee}
                        currency={productConfig.currency}
                        onValueChange={(value) => setFees(prev => ({ ...prev, overdraftFee: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Returned Transaction Fee
                      </label>
                      <CurrencyInput
                        value={fees.returnedTransactionFee}
                        currency={productConfig.currency}
                        onValueChange={(value) => setFees(prev => ({ ...prev, returnedTransactionFee: value }))}
                        onCurrencyChange={(currency) => setProductConfig(prev => ({ ...prev, currency }))}
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Terms & Conditions Configuration Tab */}
            {activeTab === 'terms' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Terms & Conditions Configuration</h3>
                
                {/* Withdrawal Restrictions Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Withdrawal Restrictions</h4>
                  
                  {/* Daily Withdrawal Limits */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Daily Withdrawal Limits</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Amount per Day
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={termsConditions.dailyWithdrawalLimit}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, dailyWithdrawalLimit: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Transactions per Day
                        </label>
                        <input
                          type="number"
                          value={termsConditions.dailyTransactionLimit}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, dailyTransactionLimit: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Channel-Specific Limits */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Channel-Specific Limits</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ATM Limit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={termsConditions.atmLimit}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, atmLimit: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Branch Limit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={termsConditions.branchLimit}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, branchLimit: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile Banking Limit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={termsConditions.mobileLimit}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, mobileLimit: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Online Banking Limit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={termsConditions.onlineLimit}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, onlineLimit: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Monthly/Yearly Limits */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Monthly/Yearly Limits</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Withdrawal Limit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={termsConditions.monthlyWithdrawalLimit}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, monthlyWithdrawalLimit: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Yearly Withdrawal Limit
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={termsConditions.yearlyWithdrawalLimit}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, yearlyWithdrawalLimit: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Withdrawal Methods */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Allowed Withdrawal Channels</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(termsConditions.allowedChannels).map(([channel, enabled]) => (
                        <label key={channel} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setTermsConditions(prev => ({
                              ...prev,
                              allowedChannels: {
                                ...prev.allowedChannels,
                                [channel]: e.target.checked
                              }
                            }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700 capitalize">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Authorization and Signature Requirements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Required Authorization Level
                      </label>
                      <select
                        value={termsConditions.requiredAuthorization}
                        onChange={(e) => setTermsConditions(prev => ({ ...prev, requiredAuthorization: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isEditing}
                      >
                        <option value="single">Single Authorization</option>
                        <option value="dual">Dual Authorization</option>
                        <option value="manager">Manager Approval</option>
                        <option value="director">Director Approval</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={termsConditions.signatureRequired}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, signatureRequired: e.target.checked }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Signature Required</span>
                      </label>
                    </div>
                  </div>

                  {/* Restriction Conditions */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notice Period for Large Withdrawals (Days)
                      </label>
                      <input
                        type="number"
                        value={termsConditions.noticePeriod}
                        onChange={(e) => setTermsConditions(prev => ({ ...prev, noticePeriod: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cooling-off Period (Days)
                      </label>
                      <input
                        type="number"
                        value={termsConditions.coolingOffPeriod}
                        onChange={(e) => setTermsConditions(prev => ({ ...prev, coolingOffPeriod: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={termsConditions.seasonalRestrictions}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, seasonalRestrictions: e.target.checked }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Seasonal Restrictions</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={termsConditions.emergencyOverride}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, emergencyOverride: e.target.checked }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Emergency Override Procedures</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Penalty Settings Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Penalty Settings</h4>
                  
                  {/* Early Withdrawal Penalties */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Early Withdrawal Penalties (Term Deposits)</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Penalty Type
                        </label>
                        <select
                          value={termsConditions.earlyWithdrawalPenaltyType}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, earlyWithdrawalPenaltyType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!isEditing}
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Penalty Value
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={termsConditions.earlyWithdrawalPenaltyValue}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, earlyWithdrawalPenaltyValue: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={termsConditions.slidingScalePenalty}
                            onChange={(e) => setTermsConditions(prev => ({ ...prev, slidingScalePenalty: e.target.checked }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700">Sliding Scale Based on Time Remaining</span>
                        </label>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={termsConditions.interestForfeiture}
                            onChange={(e) => setTermsConditions(prev => ({ ...prev, interestForfeiture: e.target.checked }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700">Interest Forfeiture Rules</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Other Penalties */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Premature Closure Penalty
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={termsConditions.prematureClosurePenalty}
                        onChange={(e) => setTermsConditions(prev => ({ ...prev, prematureClosurePenalty: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Violation Penalty
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={termsConditions.violationPenalty}
                        onChange={(e) => setTermsConditions(prev => ({ ...prev, violationPenalty: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Non-Compliance Penalty
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={termsConditions.documentNonCompliancePenalty}
                        onChange={(e) => setTermsConditions(prev => ({ ...prev, documentNonCompliancePenalty: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Maturity Options Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Maturity Options (Term Deposits)</h4>
                  
                  {/* Maturity Actions */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Maturity Actions</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Maturity Action
                        </label>
                        <select
                          value={termsConditions.maturityAction}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, maturityAction: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!isEditing}
                        >
                          <option value="auto_renew_same">Auto-renew for same term</option>
                          <option value="auto_renew_different">Auto-renew for different term</option>
                          <option value="transfer_savings">Transfer to savings account</option>
                          <option value="principal_renew_interest_payout">Principal renewal, interest payout</option>
                          <option value="manual_decision">No action (manual decision required)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interest Payment Option
                        </label>
                        <select
                          value={termsConditions.interestPaymentOption}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, interestPaymentOption: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!isEditing}
                        >
                          <option value="at_maturity">Interest at maturity</option>
                          <option value="monthly">Monthly interest payout</option>
                          <option value="quarterly">Quarterly interest payout</option>
                          <option value="capitalization">Interest capitalization</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Maturity Notifications */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Maturity Notifications</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notification Timeline (Days Before)
                        </label>
                        <select
                          value={termsConditions.maturityNotificationDays}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, maturityNotificationDays: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!isEditing}
                        >
                          <option value={30}>30 days</option>
                          <option value={15}>15 days</option>
                          <option value={7}>7 days</option>
                          <option value={3}>3 days</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Grace Period for Client Decision (Days)
                        </label>
                        <input
                          type="number"
                          value={termsConditions.gracePeriod}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, gracePeriod: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="7"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Notification Methods</label>
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(termsConditions.notificationMethods).map(([method, enabled]) => (
                          <label key={method} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => setTermsConditions(prev => ({
                                ...prev,
                                notificationMethods: {
                                  ...prev.notificationMethods,
                                  [method]: e.target.checked
                                }
                              }))}
                              className="mr-2"
                              disabled={!isEditing}
                            />
                            <span className="text-sm text-gray-700 capitalize">{method}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-Renewal Settings Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Auto-Renewal Settings</h4>
                  
                  {/* Renewal Terms */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Renewal Terms</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Renewal Term
                        </label>
                        <select
                          value={termsConditions.renewalTerm}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, renewalTerm: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!isEditing}
                        >
                          <option value="same">Same term as original</option>
                          <option value="modified">Modified term options</option>
                          <option value="current_offer">Current best offer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate Adjustment Rules
                        </label>
                        <select
                          value={termsConditions.rateAdjustment}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, rateAdjustment: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!isEditing}
                        >
                          <option value="current_rate">Current market rate</option>
                          <option value="original_rate">Original rate maintained</option>
                          <option value="negotiated">Negotiated rate</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Renewal Conditions */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Renewal Conditions</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Balance for Renewal
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={termsConditions.minBalanceForRenewal}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, minBalanceForRenewal: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Status Required
                        </label>
                        <select
                          value={termsConditions.accountStatusRequired}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, accountStatusRequired: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!isEditing}
                        >
                          <option value="active">Active</option>
                          <option value="dormant">Dormant Allowed</option>
                          <option value="any">Any Status</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={termsConditions.clientConsentRequired}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, clientConsentRequired: e.target.checked }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Client Consent Required for Renewal</span>
                      </label>
                    </div>
                  </div>

                  {/* Notification Requirements */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Notification Requirements</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pre-Renewal Notification (Days)
                        </label>
                        <input
                          type="number"
                          value={termsConditions.preRenewalNotification}
                          onChange={(e) => setTermsConditions(prev => ({ ...prev, preRenewalNotification: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="30"
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={termsConditions.optOutAllowed}
                            onChange={(e) => setTermsConditions(prev => ({ ...prev, optOutAllowed: e.target.checked }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700">Allow Opt-out from Auto-Renewal</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Eligibility Criteria Configuration Tab */}
            {activeTab === 'eligibility' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Eligibility Criteria Configuration</h3>
                
                {/* Client Type Restrictions Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Client Type Restrictions</h4>
                  
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Allowed Client Types</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(eligibilityCriteria.allowedClientTypes).map(([clientType, allowed]) => (
                        <label key={clientType} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={allowed}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              allowedClientTypes: {
                                ...prev.allowedClientTypes,
                                [clientType]: e.target.checked
                              }
                            }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700 capitalize">{clientType}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Individual Client Requirements */}
                  {eligibilityCriteria.allowedClientTypes.individual && (
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Individual Client Requirements</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Age
                          </label>
                          <input
                            type="number"
                            value={eligibilityCriteria.individualRequirements.minAge}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              individualRequirements: {
                                ...prev.individualRequirements,
                                minAge: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="18"
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Age (0 = No Limit)
                          </label>
                          <input
                            type="number"
                            value={eligibilityCriteria.individualRequirements.maxAge}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              individualRequirements: {
                                ...prev.individualRequirements,
                                maxAge: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={eligibilityCriteria.individualRequirements.citizenshipRequired}
                              onChange={(e) => setEligibilityCriteria(prev => ({
                                ...prev,
                                individualRequirements: {
                                  ...prev.individualRequirements,
                                  citizenshipRequired: e.target.checked
                                }
                              }))}
                              className="mr-2"
                              disabled={!isEditing}
                            />
                            <span className="text-sm text-gray-700">Citizenship Required</span>
                          </label>
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={eligibilityCriteria.individualRequirements.residencyRequired}
                              onChange={(e) => setEligibilityCriteria(prev => ({
                                ...prev,
                                individualRequirements: {
                                  ...prev.individualRequirements,
                                  residencyRequired: e.target.checked
                                }
                              }))}
                              className="mr-2"
                              disabled={!isEditing}
                            />
                            <span className="text-sm text-gray-700">Residency Required</span>
                          </label>
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={eligibilityCriteria.individualRequirements.employmentStatusRequired}
                              onChange={(e) => setEligibilityCriteria(prev => ({
                                ...prev,
                                individualRequirements: {
                                  ...prev.individualRequirements,
                                  employmentStatusRequired: e.target.checked
                                }
                              }))}
                              className="mr-2"
                              disabled={!isEditing}
                            />
                            <span className="text-sm text-gray-700">Employment Status Required</span>
                          </label>
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={eligibilityCriteria.individualRequirements.guardianRequired}
                              onChange={(e) => setEligibilityCriteria(prev => ({
                                ...prev,
                                individualRequirements: {
                                  ...prev.individualRequirements,
                                  guardianRequired: e.target.checked
                                }
                              }))}
                              className="mr-2"
                              disabled={!isEditing}
                            />
                            <span className="text-sm text-gray-700">Guardian Required (Minors)</span>
                          </label>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Age Verification Documents
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {['id_card', 'birth_certificate', 'passport', 'drivers_license'].map((doc) => (
                            <label key={doc} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={eligibilityCriteria.individualRequirements.ageVerificationDocs.includes(doc)}
                                onChange={(e) => {
                                  const newDocs = e.target.checked
                                    ? [...eligibilityCriteria.individualRequirements.ageVerificationDocs, doc]
                                    : eligibilityCriteria.individualRequirements.ageVerificationDocs.filter(d => d !== doc);
                                  setEligibilityCriteria(prev => ({
                                    ...prev,
                                    individualRequirements: {
                                      ...prev.individualRequirements,
                                      ageVerificationDocs: newDocs
                                    }
                                  }));
                                }}
                                className="mr-2"
                                disabled={!isEditing}
                              />
                              <span className="text-sm text-gray-700 capitalize">{doc.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Corporate Client Requirements */}
                  {eligibilityCriteria.allowedClientTypes.corporate && (
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Corporate Client Requirements</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Years in Operation
                          </label>
                          <input
                            type="number"
                            value={eligibilityCriteria.corporateRequirements.minYearsInOperation}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              corporateRequirements: {
                                ...prev.corporateRequirements,
                                minYearsInOperation: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Financial Health Criteria
                          </label>
                          <select
                            value={eligibilityCriteria.corporateRequirements.financialHealthCriteria}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              corporateRequirements: {
                                ...prev.corporateRequirements,
                                financialHealthCriteria: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!isEditing}
                          >
                            <option value="basic">Basic</option>
                            <option value="standard">Standard</option>
                            <option value="strict">Strict</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Annual Revenue
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={eligibilityCriteria.corporateRequirements.annualRevenueMin}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              corporateRequirements: {
                                ...prev.corporateRequirements,
                                annualRevenueMin: parseFloat(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Annual Revenue (0 = No Limit)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={eligibilityCriteria.corporateRequirements.annualRevenueMax}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              corporateRequirements: {
                                ...prev.corporateRequirements,
                                annualRevenueMax: parseFloat(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Employee Count
                          </label>
                          <input
                            type="number"
                            value={eligibilityCriteria.corporateRequirements.employeeCountMin}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              corporateRequirements: {
                                ...prev.corporateRequirements,
                                employeeCountMin: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Employee Count (0 = No Limit)
                          </label>
                          <input
                            type="number"
                            value={eligibilityCriteria.corporateRequirements.employeeCountMax}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              corporateRequirements: {
                                ...prev.corporateRequirements,
                                employeeCountMax: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={eligibilityCriteria.corporateRequirements.businessRegistrationRequired}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              corporateRequirements: {
                                ...prev.corporateRequirements,
                                businessRegistrationRequired: e.target.checked
                              }
                            }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700">Business Registration Required</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Group Client Requirements */}
                  {eligibilityCriteria.allowedClientTypes.group && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Group Client Requirements</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Group Size
                          </label>
                          <input
                            type="number"
                            value={eligibilityCriteria.groupRequirements.minGroupSize}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              groupRequirements: {
                                ...prev.groupRequirements,
                                minGroupSize: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="5"
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Group Size (0 = No Limit)
                          </label>
                          <input
                            type="number"
                            value={eligibilityCriteria.groupRequirements.maxGroupSize}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              groupRequirements: {
                                ...prev.groupRequirements,
                                maxGroupSize: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Membership Duration (Months)
                          </label>
                          <input
                            type="number"
                            value={eligibilityCriteria.groupRequirements.minMembershipDuration}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              groupRequirements: {
                                ...prev.groupRequirements,
                                minMembershipDuration: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={eligibilityCriteria.groupRequirements.groupRegistrationRequired}
                              onChange={(e) => setEligibilityCriteria(prev => ({
                                ...prev,
                                groupRequirements: {
                                  ...prev.groupRequirements,
                                  groupRegistrationRequired: e.target.checked
                                }
                              }))}
                              className="mr-2"
                              disabled={!isEditing}
                            />
                            <span className="text-sm text-gray-700">Group Registration Required</span>
                          </label>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={eligibilityCriteria.groupRequirements.leadershipStructureRequired}
                              onChange={(e) => setEligibilityCriteria(prev => ({
                                ...prev,
                                groupRequirements: {
                                  ...prev.groupRequirements,
                                  leadershipStructureRequired: e.target.checked
                                }
                              }))}
                              className="mr-2"
                              disabled={!isEditing}
                            />
                            <span className="text-sm text-gray-700">Leadership Structure Required</span>
                          </label>
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={eligibilityCriteria.groupRequirements.goodStandingRequired}
                              onChange={(e) => setEligibilityCriteria(prev => ({
                                ...prev,
                                groupRequirements: {
                                  ...prev.groupRequirements,
                                  goodStandingRequired: e.target.checked
                                }
                              }))}
                              className="mr-2"
                              disabled={!isEditing}
                            />
                            <span className="text-sm text-gray-700">Good Standing Required</span>
                          </label>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={eligibilityCriteria.groupRequirements.jointLiabilityRequired}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              groupRequirements: {
                                ...prev.groupRequirements,
                                jointLiabilityRequired: e.target.checked
                              }
                            }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700">Joint Liability Required</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Income Thresholds Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Income Thresholds</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Monthly Income
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={eligibilityCriteria.incomeRequirements.minMonthlyIncome}
                        onChange={(e) => setEligibilityCriteria(prev => ({
                          ...prev,
                          incomeRequirements: {
                            ...prev.incomeRequirements,
                            minMonthlyIncome: parseFloat(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Monthly Income (0 = No Limit)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={eligibilityCriteria.incomeRequirements.maxMonthlyIncome}
                        onChange={(e) => setEligibilityCriteria(prev => ({
                          ...prev,
                          incomeRequirements: {
                            ...prev.incomeRequirements,
                            maxMonthlyIncome: parseFloat(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={eligibilityCriteria.incomeRequirements.incomeVerificationRequired}
                          onChange={(e) => setEligibilityCriteria(prev => ({
                            ...prev,
                            incomeRequirements: {
                              ...prev.incomeRequirements,
                              incomeVerificationRequired: e.target.checked
                            }
                          }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Income Verification Required</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={eligibilityCriteria.incomeRequirements.incomeSourceDocumentation}
                          onChange={(e) => setEligibilityCriteria(prev => ({
                            ...prev,
                            incomeRequirements: {
                              ...prev.incomeRequirements,
                              incomeSourceDocumentation: e.target.checked
                            }
                          }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Income Source Documentation</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={eligibilityCriteria.incomeRequirements.multipleIncomeSourcesAllowed}
                          onChange={(e) => setEligibilityCriteria(prev => ({
                            ...prev,
                            incomeRequirements: {
                              ...prev.incomeRequirements,
                              multipleIncomeSourcesAllowed: e.target.checked
                            }
                          }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Multiple Income Sources Allowed</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={eligibilityCriteria.incomeRequirements.regularIncomeReviewRequired}
                          onChange={(e) => setEligibilityCriteria(prev => ({
                            ...prev,
                            incomeRequirements: {
                              ...prev.incomeRequirements,
                              regularIncomeReviewRequired: e.target.checked
                            }
                          }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Regular Income Review Required</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Accepted Income Categories</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(eligibilityCriteria.incomeRequirements.incomeCategories).map(([category, allowed]) => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={allowed}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              incomeRequirements: {
                                ...prev.incomeRequirements,
                                incomeCategories: {
                                  ...prev.incomeRequirements.incomeCategories,
                                  [category]: e.target.checked
                                }
                              }
                            }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700 capitalize">{category.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Group Membership Requirements Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Group Membership Requirements</h4>
                  
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Allowed Group Types</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(eligibilityCriteria.groupMembershipRequirements.allowedGroupTypes).map(([groupType, allowed]) => (
                        <label key={groupType} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={allowed}
                            onChange={(e) => setEligibilityCriteria(prev => ({
                              ...prev,
                              groupMembershipRequirements: {
                                ...prev.groupMembershipRequirements,
                                allowedGroupTypes: {
                                  ...prev.groupMembershipRequirements.allowedGroupTypes,
                                  [groupType]: e.target.checked
                                }
                              }
                            }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700 capitalize">{groupType.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Membership Duration (Months)
                      </label>
                      <input
                        type="number"
                        value={eligibilityCriteria.groupMembershipRequirements.minMembershipDuration}
                        onChange={(e) => setEligibilityCriteria(prev => ({
                          ...prev,
                          groupMembershipRequirements: {
                            ...prev.groupMembershipRequirements,
                            minMembershipDuration: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Group Size
                      </label>
                      <input
                        type="number"
                        value={eligibilityCriteria.groupMembershipRequirements.minGroupSize}
                        onChange={(e) => setEligibilityCriteria(prev => ({
                          ...prev,
                          groupMembershipRequirements: {
                            ...prev.groupMembershipRequirements,
                            minGroupSize: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="5"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Group Size (0 = No Limit)
                      </label>
                      <input
                        type="number"
                        value={eligibilityCriteria.groupMembershipRequirements.maxGroupSize}
                        onChange={(e) => setEligibilityCriteria(prev => ({
                          ...prev,
                          groupMembershipRequirements: {
                            ...prev.groupMembershipRequirements,
                            maxGroupSize: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={eligibilityCriteria.groupMembershipRequirements.goodStandingRequired}
                          onChange={(e) => setEligibilityCriteria(prev => ({
                            ...prev,
                            groupMembershipRequirements: {
                              ...prev.groupMembershipRequirements,
                              goodStandingRequired: e.target.checked
                            }
                          }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700">Good Standing Required</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={eligibilityCriteria.groupMembershipRequirements.groupGuaranteeRequired}
                        onChange={(e) => setEligibilityCriteria(prev => ({
                          ...prev,
                          groupMembershipRequirements: {
                            ...prev.groupMembershipRequirements,
                            groupGuaranteeRequired: e.target.checked
                          }
                        }))}
                        className="mr-2"
                        disabled={!isEditing}
                      />
                      <span className="text-sm text-gray-700">Group Guarantee Required</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Maturity Options Configuration Tab */}
            {activeTab === 'maturity' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Maturity Options Configuration</h3>
                
                {/* Maturity Actions Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Maturity Actions</h4>
                  
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Default Maturity Action</h5>
                    <select
                      value={maturityOptions.defaultMaturityAction}
                      onChange={(e) => setMaturityOptions(prev => ({ ...prev, defaultMaturityAction: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!isEditing}
                    >
                      <option value="auto_renew_same">Auto-renew for same term</option>
                      <option value="auto_renew_different">Auto-renew for different term</option>
                      <option value="transfer_savings">Transfer to savings account</option>
                      <option value="principal_renew_interest_payout">Principal renewal, interest payout</option>
                      <option value="manual_decision">No action (manual decision required)</option>
                    </select>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Available Maturity Actions</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(maturityOptions.maturityActions).map(([action, enabled]) => (
                        <label key={action} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setMaturityOptions(prev => ({
                              ...prev,
                              maturityActions: {
                                ...prev.maturityActions,
                                [action]: e.target.checked
                              }
                            }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700 capitalize">{action.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interest Payment Options Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Interest Payment Options</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(maturityOptions.interestPaymentOptions).map(([option, enabled]) => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => setMaturityOptions(prev => ({
                            ...prev,
                            interestPaymentOptions: {
                              ...prev.interestPaymentOptions,
                              [option]: e.target.checked
                            }
                          }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm text-gray-700 capitalize">{option.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Maturity Notifications Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Maturity Notifications</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notification Timeline (Days Before Maturity)
                      </label>
                      <select
                        value={maturityOptions.maturityNotifications.notificationDays}
                        onChange={(e) => setMaturityOptions(prev => ({
                          ...prev,
                          maturityNotifications: {
                            ...prev.maturityNotifications,
                            notificationDays: parseInt(e.target.value)
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isEditing}
                      >
                        <option value={30}>30 days</option>
                        <option value={15}>15 days</option>
                        <option value={7}>7 days</option>
                        <option value={3}>3 days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grace Period for Client Decision (Days)
                      </label>
                      <input
                        type="number"
                        value={maturityOptions.maturityNotifications.gracePeriod}
                        onChange={(e) => setMaturityOptions(prev => ({
                          ...prev,
                          maturityNotifications: {
                            ...prev.maturityNotifications,
                            gracePeriod: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="7"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Notification Methods</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(maturityOptions.maturityNotifications.notificationMethods).map(([method, enabled]) => (
                        <label key={method} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setMaturityOptions(prev => ({
                              ...prev,
                              maturityNotifications: {
                                ...prev.maturityNotifications,
                                notificationMethods: {
                                  ...prev.maturityNotifications.notificationMethods,
                                  [method]: e.target.checked
                                }
                              }
                            }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700 capitalize">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reminder Frequency
                    </label>
                    <select
                      value={maturityOptions.maturityNotifications.reminderFrequency}
                      onChange={(e) => setMaturityOptions(prev => ({
                        ...prev,
                        maturityNotifications: {
                          ...prev.maturityNotifications,
                          reminderFrequency: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!isEditing}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi_weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                {/* Auto-Renewal Settings Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Auto-Renewal Settings</h4>
                  
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={maturityOptions.autoRenewal.enabled}
                          onChange={(e) => setMaturityOptions(prev => ({
                            ...prev,
                            autoRenewal: {
                              ...prev.autoRenewal,
                              enabled: e.target.checked
                            }
                          }))}
                          className="mr-2"
                          disabled={!isEditing}
                        />
                        <span className="text-sm font-medium text-gray-700">Enable Auto-Renewal</span>
                      </label>
                    </div>
                  </div>

                  {maturityOptions.autoRenewal.enabled && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Renewal Term
                          </label>
                          <select
                            value={maturityOptions.autoRenewal.renewalTerm}
                            onChange={(e) => setMaturityOptions(prev => ({
                              ...prev,
                              autoRenewal: {
                                ...prev.autoRenewal,
                                renewalTerm: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!isEditing}
                          >
                            <option value="same">Same term as original</option>
                            <option value="modified">Modified term options</option>
                            <option value="current_offer">Current best offer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rate Adjustment Rules
                          </label>
                          <select
                            value={maturityOptions.autoRenewal.rateAdjustment}
                            onChange={(e) => setMaturityOptions(prev => ({
                              ...prev,
                              autoRenewal: {
                                ...prev.autoRenewal,
                                rateAdjustment: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!isEditing}
                          >
                            <option value="current_rate">Current market rate</option>
                            <option value="original_rate">Original rate maintained</option>
                            <option value="negotiated">Negotiated rate</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Balance for Renewal
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={maturityOptions.autoRenewal.minBalanceForRenewal}
                            onChange={(e) => setMaturityOptions(prev => ({
                              ...prev,
                              autoRenewal: {
                                ...prev.autoRenewal,
                                minBalanceForRenewal: parseFloat(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Status Required
                          </label>
                          <select
                            value={maturityOptions.autoRenewal.accountStatusRequired}
                            onChange={(e) => setMaturityOptions(prev => ({
                              ...prev,
                              autoRenewal: {
                                ...prev.autoRenewal,
                                accountStatusRequired: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!isEditing}
                          >
                            <option value="active">Active</option>
                            <option value="dormant">Dormant Allowed</option>
                            <option value="any">Any Status</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pre-Renewal Notification (Days)
                          </label>
                          <input
                            type="number"
                            value={maturityOptions.autoRenewal.preRenewalNotification}
                            onChange={(e) => setMaturityOptions(prev => ({
                              ...prev,
                              autoRenewal: {
                                ...prev.autoRenewal,
                                preRenewalNotification: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="30"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={maturityOptions.autoRenewal.clientConsentRequired}
                              onChange={(e) => setMaturityOptions(prev => ({
                                ...prev,
                                autoRenewal: {
                                  ...prev.autoRenewal,
                                  clientConsentRequired: e.target.checked
                                }
                              }))}
                              className="mr-2"
                              disabled={!isEditing}
                            />
                            <span className="text-sm text-gray-700">Client Consent Required</span>
                          </label>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Renewal Notification Methods</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(maturityOptions.autoRenewal.renewalNotificationMethods).map(([method, enabled]) => (
                            <label key={method} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setMaturityOptions(prev => ({
                                  ...prev,
                                  autoRenewal: {
                                    ...prev.autoRenewal,
                                    renewalNotificationMethods: {
                                      ...prev.autoRenewal.renewalNotificationMethods,
                                      [method]: e.target.checked
                                    }
                                  }
                                }))}
                                className="mr-2"
                                disabled={!isEditing}
                              />
                              <span className="text-sm text-gray-700 capitalize">{method}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={maturityOptions.autoRenewal.optOutAllowed}
                            onChange={(e) => setMaturityOptions(prev => ({
                              ...prev,
                              autoRenewal: {
                                ...prev.autoRenewal,
                                optOutAllowed: e.target.checked
                              }
                            }))}
                            className="mr-2"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-gray-700">Allow Opt-out from Auto-Renewal</span>
                        </label>
                      </div>
                    </>
                  )}
                </div>

                {/* Maturity Terms Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Maturity Terms</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Term
                      </label>
                      <input
                        type="number"
                        value={maturityOptions.maturityTerms.minTerm}
                        onChange={(e) => setMaturityOptions(prev => ({
                          ...prev,
                          maturityTerms: {
                            ...prev.maturityTerms,
                            minTerm: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Term
                      </label>
                      <input
                        type="number"
                        value={maturityOptions.maturityTerms.maxTerm}
                        onChange={(e) => setMaturityOptions(prev => ({
                          ...prev,
                          maturityTerms: {
                            ...prev.maturityTerms,
                            maxTerm: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="60"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Term Increments
                      </label>
                      <input
                        type="number"
                        value={maturityOptions.maturityTerms.termIncrements}
                        onChange={(e) => setMaturityOptions(prev => ({
                          ...prev,
                          maturityTerms: {
                            ...prev.maturityTerms,
                            termIncrements: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Term Units
                      </label>
                      <select
                        value={maturityOptions.maturityTerms.termUnits}
                        onChange={(e) => setMaturityOptions(prev => ({
                          ...prev,
                          maturityTerms: {
                            ...prev.maturityTerms,
                            termUnits: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!isEditing}
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grace Period for Renewal (Days)
                      </label>
                      <input
                        type="number"
                        value={maturityOptions.maturityTerms.gracePeriodForRenewal}
                        onChange={(e) => setMaturityOptions(prev => ({
                          ...prev,
                          maturityTerms: {
                            ...prev.maturityTerms,
                            gracePeriodForRenewal: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="7"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Early Maturity Penalty (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={maturityOptions.maturityTerms.earlyMaturityPenalty}
                        onChange={(e) => setMaturityOptions(prev => ({
                          ...prev,
                          maturityTerms: {
                            ...prev.maturityTerms,
                            earlyMaturityPenalty: parseFloat(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={maturityOptions.maturityTerms.earlyMaturityAllowed}
                        onChange={(e) => setMaturityOptions(prev => ({
                          ...prev,
                          maturityTerms: {
                            ...prev.maturityTerms,
                            earlyMaturityAllowed: e.target.checked
                          }
                        }))}
                        className="mr-2"
                        disabled={!isEditing}
                      />
                      <span className="text-sm text-gray-700">Allow Early Maturity</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs will be implemented in subsequent parts */}
            {activeTab !== 'basic' && activeTab !== 'balance' && activeTab !== 'interest' && activeTab !== 'fees' && activeTab !== 'terms' && activeTab !== 'eligibility' && activeTab !== 'maturity' && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">{tabs.find(t => t.id === activeTab)?.label} Configuration</p>
                  <p className="text-sm">This section will be implemented next</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SavingsProductsSetup;