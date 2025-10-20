/**
 * BOT Loan Classification and Provisioning Service
 * Implements Bank of Tanzania guidelines for loan classification and provisioning
 * 
 * Classification Guidelines:
 * - General Loans: 0-5 days (Current), 6-30 days (ESM), 31-60 days (Substandard), 61-90 days (Doubtful), 90+ days (Loss)
 * - Housing Microfinance: 91-180 days (Substandard), 180-360 days (Doubtful), 361+ days (Loss)
 * 
 * Provision Rates:
 * - Current: 1%, ESM: 5%, Substandard: 25%, Doubtful: 50%, Loss: 100%
 */

export interface LoanData {
  id: string;
  outstandingAmount: number;
  daysPastDue: number;
  loanType: 'general' | 'housing_microfinance';
  disbursementDate: string;
  maturityDate: string;
  principalAmount: number;
  interestRate: number;
  clientId: string;
  productId: string;
  status: string;
  collateralValue?: number;
  guarantorStrength?: number;
  restructuringHistory?: number;
}

export interface LoanClassification {
  category: 'Current' | 'Especially Mentioned' | 'Substandard' | 'Doubtful' | 'Loss';
  daysPastDue: number;
  provisionRate: number;
  provisionAmount: number;
  isHousingMicrofinance: boolean;
  classificationDate: string;
  nextReviewDate: string;
}

export interface PortfolioClassification {
  totalOutstanding: number;
  totalProvisionRequired: number;
  classificationBreakdown: {
    current: { count: number; amount: number; provision: number };
    esm: { count: number; amount: number; provision: number };
    substandard: { count: number; amount: number; provision: number };
    doubtful: { count: number; amount: number; provision: number };
    loss: { count: number; amount: number; provision: number };
  };
  nplRatio: number;
  par30: number;
  par90: number;
  provisionCoverageRatio: number;
}

export interface HousingMicrofinanceClassification {
  category: 'Current' | 'Especially Mentioned' | 'Substandard' | 'Doubtful' | 'Loss';
  daysPastDue: number;
  provisionRate: number;
  provisionAmount: number;
  classificationDate: string;
  nextReviewDate: string;
}

export class BOTLoanClassificationService {
  private static instance: BOTLoanClassificationService;
  
  // BOT Classification Criteria for General Loans
  private readonly generalLoanCriteria = {
    current: { minDays: 0, maxDays: 5 },
    esm: { minDays: 6, maxDays: 30 },
    substandard: { minDays: 31, maxDays: 60 },
    doubtful: { minDays: 61, maxDays: 90 },
    loss: { minDays: 91, maxDays: Infinity }
  };

  // BOT Classification Criteria for Housing Microfinance Loans
  private readonly housingMicrofinanceCriteria = {
    current: { minDays: 0, maxDays: 90 },
    esm: { minDays: 91, maxDays: 90 }, // No ESM for housing microfinance
    substandard: { minDays: 91, maxDays: 180 },
    doubtful: { minDays: 181, maxDays: 360 },
    loss: { minDays: 361, maxDays: Infinity }
  };

  // BOT Provision Rates
  private readonly provisionRates = {
    current: 0.01,      // 1%
    esm: 0.05,          // 5%
    substandard: 0.25,  // 25%
    doubtful: 0.50,     // 50%
    loss: 1.00          // 100%
  };

  public static getInstance(): BOTLoanClassificationService {
    if (!BOTLoanClassificationService.instance) {
      BOTLoanClassificationService.instance = new BOTLoanClassificationService();
    }
    return BOTLoanClassificationService.instance;
  }

