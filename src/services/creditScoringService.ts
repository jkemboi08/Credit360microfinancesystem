import { supabase } from '../lib/supabaseClient';

export interface CreditScoringData {
  // Personal Information
  age: number;
  gender: string;
  maritalStatus: string;
  dependents: number;
  clientType: 'individual' | 'business' | 'corporate';
  
  // Income Information
  incomeSource: 'employment' | 'business' | 'self_employed' | 'freelance' | 'investment' | 'pension' | 'other';
  monthlyIncome: number;
  incomeStability: number; // 1-10 scale
  businessYears?: number;
  employmentYears?: number;
  
  // Business Information (for individual clients with business income)
  businessName?: string;
  businessType?: string;
  businessRegistrationNumber?: string;
  businessLocation?: string;
  businessStartDate?: string;
  businessMonthlyRevenue?: number;
  businessMonthlyExpenses?: number;
  businessNetProfit?: number;
  businessEmployees?: number;
  businessBankStatements?: boolean;
  businessTaxReturns?: boolean;
  
  // Financial Information
  requestedAmount: number;
  existingLoans: number;
  monthlyExpenses: number;
  assets: number;
  liabilities: number;
  
  // Loan Information
  loanType: 'personal' | 'business' | 'agricultural' | 'education' | 'home' | 'vehicle' | 'emergency';
  loanPurpose: string;
  repaymentPeriod: number;
  isBusinessLoanForIndividual: boolean; // Individual client applying for business loan
  
  // Credit History
  previousLoans: number;
  previousLoanAmount?: number;
  previousRepaymentHistory?: 'excellent' | 'good' | 'fair' | 'poor' | 'default';
  crbScore?: number;
  crbConsent: boolean;
  
  // Collateral
  hasCollateral: boolean;
  collateralValue?: number;
  collateralType?: string;
  
  // Guarantors
  hasGuarantors: boolean;
  guarantorCount: number;
  
  // Additional Factors
  educationLevel: 'primary' | 'secondary' | 'diploma' | 'degree' | 'masters' | 'phd';
  residenceStability: number; // years at current address
  phoneStability: number; // years with same phone number
}

export interface ScoringWeights {
  income: number;
  stability: number;
  debtToIncome: number;
  creditHistory: number;
  collateral: number;
  guarantors: number;
  demographics: number;
  loanType: number;
}

export interface CreditScoreResult {
  score: number;
  riskRating: 'low' | 'medium' | 'high' | 'very_high';
  confidence: number; // 0-1 scale
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  recommendations: string[];
  probabilityOfDefault: number; // 0-1 scale
}

export class CreditScoringService {
  private static readonly BASE_SCORE = 300;
  private static readonly MAX_SCORE = 850;
  private static readonly MIN_SCORE = 300;
  
  // Dynamic weights that can be adjusted based on historical data
  private static weights: ScoringWeights = {
    income: 0.25,
    stability: 0.20,
    debtToIncome: 0.20,
    creditHistory: 0.15,
    collateral: 0.10,
    guarantors: 0.05,
    demographics: 0.03,
    loanType: 0.02
  };

