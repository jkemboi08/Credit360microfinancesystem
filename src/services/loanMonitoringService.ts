/**
 * Loan Monitoring Service
 * Provides real-time loan monitoring, portfolio analytics, and risk management
 */

import { supabase } from '../lib/supabaseClient';
import { LoanStatusFlowService } from './loanStatusFlowService';
import { LoanStatusMappingService } from './loanStatusMappingService';
import BOTLoanClassificationService, { LoanData } from './botLoanClassificationService';

export interface LoanMonitoringData {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  balance: number;
  interestRate: number;
  status: string;
  nextPayment: string;
  nextAmount: number;
  product: string;
  disbursementDate: string;
  maturityDate: string;
  dpd: number;
  schedule: string;
  clientType: string;
  termMonths: number;
  loanCategory: string;
  riskRating: string;
  lastContactDate: string;
  totalPaid: number;
  overdueAmount: number;
  repaymentHistory: RepaymentHistory[];
  economicSector: string;
  subSector: string;
  sectoralRiskRating: number;
  currentClassification: string;
  daysInArrears: number;
  riskMigrationHistory: any[];
  interestRateType: string;
  nominalRate: number;
  effectiveRate: number;
  rateCategory: string;
  disbursementDateEnhanced: Date;
  disbursementAmount: number;
  borrowerGender: string;
  disbursementSector: string;
  requiredProvision: number;
  actualProvision: number;
  provisionRate: number;
  lastProvisionDate: Date;
}

export interface RepaymentHistory {
  date: string;
  amount: number;
  status: 'On Time' | 'Late' | 'Overdue' | 'Partial';
}

export interface PortfolioMetrics {
  totalLoans: number;
  activeLoans: number;
  totalPortfolioValue: number;
  totalOutstanding: number;
  par30: number;
  par90: number;
  nplRatio: number;
  totalProvisions: number;
  averageLoanSize: number;
  portfolioAtRisk: number;
  recoveryRate: number;
  disbursementRate: number;
  collectionEfficiency: number;
}

export interface RiskAlert {
  id: string;
  loanId: string;
  clientName: string;
  alertType: 'overdue' | 'risk_migration' | 'provision_required' | 'maturity_approaching';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface LoanPerformanceTrend {
  date: string;
  totalOutstanding: number;
  par30: number;
  par90: number;
  nplRatio: number;
  provisions: number;
  disbursements: number;
  collections: number;
}

export class LoanMonitoringService {
  private static instance: LoanMonitoringService;
  private botService: BOTLoanClassificationService;
  private refreshInterval: NodeJS.Timeout | null = null;
  private subscribers: ((data: LoanMonitoringData[]) => void)[] = [];

  constructor() {
    this.botService = BOTLoanClassificationService.getInstance();
  }

  public static getInstance(): LoanMonitoringService {
    if (!LoanMonitoringService.instance) {
      LoanMonitoringService.instance = new LoanMonitoringService();
    }
    return LoanMonitoringService.instance;
  }

