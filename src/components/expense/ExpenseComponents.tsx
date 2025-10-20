import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Upload,
  FileText,
  Eye,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  Info,
  Building,
  User,
  FileImage
} from 'lucide-react';

// Expense Summary Card Component
export const ExpenseSummaryCard: React.FC<{
  title: string;
  value: number;
  budget?: number;
  variance?: number;
  percentage?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  format: 'currency' | 'number' | 'percentage';
  onClick?: () => void;
}> = ({ 
  title, 
  value, 
  budget, 
  variance, 
  percentage, 
  trend, 
  urgency, 
  format,
  onClick 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  const displayValue = format === 'currency' ? formatCurrency(value) : 
                      format === 'percentage' ? formatPercentage(value) : 
                      value.toString();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {trend && getTrendIcon(trend)}
      </div>
      <div className="space-y-2">
        <div className="text-2xl font-bold text-gray-900">{displayValue}</div>
        {budget && (
          <div className="text-sm text-gray-600">
            Budget: {formatCurrency(budget)}
          </div>
        )}
        {variance !== undefined && (
          <div className={`text-sm ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            Variance: {formatCurrency(variance)}
          </div>
        )}
        {percentage !== undefined && (
          <div className="text-sm text-gray-600">
            {formatPercentage(percentage)} of total
          </div>
        )}
        {urgency && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(urgency)}`}>
            {urgency.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
};

// Expense Categories Chart Component
export const ExpenseCategoriesChart: React.FC<{
  data: Array<{
    category: string;
    amount: number;
    budget: number;
    variance: number;
    percentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    botMapping: string;
  }>;
  budgetComparison: boolean;
  interactive: boolean;
  onCategorySelect?: (category: string) => void;
}> = ({ data, budgetComparison, interactive, onCategorySelect }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories Analysis</h4>
      <div className="space-y-4">
        {data.map((category, index) => (
          <div 
            key={index} 
            className={`border rounded-lg p-4 ${interactive ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
            onClick={() => interactive && onCategorySelect?.(category.category)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <h5 className="font-medium text-gray-900">{category.category}</h5>
                <span className="text-xs text-gray-500">({category.botMapping})</span>
                {getTrendIcon(category.trend)}
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCurrency(category.amount)}</div>
                <div className="text-sm text-gray-600">{formatPercentage(category.percentage)}</div>
              </div>
            </div>
            {budgetComparison && (
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600">
                  Budget: {formatCurrency(category.budget)}
                </div>
                <div className={`text-xs ${category.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {category.variance >= 0 ? '+' : ''}{formatCurrency(category.variance)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Quick Action Button Component
export const QuickActionButton: React.FC<{
  label: string;
  icon: string;
  onClick: () => void;
  primary?: boolean;
  badge?: number;
  disabled?: boolean;
}> = ({ label, icon, onClick, primary = false, badge, disabled = false }) => {
  const getIcon = () => {
    switch (icon) {
      case 'plus': return <Plus className="h-5 w-5" />;
      case 'upload': return <Upload className="h-5 w-5" />;
      case 'report': return <FileText className="h-5 w-5" />;
      case 'approval': return <Eye className="h-5 w-5" />;
      case 'download': return <Download className="h-5 w-5" />;
      case 'chart': return <BarChart3 className="h-5 w-5" />;
      case 'pie': return <PieChart className="h-5 w-5" />;
      default: return <Plus className="h-5 w-5" />;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors relative ${
        primary 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {getIcon()}
      <span className="font-medium">{label}</span>
      {badge && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
};

// Income Statement Integration Panel Component
export const MSP202IntegrationPanel: React.FC<{
  interestExpenses: {
    d15_interestOnBankBorrowings: number;
    d16_interestOnMFSPBorrowings: number;
    d17_interestOnSavings: number;
    d18_interestOnFixedDeposits: number;
    d19_interestOnOtherBorrowings: number;
    d20_totalInterestExpense: number;
  };
  operatingExpenses: {
    d25_salariesAndBenefits: number;
    d26_rentAndUtilities: number;
    d27_transportAndCommunication: number;
    d28_officeSupplies: number;
    d29_trainingAndDevelopment: number;
    d30_loanLossProvision: number;
    d31_depreciation: number;
    d32_auditAndLegal: number;
    d33_advertisingAndMarketing: number;
    d34_insurancePremiums: number;
    d35_bankChargesAndFees: number;
    d36_boardAndCommitteeExpenses: number;
    d37_securityServices: number;
    d38_repairsAndMaintenance: number;
    d39_otherOperatingExpenses: number;
    d40_totalOperatingExpenses: number;
  };
  taxExpenses: {
    d41_taxExpense: number;
  };
  validationStatus: string;
  lastSync: Date;
}> = ({ interestExpenses, operatingExpenses, taxExpenses, validationStatus, lastSync }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Income Statement Integration</h4>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            validationStatus === 'passed' ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
          }`}>
            {validationStatus === 'passed' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {validationStatus.toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Interest Expenses</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Bank Borrowings:</span>
              <span>{formatCurrency(interestExpenses.d15_interestOnBankBorrowings)}</span>
            </div>
            <div className="flex justify-between">
              <span>MFSP Borrowings:</span>
              <span>{formatCurrency(interestExpenses.d16_interestOnMFSPBorrowings)}</span>
            </div>
            <div className="flex justify-between">
              <span>Savings Interest:</span>
              <span>{formatCurrency(interestExpenses.d17_interestOnSavings)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Total Interest:</span>
              <span>{formatCurrency(interestExpenses.d20_totalInterestExpense)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Operating Expenses</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Salaries & Benefits:</span>
              <span>{formatCurrency(operatingExpenses.d25_salariesAndBenefits)}</span>
            </div>
            <div className="flex justify-between">
              <span>Rent & Utilities:</span>
              <span>{formatCurrency(operatingExpenses.d26_rentAndUtilities)}</span>
            </div>
            <div className="flex justify-between">
              <span>Transport & Comm:</span>
              <span>{formatCurrency(operatingExpenses.d27_transportAndCommunication)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Total Operating:</span>
              <span>{formatCurrency(operatingExpenses.d40_totalOperatingExpenses)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h5 className="font-medium text-gray-900 mb-3">Tax Expenses</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tax Expense:</span>
              <span>{formatCurrency(taxExpenses.d41_taxExpense)}</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Last sync: {lastSync.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Report Impact Display Component
export const BOTReportImpactDisplay: React.FC<{
  msp202Impact: Array<{
    lineItem: string;
    amount: number;
    description: string;
  }>;
  otherReportsImpact: Array<{
    reportName: string;
    lineItem: string;
    amount: number;
  }>;
  showValidation: boolean;
}> = ({ msp202Impact, otherReportsImpact, showValidation }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h5 className="font-medium text-blue-900 mb-3 flex items-center">
        <Info className="h-4 w-4 mr-2" />
        Report Impact
      </h5>
      <div className="space-y-3">
        <div>
          <h6 className="font-medium text-blue-800 text-sm">Income Statement</h6>
          {msp202Impact.map((impact, index) => (
            <div key={index} className="text-sm text-blue-700 ml-4">
              {impact.lineItem}: {formatCurrency(impact.amount)} - {impact.description}
            </div>
          ))}
        </div>
        {otherReportsImpact.length > 0 && (
          <div>
            <h6 className="font-medium text-blue-800 text-sm">Other Reports</h6>
            {otherReportsImpact.map((impact, index) => (
              <div key={index} className="text-sm text-blue-700 ml-4">
                {impact.reportName} - {impact.lineItem}: {formatCurrency(impact.amount)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Document Upload Area Component
export const DocumentUploadArea: React.FC<{
  acceptedTypes: string[];
  maxFiles: number;
  onFilesUpload: (files: FileList | null) => void;
  required?: boolean;
}> = ({ acceptedTypes, maxFiles, onFilesUpload, required = false }) => (
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
    <p className="text-gray-600 mb-2">
      Drop files here or click to upload
    </p>
    <p className="text-xs text-gray-500 mb-4">
      Accepted: {acceptedTypes.join(', ')} (Max {maxFiles} files)
    </p>
    <input
      type="file"
      multiple
      accept={acceptedTypes.join(',')}
      onChange={(e) => onFilesUpload(e.target.files)}
      className="hidden"
      id="file-upload"
      required={required}
    />
    <label
      htmlFor="file-upload"
      className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
    >
      Choose Files
    </label>
  </div>
);

// Approval Workflow Display Component
export const ApprovalWorkflowDisplay: React.FC<{
  requiredApprovers: string[];
  approvalLimits: Array<{
    level: number;
    maxAmount: number;
    approvers: string[];
  }>;
  estimatedApprovalTime: number;
}> = ({ requiredApprovers, approvalLimits, estimatedApprovalTime }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h5 className="font-medium text-yellow-900 mb-3">Approval Workflow</h5>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-yellow-800">Required Approvers:</span>
          <span className="ml-2 text-yellow-700">{requiredApprovers.join(', ')}</span>
        </div>
        <div>
          <span className="font-medium text-yellow-800">Estimated Time:</span>
          <span className="ml-2 text-yellow-700">{estimatedApprovalTime} hours</span>
        </div>
        <div>
          <span className="font-medium text-yellow-800">Approval Limits:</span>
          <div className="ml-2 text-yellow-700">
            {approvalLimits.map((limit, index) => (
              <div key={index}>
                Level {limit.level}: Up to {formatCurrency(limit.maxAmount)} - {limit.approvers.join(', ')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Approval Metrics Panel Component
export const ApprovalMetricsPanel: React.FC<{
  averageApprovalTime: number;
  approvalRate: number;
  pendingCount: number;
  overdueCount: number;
}> = ({ averageApprovalTime, approvalRate, pendingCount, overdueCount }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h4 className="text-lg font-semibold text-gray-900 mb-4">Approval Analytics</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{averageApprovalTime}h</div>
        <div className="text-sm text-gray-600">Avg. Approval Time</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{approvalRate}%</div>
        <div className="text-sm text-gray-600">Approval Rate</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
        <div className="text-sm text-gray-600">Pending</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
        <div className="text-sm text-gray-600">Overdue</div>
      </div>
    </div>
  </div>
);

// System Integration Points Display Component
export const SystemIntegrationPoints: React.FC<{
  integrationPoints: {
    staffManagement: {
      salaryProcessing: string;
      allowanceManagement: string;
      benefitsManagement: string;
      trainingExpenses: string;
    };
    loanManagement: {
      provisionCalculation: string;
      collectionCosts: string;
      legalExpenses: string;
    };
    branchManagement: {
      operationalExpenses: string;
      rentAndUtilities: string;
      regionalExpenseAllocation: string;
    };
    treasuryManagement: {
      interestExpenses: string;
      bankCharges: string;
      investmentExpenses: string;
    };
    generalLedger: {
      automaticJournalEntries: string;
      accountCodeMapping: string;
      botReportFeeding: string;
    };
  };
}> = ({ integrationPoints }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h4 className="text-lg font-semibold text-gray-900 mb-4">System Integration Points</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div>
        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
          <User className="h-4 w-4 mr-2" />
          Staff Management
        </h5>
        <div className="space-y-2 text-sm">
          <div className="text-gray-700">• {integrationPoints.staffManagement.salaryProcessing}</div>
          <div className="text-gray-700">• {integrationPoints.staffManagement.allowanceManagement}</div>
          <div className="text-gray-700">• {integrationPoints.staffManagement.benefitsManagement}</div>
          <div className="text-gray-700">• {integrationPoints.staffManagement.trainingExpenses}</div>
        </div>
      </div>
      
      <div>
        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Loan Management
        </h5>
        <div className="space-y-2 text-sm">
          <div className="text-gray-700">• {integrationPoints.loanManagement.provisionCalculation}</div>
          <div className="text-gray-700">• {integrationPoints.loanManagement.collectionCosts}</div>
          <div className="text-gray-700">• {integrationPoints.loanManagement.legalExpenses}</div>
        </div>
      </div>
      
      <div>
        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
          <Building className="h-4 w-4 mr-2" />
          Branch Management
        </h5>
        <div className="space-y-2 text-sm">
          <div className="text-gray-700">• {integrationPoints.branchManagement.operationalExpenses}</div>
          <div className="text-gray-700">• {integrationPoints.branchManagement.rentAndUtilities}</div>
          <div className="text-gray-700">• {integrationPoints.branchManagement.regionalExpenseAllocation}</div>
        </div>
      </div>
      
      <div>
        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          Treasury Management
        </h5>
        <div className="space-y-2 text-sm">
          <div className="text-gray-700">• {integrationPoints.treasuryManagement.interestExpenses}</div>
          <div className="text-gray-700">• {integrationPoints.treasuryManagement.bankCharges}</div>
          <div className="text-gray-700">• {integrationPoints.treasuryManagement.investmentExpenses}</div>
        </div>
      </div>
      
      <div>
        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          General Ledger
        </h5>
        <div className="space-y-2 text-sm">
          <div className="text-gray-700">• {integrationPoints.generalLedger.automaticJournalEntries}</div>
          <div className="text-gray-700">• {integrationPoints.generalLedger.accountCodeMapping}</div>
          <div className="text-gray-700">• {integrationPoints.generalLedger.botReportFeeding}</div>
        </div>
      </div>
    </div>
  </div>
);