  /**
   * Calculate credit score using machine learning approach
   */
  static async calculateCreditScore(data: CreditScoringData): Promise<CreditScoreResult> {
    try {
      // Load historical data for machine learning
      const historicalData = await this.loadHistoricalData();
      
      // Update weights based on historical performance
      this.updateWeightsFromHistory(historicalData);
      
      // Calculate base score
      let score = this.BASE_SCORE;
      
      // Apply scoring factors
      score += this.calculateIncomeScore(data) * this.weights.income;
      score += this.calculateStabilityScore(data) * this.weights.stability;
      score += this.calculateDebtToIncomeScore(data) * this.weights.debtToIncome;
      score += this.calculateCreditHistoryScore(data) * this.weights.creditHistory;
      score += this.calculateCollateralScore(data) * this.weights.collateral;
      score += this.calculateGuarantorScore(data) * this.weights.guarantors;
      score += this.calculateDemographicsScore(data) * this.weights.demographics;
      score += this.calculateLoanTypeScore(data) * this.weights.loanType;
      
      // Apply machine learning adjustments
      score = this.applyMLAdjustments(score, data, historicalData);
      
      // Ensure score is within bounds
      score = Math.min(this.MAX_SCORE, Math.max(this.MIN_SCORE, score));
      
      // Calculate risk rating
      const riskRating = this.calculateRiskRating(score);
      
      // Generate factors and recommendations
      const factors = this.generateFactors(data, score);
      const recommendations = this.generateRecommendations(data, score, riskRating);
      
      // Calculate probability of default using ML model
      const probabilityOfDefault = this.calculateDefaultProbability(data, historicalData);
      
      // Calculate confidence based on data completeness and historical accuracy
      const confidence = this.calculateConfidence(data, historicalData);
      
      return {
        score: Math.round(score),
        riskRating,
        confidence,
        factors,
        recommendations,
        probabilityOfDefault
      };
      
    } catch (error) {
      console.error('Error calculating credit score:', error);
      // Fallback to basic scoring
      return this.calculateBasicScore(data);
    }
  }

  /**
   * Calculate income score based on source and stability
   */
  private static calculateIncomeScore(data: CreditScoringData): number {
    let score = 0;
    const income = data.monthlyIncome;
    
    // Base income scoring
    if (income > 2000000) score += 200;
    else if (income > 1000000) score += 150;
    else if (income > 500000) score += 100;
    else if (income > 200000) score += 50;
    else if (income > 100000) score += 25;
    
    // Enhanced income source multiplier based on client type and loan type
    let sourceMultiplier = 1.0;
    
    if (data.isBusinessLoanForIndividual) {
      // Individual client applying for business loan - different scoring approach
      const businessSourceMultipliers = {
        'business': 1.0,        // Business income is ideal for business loans
        'self_employed': 0.9,   // Self-employed is good for business loans
        'employment': 0.7,      // Employment income is less ideal for business loans
        'freelance': 0.8,       // Freelance can work for business loans
        'investment': 0.6,      // Investment income is less reliable for business loans
        'pension': 0.5,         // Pension income is not suitable for business loans
        'other': 0.4
      };
      sourceMultiplier = businessSourceMultipliers[data.incomeSource] || 0.4;
    } else {
      // Regular scoring for personal loans
      const personalSourceMultipliers = {
        'employment': 1.0,
        'business': 0.9,
        'self_employed': 0.8,
        'freelance': 0.7,
        'investment': 0.6,
        'pension': 0.8,
        'other': 0.5
      };
      sourceMultiplier = personalSourceMultipliers[data.incomeSource] || 0.5;
    }
    
    score *= sourceMultiplier;
    
    // Income stability factor
    score *= (data.incomeStability / 10);
    
    // Enhanced business/employment stability bonus
    if (data.incomeSource === 'business' && data.businessYears) {
      if (data.businessYears > 5) score += 60; // Higher bonus for business loans
      else if (data.businessYears > 3) score += 40;
      else if (data.businessYears > 1) score += 20;
      
      // Additional business-specific bonuses
      if (data.businessNetProfit && data.businessNetProfit > 0) {
        score += 20; // Profitable business
      }
      if (data.businessEmployees && data.businessEmployees > 0) {
        score += 15; // Business with employees
      }
      if (data.businessBankStatements) {
        score += 10; // Has bank statements
      }
      if (data.businessTaxReturns) {
        score += 15; // Has tax returns
      }
    } else if (data.incomeSource === 'employment' && data.employmentYears) {
      if (data.employmentYears > 5) score += 40;
      else if (data.employmentYears > 3) score += 25;
      else if (data.employmentYears > 1) score += 10;
    }
    
    // Business loan specific adjustments for individual clients
    if (data.isBusinessLoanForIndividual) {
      // Require higher income for business loans
      if (income < 500000) {
        score *= 0.7; // Reduce score for low income business loan applications
      }
      
      // Bonus for business documentation
      if (data.businessRegistrationNumber) {
        score += 25; // Registered business
      }
      if (data.businessType && ['retail', 'wholesale', 'manufacturing', 'services'].includes(data.businessType)) {
        score += 15; // Established business type
      }
    }
    
    return Math.round(score);
  }