  /**
   * Fetch all active loans with real-time data
   * Now reads from loans table instead of loan_applications for consistency
   */
  public async fetchActiveLoans(): Promise<LoanMonitoringData[]> {
    try {
      console.log('🔍 Fetching active loans from loans table...');
      
      // Get correct status values for active loans
      const activeStatuses = LoanStatusMappingService.getActiveLoanStatuses();
      
      // Fetch active loans from loans table (the correct data source)
      const { data: activeLoans, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .in('status', activeStatuses.loans);

      if (loanError) {
        console.error('Error fetching active loans:', loanError);
        return [];
      }

      // If no active loans found
      if (!activeLoans || activeLoans.length === 0) {
        console.log('No active loans found in loans table');
        return [];
      }

      console.log('Loan Monitoring - Found active loans:', activeLoans.length);
      console.log('Loan Monitoring - Loan statuses:', activeLoans.map(loan => ({ id: loan.id, status: loan.status, client_id: loan.client_id })));
      
      console.log('Active loans ready for processing:', activeLoans.length);
      console.log('Active loan statuses:', activeLoans.map(loan => ({ id: loan.id, status: loan.status })));
      
      // All active loans from loans table are ready for monitoring
      const monitoringLoans = activeLoans;
      
      console.log('Loans selected for monitoring:', monitoringLoans.length);
      console.log('Monitoring loan statuses:', monitoringLoans.map(loan => ({ id: loan.id, status: loan.status })));
      
      // Fetch clients separately
      const clientIds = monitoringLoans.map(app => app.client_id).filter(Boolean);
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, gender, client_type')
        .in('id', clientIds);

      // Fetch loan products separately
      const productIds = monitoringLoans.map(app => app.product_id).filter(Boolean);
      const { data: loanProducts, error: productsError } = await supabase
        .from('loan_products')
        .select('id, name, category, interest_rate, term_months')
        .in('id', productIds);
      
      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
      }
      
      if (productsError) {
        console.error('Error fetching loan products:', productsError);
      }
      
      // Status check already done above

      // Fetch repayment history (skip for now due to RLS issues)
      const repayments: any[] = [];
      const repaymentError = null;

      if (repaymentError) {
        console.error('Error fetching repayments:', repaymentError);
        // Continue with empty repayments array
      }

      // Transform data to monitoring format
      const monitoringData: LoanMonitoringData[] = monitoringLoans
        .filter(app => app && app.id) // Filter out null/undefined applications
        .map(app => {
          // Add comprehensive null checks
          if (!app) {
            console.warn('Skipping null/undefined application');
            return null;
          }

          const client = clients?.find(c => c && c.id === app.client_id);
          const product = loanProducts?.find(p => p && p.id === app.product_id);
          const clientName = `${client?.first_name || ''} ${client?.last_name || ''}`.trim() || 'Unknown Client';
        
        // Calculate days past due with null safety
        const maturityDate = app.maturity_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        const daysPastDue = this.calculateDaysPastDue(maturityDate);
        
        // Get repayment history for this loan with null safety
        const loanRepayments = Array.isArray(repayments) ? repayments.filter(r => r && r.loan_application_id === app.id) : [];
        
        // Calculate total paid with null safety
        const totalPaid = loanRepayments.reduce((sum, r) => {
          if (!r || typeof r.amount_paid !== 'number') return sum;
          return sum + r.amount_paid;
        }, 0);
        
        // Calculate overdue amount with null safety
        const overdueAmount = daysPastDue > 0 ? this.calculateOverdueAmount(app, daysPastDue) : 0;
        
        // Calculate next payment with null safety
        const nextPayment = this.calculateNextPayment(app);
        
        // BOT classification with null safety
        const loanData: LoanData = {
          id: app.id || '',
          outstandingAmount: Number(app.requested_amount) || 0,
          daysPastDue: daysPastDue,
          loanType: (app.loan_type === 'housing_microfinance') ? 'housing_microfinance' : 'general',
          disbursementDate: app.disbursement_date || app.created_at || new Date().toISOString(),
          maturityDate: maturityDate,
          principalAmount: Number(app.requested_amount) || 0,
          interestRate: Number(app.interest_rate) || 0,
          clientId: app.client_id || '',
          productId: app.loan_product_id || '',
          status: app.status || '',
          collateralValue: 0,
          guarantorStrength: 0,
          restructuringHistory: 0
        };
        
        const classification = this.botService.classifyLoan(loanData);
        
        return {
          id: app.id || '',
          clientId: app.client_id || '',
          clientName: clientName || 'Unknown Client',
          amount: Number(app.requested_amount) || 0,
          balance: (Number(app.requested_amount) || 0) - totalPaid,
          interestRate: Number(app.interest_rate) || 0,
          status: app.status || 'Unknown',
          nextPayment: nextPayment?.date || new Date().toISOString(),
          nextAmount: nextPayment?.amount || 0,
          product: product?.name || 'Standard Loan',
          disbursementDate: app.disbursement_date || app.created_at || new Date().toISOString(),
          maturityDate: maturityDate,
          dpd: daysPastDue,
          schedule: 'Monthly', // Default schedule since we removed the relationship
          clientType: client?.client_type || 'Individual',
          termMonths: product?.term_months || app.term_months || 12,
          loanCategory: product?.category || 'General',
          riskRating: this.calculateRiskRating(daysPastDue, classification?.category || 'Current'),
          lastContactDate: app.updated_at || new Date().toISOString(),
          totalPaid: totalPaid,
          overdueAmount: overdueAmount,
          repaymentHistory: this.formatRepaymentHistory(loanRepayments),
          economicSector: 'Unknown', // economic_sector column doesn't exist
          subSector: 'General',
          sectoralRiskRating: 2,
          currentClassification: classification?.category || 'Current',
          daysInArrears: daysPastDue,
          riskMigrationHistory: [],
          interestRateType: 'Reducing',
          nominalRate: Number(app.interest_rate) || 0,
          effectiveRate: (Number(app.interest_rate) || 0) * 1.1,
          rateCategory: 'SME',
          disbursementDateEnhanced: new Date(app.disbursement_date || app.created_at || new Date().toISOString()),
          disbursementAmount: Number(app.requested_amount) || 0,
          borrowerGender: client?.gender || 'Unknown',
          disbursementSector: 'Unknown', // economic_sector column doesn't exist
          requiredProvision: classification?.provisionAmount || 0,
          actualProvision: 0,
          provisionRate: classification?.provisionRate || 0,
          lastProvisionDate: new Date()
        };
      })
      .filter((item): item is LoanMonitoringData => item !== null); // Remove null entries

      return monitoringData;
    } catch (error) {
      console.error('Error fetching active loans:', error);
      throw error;
    }
  }