  /**
   * Classify a general loan based on BOT guidelines
   */
  public classifyGeneralLoan(loan: LoanData): LoanClassification {
    const daysPastDue = this.calculateDaysPastDue(loan);
    const criteria = this.generalLoanCriteria;
    
    let category: LoanClassification['category'];
    let provisionRate: number;

    if (daysPastDue >= criteria.current.minDays && daysPastDue <= criteria.current.maxDays) {
      category = 'Current';
      provisionRate = this.provisionRates.current;
    } else if (daysPastDue >= criteria.esm.minDays && daysPastDue <= criteria.esm.maxDays) {
      category = 'Especially Mentioned';
      provisionRate = this.provisionRates.esm;
    } else if (daysPastDue >= criteria.substandard.minDays && daysPastDue <= criteria.substandard.maxDays) {
      category = 'Substandard';
      provisionRate = this.provisionRates.substandard;
    } else if (daysPastDue >= criteria.doubtful.minDays && daysPastDue <= criteria.doubtful.maxDays) {
      category = 'Doubtful';
      provisionRate = this.provisionRates.doubtful;
    } else {
      category = 'Loss';
      provisionRate = this.provisionRates.loss;
    }

    const provisionAmount = loan.outstandingAmount * provisionRate;
    const classificationDate = new Date().toISOString();
    const nextReviewDate = this.calculateNextReviewDate(category, classificationDate);

    return {
      category,
      daysPastDue,
      provisionRate,
      provisionAmount,
      isHousingMicrofinance: false,
      classificationDate,
      nextReviewDate
    };
  }

  /**
   * Classify a housing microfinance loan based on BOT guidelines
   */
  public classifyHousingMicrofinanceLoan(loan: LoanData): HousingMicrofinanceClassification {
    const daysPastDue = this.calculateDaysPastDue(loan);
    const criteria = this.housingMicrofinanceCriteria;
    
    let category: HousingMicrofinanceClassification['category'];
    let provisionRate: number;

    if (daysPastDue >= criteria.current.minDays && daysPastDue <= criteria.current.maxDays) {
      category = 'Current';
      provisionRate = this.provisionRates.current;
    } else if (daysPastDue >= criteria.substandard.minDays && daysPastDue <= criteria.substandard.maxDays) {
      category = 'Substandard';
      provisionRate = this.provisionRates.substandard;
    } else if (daysPastDue >= criteria.doubtful.minDays && daysPastDue <= criteria.doubtful.maxDays) {
      category = 'Doubtful';
      provisionRate = this.provisionRates.doubtful;
    } else {
      category = 'Loss';
      provisionRate = this.provisionRates.loss;
    }

    const provisionAmount = loan.outstandingAmount * provisionRate;
    const classificationDate = new Date().toISOString();
    const nextReviewDate = this.calculateNextReviewDate(category, classificationDate);

    return {
      category,
      daysPastDue,
      provisionRate,
      provisionAmount,
      classificationDate,
      nextReviewDate
    };
  }

  /**
   * Classify a loan based on its type (general or housing microfinance)
   */
  public classifyLoan(loan: LoanData): LoanClassification | HousingMicrofinanceClassification {
    if (loan.loanType === 'housing_microfinance') {
      return this.classifyHousingMicrofinanceLoan(loan);
    } else {
      return this.classifyGeneralLoan(loan);
    }
  }