  /**
   * Calculate stability score
   */
  private static calculateStabilityScore(data: CreditScoringData): number {
    let score = 0;
    
    // Residence stability
    if (data.residenceStability > 5) score += 50;
    else if (data.residenceStability > 3) score += 30;
    else if (data.residenceStability > 1) score += 15;
    
    // Phone stability
    if (data.phoneStability > 3) score += 30;
    else if (data.phoneStability > 1) score += 15;
    
    // Marital status stability
    const maritalStability = {
      'married': 20,
      'divorced': 10,
      'widowed': 15,
      'single': 5
    };
    score += maritalStability[data.maritalStatus as keyof typeof maritalStability] || 0;
    
    // Dependents factor (moderate number is better)
    if (data.dependents === 0) score += 10;
    else if (data.dependents >= 1 && data.dependents <= 3) score += 15;
    else if (data.dependents > 3) score += 5;
    
    return score;
  }

  /**
   * Calculate debt-to-income ratio score
   */
  private static calculateDebtToIncomeScore(data: CreditScoringData): number {
    const annualIncome = data.monthlyIncome * 12;
    const totalDebt = data.existingLoans + data.requestedAmount;
    const debtToIncomeRatio = totalDebt / annualIncome;
    
    let score = 0;
    
    if (debtToIncomeRatio < 0.2) score = 100;
    else if (debtToIncomeRatio < 0.3) score = 80;
    else if (debtToIncomeRatio < 0.4) score = 60;
    else if (debtToIncomeRatio < 0.5) score = 40;
    else if (debtToIncomeRatio < 0.6) score = 20;
    else score = 0;
    
    return score;
  }

  /**
   * Calculate credit history score
   */
  private static calculateCreditHistoryScore(data: CreditScoringData): number {
    let score = 0;
    
    // Previous loan history
    if (data.previousLoans === 0) {
      score += 20; // No history is neutral
    } else if (data.previousLoans > 0) {
      if (data.previousRepaymentHistory === 'excellent') score += 80;
      else if (data.previousRepaymentHistory === 'good') score += 60;
      else if (data.previousRepaymentHistory === 'fair') score += 40;
      else if (data.previousRepaymentHistory === 'poor') score += 10;
      else if (data.previousRepaymentHistory === 'default') score -= 50;
    }
    
    // CRB score
    if (data.crbScore) {
      if (data.crbScore >= 450) score += 50;
      else if (data.crbScore >= 400) score += 30;
      else if (data.crbScore >= 350) score += 10;
      else if (data.crbScore >= 300) score -= 10;
      else score -= 30;
    }
    
    // CRB consent
    if (data.crbConsent) score += 20;
    else score -= 10;
    
    return Math.max(0, score);
  }

  /**
   * Calculate collateral score
   */
  private static calculateCollateralScore(data: CreditScoringData): number {
    if (!data.hasCollateral) return 0;
    
    let score = 30; // Base score for having collateral
    
    if (data.collateralValue) {
      const collateralRatio = data.collateralValue / data.requestedAmount;
      if (collateralRatio >= 2) score += 50;
      else if (collateralRatio >= 1.5) score += 40;
      else if (collateralRatio >= 1) score += 30;
      else if (collateralRatio >= 0.5) score += 20;
    }
    
    // Collateral type bonus
    const collateralTypeBonus = {
      'property': 20,
      'vehicle': 15,
      'equipment': 10,
      'savings': 25,
      'other': 5
    };
    
    if (data.collateralType) {
      score += collateralTypeBonus[data.collateralType as keyof typeof collateralTypeBonus] || 0;
    }
    
    return score;
  }