  /**
   * Calculate summary statistics by loan product
   */
  public calculateSummaryByProduct(loans: LoanMonitoringData[]): any[] {
    if (!loans || !Array.isArray(loans)) {
      return [];
    }
    
    const productSummary = loans.reduce((acc, loan) => {
      if (!loan) return acc;
      
      const product = loan.product || 'Unknown';
      if (!acc[product]) {
        acc[product] = {
          product,
          count: 0,
          totalAmount: 0,
          totalBalance: 0,
          avgInterestRate: 0,
          totalInterestRate: 0,
          overdueCount: 0,
          performance: 0
        };
      }
      
      acc[product].count++;
      acc[product].totalAmount += (loan.amount || 0);
      acc[product].totalBalance += (loan.balance || 0);
      acc[product].totalInterestRate += (loan.interestRate || 0);
      if ((loan.dpd || 0) > 0) acc[product].overdueCount++;
    }, {} as any);

    return Object.values(productSummary).map((summary: any) => ({
      ...summary,
      avgInterestRate: summary.totalInterestRate / summary.count,
      performance: summary.overdueCount === 0 ? 100 : ((summary.count - summary.overdueCount) / summary.count) * 100
    })).sort((a, b) => b.performance - a.performance);
  }

  /**
   * Calculate summary statistics by client type
   */
  public calculateSummaryByClientType(loans: LoanMonitoringData[]): any[] {
    if (!loans || !Array.isArray(loans)) {
      return [];
    }
    
    const clientTypeSummary = loans.reduce((acc, loan) => {
      if (!loan) return acc;
      
      const clientType = loan.clientType || 'Individual';
      if (!acc[clientType]) {
        acc[clientType] = {
          clientType,
          count: 0,
          totalAmount: 0,
          totalBalance: 0,
          avgInterestRate: 0,
          totalInterestRate: 0,
          overdueCount: 0,
          performance: 0
        };
      }
      
      acc[clientType].count++;
      acc[clientType].totalAmount += (loan.amount || 0);
      acc[clientType].totalBalance += (loan.balance || 0);
      acc[clientType].totalInterestRate += (loan.interestRate || 0);
      if ((loan.dpd || 0) > 0) acc[clientType].overdueCount++;
    }, {} as any);

    return Object.values(clientTypeSummary).map((summary: any) => ({
      ...summary,
      avgInterestRate: summary.totalInterestRate / summary.count,
      performance: summary.overdueCount === 0 ? 100 : ((summary.count - summary.overdueCount) / summary.count) * 100
    })).sort((a, b) => b.performance - a.performance);
  }

  /**
   * Calculate portfolio metrics
   */
  public async calculatePortfolioMetrics(): Promise<PortfolioMetrics> {
    const loans = await this.fetchActiveLoans();
    
    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'disbursed').length;
    const totalPortfolioValue = loans.reduce((sum, l) => sum + l.amount, 0);
    const totalOutstanding = loans.reduce((sum, l) => sum + l.balance, 0);
    
    const par30Count = loans.filter(l => l.dpd > 30).length;
    const par90Count = loans.filter(l => l.dpd > 90).length;
    const nplCount = loans.filter(l => ['Substandard', 'Doubtful', 'Loss'].includes(l.currentClassification)).length;
    
    const par30 = totalLoans > 0 ? (par30Count / totalLoans) * 100 : 0;
    const par90 = totalLoans > 0 ? (par90Count / totalLoans) * 100 : 0;
    const nplRatio = totalLoans > 0 ? (nplCount / totalLoans) * 100 : 0;
    
    const totalProvisions = loans.reduce((sum, l) => sum + l.requiredProvision, 0);
    const averageLoanSize = totalLoans > 0 ? totalPortfolioValue / totalLoans : 0;
    const portfolioAtRisk = loans.filter(l => l.dpd > 0).reduce((sum, l) => sum + l.balance, 0);
    
    const totalCollections = loans.reduce((sum, l) => sum + l.totalPaid, 0);
    const collectionEfficiency = totalPortfolioValue > 0 ? (totalCollections / totalPortfolioValue) * 100 : 0;
    
    return {
      totalLoans,
      activeLoans,
      totalPortfolioValue,
      totalOutstanding,
      par30,
      par90,
      nplRatio,
      totalProvisions,
      averageLoanSize,
      portfolioAtRisk,
      recoveryRate: 85, // Mock data - would need historical data
      disbursementRate: 12, // Mock data - would need historical data
      collectionEfficiency
    };
  }