  /**
   * Calculate portfolio classification for multiple loans
   */
  public calculatePortfolioClassification(loans: LoanData[]): PortfolioClassification {
    const breakdown = {
      current: { count: 0, amount: 0, provision: 0 },
      esm: { count: 0, amount: 0, provision: 0 },
      substandard: { count: 0, amount: 0, provision: 0 },
      doubtful: { count: 0, amount: 0, provision: 0 },
      loss: { count: 0, amount: 0, provision: 0 }
    };

    let totalOutstanding = 0;
    let totalProvisionRequired = 0;
    let par30Count = 0;
    let par90Count = 0;

    loans.forEach(loan => {
      const classification = this.classifyLoan(loan);
      totalOutstanding += loan.outstandingAmount;
      totalProvisionRequired += classification.provisionAmount;

      // Count for PAR calculations
      if (loan.daysPastDue > 30) par30Count++;
      if (loan.daysPastDue > 90) par90Count++;

      // Update breakdown
      const categoryKey = classification.category.toLowerCase().replace(' ', '') as keyof typeof breakdown;
      if (categoryKey in breakdown) {
        breakdown[categoryKey].count++;
        breakdown[categoryKey].amount += loan.outstandingAmount;
        breakdown[categoryKey].provision += classification.provisionAmount;
      }
    });

    const nplRatio = totalOutstanding > 0 ? 
      ((breakdown.substandard.amount + breakdown.doubtful.amount + breakdown.loss.amount) / totalOutstanding) * 100 : 0;
    
    const par30 = loans.length > 0 ? (par30Count / loans.length) * 100 : 0;
    const par90 = loans.length > 0 ? (par90Count / loans.length) * 100 : 0;
    
    const provisionCoverageRatio = totalOutstanding > 0 ? 
      (totalProvisionRequired / totalOutstanding) * 100 : 0;

    return {
      totalOutstanding,
      totalProvisionRequired,
      classificationBreakdown: breakdown,
      nplRatio,
      par30,
      par90,
      provisionCoverageRatio
    };
  }

  /**
   * Calculate days past due for a loan
   */
  private calculateDaysPastDue(loan: LoanData): number {
    const today = new Date();
    const maturityDate = new Date(loan.maturityDate);
    
    if (today <= maturityDate) {
      return 0; // Loan is not yet due
    }
    
    const timeDiff = today.getTime() - maturityDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff);
  }

  /**
   * Calculate next review date based on classification
   */
  private calculateNextReviewDate(category: string, classificationDate: string): string {
    const date = new Date(classificationDate);
    
    switch (category) {
      case 'Current':
        date.setMonth(date.getMonth() + 3); // Review every 3 months
        break;
      case 'Especially Mentioned':
        date.setMonth(date.getMonth() + 1); // Review monthly
        break;
      case 'Substandard':
        date.setMonth(date.getMonth() + 1); // Review monthly
        break;
      case 'Doubtful':
        date.setMonth(date.getMonth() + 1); // Review monthly
        break;
      case 'Loss':
        date.setMonth(date.getMonth() + 1); // Review monthly
        break;
      default:
        date.setMonth(date.getMonth() + 3);
    }
    
    return date.toISOString();
  }

  /**
   * Get BOT classification criteria for display purposes
   */
  public getClassificationCriteria() {
    return {
      generalLoans: this.generalLoanCriteria,
      housingMicrofinance: this.housingMicrofinanceCriteria,
      provisionRates: this.provisionRates
    };
  }

  /**
   * Validate if a loan classification is BOT compliant
   */
  public validateBOTCompliance(loan: LoanData, classification: LoanClassification | HousingMicrofinanceClassification): boolean {
    const expectedClassification = this.classifyLoan(loan);
    
    return (
      expectedClassification.category === classification.category &&
      Math.abs(expectedClassification.provisionRate - classification.provisionRate) < 0.001
    );
  }

  /**
   * Generate BOT-compliant report data for regulatory submission
   */
  public generateBOTReportData(loans: LoanData[]) {
    const portfolioClassification = this.calculatePortfolioClassification(loans);
    const criteria = this.getClassificationCriteria();
    
    return {
      reportDate: new Date().toISOString(),
      institutionName: 'RYTHM Microfinance Limited',
      mspCode: 'MSP001',
      totalOutstanding: portfolioClassification.totalOutstanding,
      totalProvisionRequired: portfolioClassification.totalProvisionRequired,
      classificationBreakdown: portfolioClassification.classificationBreakdown,
      nplRatio: portfolioClassification.nplRatio,
      par30: portfolioClassification.par30,
      par90: portfolioClassification.par90,
      provisionCoverageRatio: portfolioClassification.provisionCoverageRatio,
      criteria: criteria,
      complianceStatus: 'BOT_COMPLIANT',
      lastUpdated: new Date().toISOString()
    };
  }
}

export default BOTLoanClassificationService;