  /**
   * Calculate guarantor score
   */
  private static calculateGuarantorScore(data: CreditScoringData): number {
    if (!data.hasGuarantors) return 0;
    
    let score = 20; // Base score for having guarantors
    
    // More guarantors = better (up to a point)
    if (data.guarantorCount >= 2) score += 30;
    else if (data.guarantorCount === 1) score += 15;
    
    return score;
  }

  /**
   * Calculate demographics score
   */
  private static calculateDemographicsScore(data: CreditScoringData): number {
    let score = 0;
    
    // Age factor (optimal range 25-55)
    if (data.age >= 25 && data.age <= 55) score += 30;
    else if (data.age >= 22 && data.age <= 60) score += 20;
    else if (data.age >= 18 && data.age <= 65) score += 10;
    
    // Education level
    const educationBonus = {
      'phd': 25,
      'masters': 20,
      'degree': 15,
      'diploma': 10,
      'secondary': 5,
      'primary': 0
    };
    
    score += educationBonus[data.educationLevel] || 0;
    
    return score;
  }

  /**
   * Calculate loan type score
   */
  private static calculateLoanTypeScore(data: CreditScoringData): number {
    let baseScore = 0;
    
    // Base scores for different loan types
    const loanTypeScores = {
      'home': 30,
      'education': 25,
      'business': 20,
      'agricultural': 15,
      'vehicle': 10,
      'personal': 5,
      'emergency': 0
    };
    
    baseScore = loanTypeScores[data.loanType] || 0;
    
    // Enhanced scoring for business loans based on client type and income source
    if (data.loanType === 'business') {
      if (data.isBusinessLoanForIndividual) {
        // Individual client applying for business loan
        if (data.incomeSource === 'business') {
          baseScore += 30; // Business income + business loan = ideal match
        } else if (data.incomeSource === 'self_employed') {
          baseScore += 20; // Self-employed + business loan = good match
        } else if (data.incomeSource === 'employment') {
          baseScore += 10; // Employment income + business loan = acceptable
        } else {
          baseScore -= 10; // Other income sources + business loan = risky
        }
        
        // Additional bonuses for business documentation
        if (data.businessRegistrationNumber) {
          baseScore += 15; // Registered business
        }
        if (data.businessNetProfit && data.businessNetProfit > 0) {
          baseScore += 20; // Profitable business
        }
        if (data.businessBankStatements && data.businessTaxReturns) {
          baseScore += 15; // Complete business documentation
        }
      } else {
        // Business entity applying for business loan
        baseScore += 25; // Higher base score for business entities
      }
    }
    
    // Penalty for mismatched loan types
    if (data.loanType === 'personal' && data.incomeSource === 'business') {
      baseScore -= 5; // Business income for personal loan is less ideal
    }
    
    return baseScore;
  }

  /**
   * Apply machine learning adjustments based on historical data
   */
  private static applyMLAdjustments(score: number, data: CreditScoringData, historicalData: any[]): number {
    // This is where we would apply ML models
    // For now, we'll implement basic pattern recognition
    
    // Find similar historical cases
    const similarCases = historicalData.filter(record => 
      Math.abs(record.monthlyIncome - data.monthlyIncome) < data.monthlyIncome * 0.2 &&
      record.loanType === data.loanType &&
      record.incomeSource === data.incomeSource
    );
    
    if (similarCases.length > 0) {
      const avgDefaultRate = similarCases.reduce((sum, case_) => sum + (case_.defaulted ? 1 : 0), 0) / similarCases.length;
      
      // Adjust score based on historical performance
      if (avgDefaultRate > 0.3) score -= 50;
      else if (avgDefaultRate > 0.2) score -= 30;
      else if (avgDefaultRate < 0.05) score += 30;
      else if (avgDefaultRate < 0.1) score += 15;
    }
    
    return score;
  }