  /**
   * Generate risk alerts
   */
  public async generateRiskAlerts(): Promise<RiskAlert[]> {
    const loans = await this.fetchActiveLoans();
    const alerts: RiskAlert[] = [];
    
    loans.forEach(loan => {
      // Overdue alerts
      if (loan.dpd > 0) {
        alerts.push({
          id: `overdue_${loan.id}`,
          loanId: loan.id,
          clientName: loan.clientName,
          alertType: 'overdue',
          severity: loan.dpd > 90 ? 'critical' : loan.dpd > 30 ? 'high' : 'medium',
          message: `Loan ${loan.id} is ${loan.dpd} days overdue`,
          createdAt: new Date().toISOString(),
          isResolved: false
        });
      }
      
      // Risk migration alerts
      if (['Substandard', 'Doubtful', 'Loss'].includes(loan.currentClassification)) {
        alerts.push({
          id: `risk_${loan.id}`,
          loanId: loan.id,
          clientName: loan.clientName,
          alertType: 'risk_migration',
          severity: loan.currentClassification === 'Loss' ? 'critical' : 'high',
          message: `Loan ${loan.id} classified as ${loan.currentClassification}`,
          createdAt: new Date().toISOString(),
          isResolved: false
        });
      }
      
      // Maturity approaching alerts
      const daysToMaturity = this.calculateDaysToMaturity(loan.maturityDate);
      if (daysToMaturity <= 30 && daysToMaturity > 0) {
        alerts.push({
          id: `maturity_${loan.id}`,
          loanId: loan.id,
          clientName: loan.clientName,
          alertType: 'maturity_approaching',
          severity: daysToMaturity <= 7 ? 'high' : 'medium',
          message: `Loan ${loan.id} matures in ${daysToMaturity} days`,
          createdAt: new Date().toISOString(),
          isResolved: false
        });
      }
    });
    
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Get loan performance trends
   */
  public async getPerformanceTrends(days: number = 30): Promise<LoanPerformanceTrend[]> {
    // This would typically fetch historical data
    // For now, we'll generate mock trends based on current data
    const loans = await this.fetchActiveLoans();
    const trends: LoanPerformanceTrend[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        totalOutstanding: loans.reduce((sum, l) => sum + l.balance, 0),
        par30: 2.4 + Math.random() * 2,
        par90: 1.2 + Math.random() * 1,
        nplRatio: 3.1 + Math.random() * 2,
        provisions: loans.reduce((sum, l) => sum + l.requiredProvision, 0),
        disbursements: Math.random() * 1000000,
        collections: Math.random() * 800000
      });
    }
    
    return trends;
  }

  /**
   * Start real-time monitoring
   */
  public startRealTimeMonitoring(callback: (data: LoanMonitoringData[]) => void): void {
    this.subscribers.push(callback);
    
    if (!this.refreshInterval) {
      this.refreshInterval = setInterval(async () => {
        try {
          const data = await this.fetchActiveLoans();
          this.subscribers.forEach(sub => sub(data));
        } catch (error) {
          console.error('Error in real-time monitoring:', error);
        }
      }, 30000); // Refresh every 30 seconds
    }
  }

  /**
   * Stop real-time monitoring
   */
  public stopRealTimeMonitoring(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.subscribers = [];
  }

  // Helper methods
  private calculateDaysPastDue(maturityDate: string): number {
    const today = new Date();
    const maturity = new Date(maturityDate);
    
    if (today <= maturity) return 0;
    
    const timeDiff = today.getTime() - maturity.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  private calculateDaysToMaturity(maturityDate: string): number {
    const today = new Date();
    const maturity = new Date(maturityDate);
    
    if (today >= maturity) return 0;
    
    const timeDiff = maturity.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  private calculateOverdueAmount(loan: any, daysPastDue: number): number {
    // Simplified calculation - would need proper repayment schedule
    const monthlyPayment = (loan.requested_amount || 0) * 0.1; // Assume 10% monthly payment
    return monthlyPayment * Math.ceil(daysPastDue / 30);
  }

  private calculateNextPayment(loan: any): { date: string; amount: number } {
    const monthlyPayment = (loan.requested_amount || 0) * 0.1; // Assume 10% monthly payment
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    
    return {
      date: nextDate.toISOString().split('T')[0],
      amount: monthlyPayment
    };
  }

  private calculateRiskRating(daysPastDue: number, classification: string): string {
    // Consider classification in risk assessment (placeholder for future implementation)
    const classificationMultiplier = classification === 'substandard' ? 1.2 : 1;
    
    if (daysPastDue === 0) return 'Low';
    if (daysPastDue * classificationMultiplier <= 30) return 'Medium';
    if (daysPastDue * classificationMultiplier <= 90) return 'High';
    return 'Critical';
  }

  private formatRepaymentHistory(repayments: any[]): RepaymentHistory[] {
    return repayments.map(r => ({
      date: r.payment_date,
      amount: r.amount_paid || 0,
      status: r.status || 'On Time'
    }));
  }
}

export default LoanMonitoringService;