  /**
   * Calculate risk rating
   */
  private static calculateRiskRating(score: number): 'low' | 'medium' | 'high' | 'very_high' {
    if (score >= 750) return 'low';
    else if (score >= 650) return 'medium';
    else if (score >= 500) return 'high';
    else return 'very_high';
  }

  /**
   * Generate factors analysis
   */
  private static generateFactors(data: CreditScoringData, score: number): {
    positive: string[];
    negative: string[];
    neutral: string[];
  } {
    const factors = {
      positive: [] as string[],
      negative: [] as string[],
      neutral: [] as string[]
    };
    
    // Income factors
    if (data.monthlyIncome > 1000000) factors.positive.push('High income level');
    else if (data.monthlyIncome > 500000) factors.positive.push('Good income level');
    else if (data.monthlyIncome < 200000) factors.negative.push('Low income level');
    
    // Enhanced income source analysis
    if (data.incomeSource === 'employment') {
      factors.positive.push('Stable employment income');
    } else if (data.incomeSource === 'business') {
      if (data.businessYears && data.businessYears > 3) {
        factors.positive.push('Established business');
      } else if (data.businessYears && data.businessYears > 1) {
        factors.neutral.push('New but operating business');
      } else {
        factors.negative.push('Very new business');
      }
      
      // Business-specific factors
      if (data.businessNetProfit && data.businessNetProfit > 0) {
        factors.positive.push('Profitable business');
      }
      if (data.businessRegistrationNumber) {
        factors.positive.push('Registered business');
      }
      if (data.businessBankStatements && data.businessTaxReturns) {
        factors.positive.push('Complete business documentation');
      }
    } else if (data.incomeSource === 'self_employed') {
      if (data.isBusinessLoanForIndividual) {
        factors.positive.push('Self-employed income suitable for business loan');
      } else {
        factors.neutral.push('Self-employed income');
      }
    } else if (data.incomeSource === 'freelance') {
      if (data.isBusinessLoanForIndividual) {
        factors.neutral.push('Freelance income for business loan');
      } else {
        factors.negative.push('Unstable freelance income');
      }
    }
    
    // Business loan specific factors
    if (data.isBusinessLoanForIndividual) {
      if (data.incomeSource === 'business') {
        factors.positive.push('Business income matches loan purpose');
      } else if (data.incomeSource === 'employment') {
        factors.negative.push('Employment income for business loan - higher risk');
      }
      
      if (data.businessType && ['retail', 'wholesale', 'manufacturing', 'services'].includes(data.businessType)) {
        factors.positive.push('Established business type');
      }
    }
    
    // Debt-to-income
    const annualIncome = data.monthlyIncome * 12;
    const debtRatio = (data.existingLoans + data.requestedAmount) / annualIncome;
    if (debtRatio < 0.3) factors.positive.push('Low debt-to-income ratio');
    else if (debtRatio > 0.6) factors.negative.push('High debt-to-income ratio');
    
    // Credit history
    if (data.previousRepaymentHistory === 'excellent') factors.positive.push('Excellent repayment history');
    else if (data.previousRepaymentHistory === 'default') factors.negative.push('Previous loan default');
    
    // Collateral
    if (data.hasCollateral && data.collateralValue && data.collateralValue >= data.requestedAmount) {
      factors.positive.push('Adequate collateral coverage');
    }
    
    // Guarantors
    if (data.hasGuarantors && data.guarantorCount >= 2) factors.positive.push('Multiple guarantors');
    
    return factors;
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(data: CreditScoringData, score: number, riskRating: string): string[] {
    const recommendations: string[] = [];
    
    if (score < 500) {
      recommendations.push('Consider reducing loan amount');
      recommendations.push('Provide additional collateral');
      recommendations.push('Add more guarantors');
    }
    
    if (data.monthlyIncome < 200000) {
      recommendations.push('Consider income verification from additional sources');
    }
    
    if (!data.hasCollateral) {
      recommendations.push('Consider providing collateral to improve approval chances');
    }
    
    if (data.previousRepaymentHistory === 'poor' || data.previousRepaymentHistory === 'default') {
      recommendations.push('Provide detailed explanation of previous loan issues');
    }
    
    return recommendations;
  }

  /**
   * Calculate probability of default using ML
   */
  private static calculateDefaultProbability(data: CreditScoringData, historicalData: any[]): number {
    // Simplified ML model - in production, this would use a trained model
    let probability = 0.1; // Base 10% default rate
    
    // Adjust based on key factors
    if (data.monthlyIncome < 200000) probability += 0.2;
    if (data.previousRepaymentHistory === 'default') probability += 0.3;
    if (data.previousRepaymentHistory === 'poor') probability += 0.15;
    if (!data.hasCollateral) probability += 0.1;
    if (!data.hasGuarantors) probability += 0.05;
    
    const debtRatio = (data.existingLoans + data.requestedAmount) / (data.monthlyIncome * 12);
    if (debtRatio > 0.6) probability += 0.2;
    else if (debtRatio > 0.4) probability += 0.1;
    
    return Math.min(0.9, Math.max(0.01, probability));
  }

  /**
   * Calculate confidence level
   */
  private static calculateConfidence(data: CreditScoringData, historicalData: any[]): number {
    let confidence = 0.5; // Base confidence
    
    // More data = higher confidence
    if (data.crbScore) confidence += 0.2;
    if (data.previousRepaymentHistory) confidence += 0.1;
    if (data.hasCollateral) confidence += 0.1;
    if (data.hasGuarantors) confidence += 0.1;
    
    // Historical data availability
    if (historicalData.length > 100) confidence += 0.1;
    else if (historicalData.length > 50) confidence += 0.05;
    
    return Math.min(1.0, confidence);
  }

  /**
   * Load historical data for machine learning
   */
  private static async loadHistoricalData(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          id,
          requested_amount,
          net_monthly_salary,
          income_source,
          loan_purpose,
          assessment_score,
          risk_grade,
          status,
          created_at
        `)
        .not('assessment_score', 'is', null)
        .limit(1000);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error loading historical data:', error);
      return [];
    }
  }

  /**
   * Update weights based on historical performance
   */
  private static updateWeightsFromHistory(historicalData: any[]): void {
    if (historicalData.length < 50) return; // Need sufficient data
    
    // Analyze which factors best predict loan performance
    // This is a simplified version - in production, you'd use more sophisticated ML
    
    // For now, we'll keep the static weights
    // In production, this would analyze historical data to adjust weights
  }

  /**
   * Fallback basic scoring
   */
  private static calculateBasicScore(data: CreditScoringData): CreditScoreResult {
    const score = this.BASE_SCORE + this.calculateIncomeScore(data) + this.calculateStabilityScore(data);
    
    return {
      score: Math.min(this.MAX_SCORE, Math.max(this.MIN_SCORE, score)),
      riskRating: this.calculateRiskRating(score),
      confidence: 0.3,
      factors: { positive: [], negative: [], neutral: [] },
      recommendations: [],
      probabilityOfDefault: 0.2
    };
  }

  /**
   * Save scoring result for future ML training
   */
  static async saveScoringResult(applicationId: string, scoringData: CreditScoringData, result: CreditScoreResult): Promise<void> {
    try {
      await supabase
        .from('credit_scoring_results')
        .insert({
          application_id: applicationId,
          scoring_data: scoringData,
          score: result.score,
          risk_rating: result.riskRating,
          confidence: result.confidence,
          probability_of_default: result.probabilityOfDefault,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving scoring result:', error);
    }
  }
}
