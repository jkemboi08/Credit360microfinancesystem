// Service for generating report-specific analytics data
export interface HistoricalReport {
  id: string;
  name: string;
  period: string;
  status: 'completed' | 'draft' | 'pending';
  lastModified: string;
  size: string;
}

export interface PerformanceMetrics {
  qoqGrowth: number;
  yoyGrowth: number;
  industryAverage: number;
  trend: 'up' | 'down' | 'stable';
  benchmark: number;
}

export interface ProjectionData {
  next3Months: number;
  next6Months: number;
  next12Months: number;
  confidence: 'high' | 'medium' | 'low';
  riskFactors: string[];
}

export interface ReportAnalytics {
  historicalReports: HistoricalReport[];
  performanceMetrics: PerformanceMetrics;
  projectionData: ProjectionData;
  reportType: string;
  lastUpdated: string;
}

export class ReportAnalyticsService {
  private static instance: ReportAnalyticsService;
  private cache: Map<string, ReportAnalytics> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static getInstance(): ReportAnalyticsService {
    if (!ReportAnalyticsService.instance) {
      ReportAnalyticsService.instance = new ReportAnalyticsService();
    }
    return ReportAnalyticsService.instance;
  }

  async getReportAnalytics(reportId: string): Promise<ReportAnalytics> {
    const cacheKey = reportId;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached;
    }

    const analytics = await this.generateReportSpecificAnalytics(reportId);
    this.cache.set(cacheKey, analytics);
    return analytics;
  }

  private isCacheValid(lastUpdated: string): boolean {
    const now = Date.now();
    const cacheTime = new Date(lastUpdated).getTime();
    return (now - cacheTime) < this.CACHE_DURATION;
  }

  private async generateReportSpecificAnalytics(reportId: string): Promise<ReportAnalytics> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const baseData = this.getBaseReportData(reportId);
    const historicalReports = this.generateHistoricalReports(reportId);
    const performanceMetrics = this.generatePerformanceMetrics(reportId, baseData);
    const projectionData = this.generateProjectionData(reportId, baseData);

    return {
      historicalReports,
      performanceMetrics,
      projectionData,
      reportType: baseData.name,
      lastUpdated: new Date().toISOString()
    };
  }

  private getBaseReportData(reportId: string) {
    const reportData = {
      'balance-sheet': {
        name: 'Balance Sheet (MSP2_01)',
        keyMetrics: ['totalAssets', 'totalLiabilities', 'equity'],
        growthRates: { qoq: 8.5, yoy: 22.3, industry: 18.7 },
        projections: { next3: 6.2, next6: 12.8, next12: 28.5 }
      },
      'income-statement': {
        name: 'Income Statement (MSP2_02)',
        keyMetrics: ['netIncome', 'revenue', 'expenses'],
        growthRates: { qoq: 12.5, yoy: 28.3, industry: 15.2 },
        projections: { next3: 8.2, next6: 15.7, next12: 32.1 }
      },
      'loan-portfolio': {
        name: 'Loan Portfolio (MSP2_03)',
        keyMetrics: ['totalLoans', 'par30', 'par90'],
        growthRates: { qoq: 15.2, yoy: 35.8, industry: 20.1 },
        projections: { next3: 10.5, next6: 18.3, next12: 38.7 }
      },
      'interest-rates': {
        name: 'Interest Rates (MSP2_04)',
        keyMetrics: ['averageRate', 'spread', 'yield'],
        growthRates: { qoq: 2.1, yoy: 8.7, industry: 5.4 },
        projections: { next3: 1.8, next6: 4.2, next12: 9.8 }
      },
      'liquid-assets': {
        name: 'Liquid Assets (MSP2_05)',
        keyMetrics: ['liquidityRatio', 'cashReserves', 'investments'],
        growthRates: { qoq: 5.8, yoy: 18.9, industry: 12.3 },
        projections: { next3: 4.5, next6: 9.2, next12: 21.4 }
      },
      'complaint-report': {
        name: 'Complaint Report (MSP2_06)',
        keyMetrics: ['totalComplaints', 'resolved', 'pending'],
        growthRates: { qoq: -8.2, yoy: -15.6, industry: -10.2 },
        projections: { next3: -5.1, next6: -8.7, next12: -18.3 }
      },
      'deposits-borrowings': {
        name: 'Deposits & Borrowings (MSP2_07)',
        keyMetrics: ['totalDeposits', 'borrowings', 'depositGrowth'],
        growthRates: { qoq: 11.3, yoy: 26.7, industry: 16.8 },
        projections: { next3: 7.8, next6: 14.2, next12: 29.5 }
      },
      'agent-banking-balances': {
        name: 'Agent Banking Balances (MSP2_08)',
        keyMetrics: ['agentBalances', 'transactions', 'coverage'],
        growthRates: { qoq: 18.7, yoy: 42.1, industry: 25.6 },
        projections: { next3: 12.4, next6: 22.8, next12: 45.3 }
      },
      'loans-disbursed': {
        name: 'Loans Disbursed (MSP2_09)',
        keyMetrics: ['totalDisbursed', 'newLoans', 'averageSize'],
        growthRates: { qoq: 14.6, yoy: 31.2, industry: 19.8 },
        projections: { next3: 9.7, next6: 17.5, next12: 36.8 }
      },
      'geographical-distribution': {
        name: 'Geographical Distribution (MSP2_10)',
        keyMetrics: ['urbanCoverage', 'ruralCoverage', 'expansion'],
        growthRates: { qoq: 7.9, yoy: 19.4, industry: 13.2 },
        projections: { next3: 5.6, next6: 11.3, next12: 24.7 }
      }
    };

    return reportData[reportId as keyof typeof reportData] || reportData['balance-sheet'];
  }

  private generateHistoricalReports(reportId: string): HistoricalReport[] {
    const baseData = this.getBaseReportData(reportId);
    const currentYear = new Date().getFullYear();
    
    return [
      {
        id: `${reportId}-q3-${currentYear}`,
        name: `Q3 ${currentYear} ${baseData.name}`,
        period: `Q3 ${currentYear}`,
        status: 'completed',
        lastModified: '2024-10-15',
        size: '2.4 MB'
      },
      {
        id: `${reportId}-q2-${currentYear}`,
        name: `Q2 ${currentYear} ${baseData.name}`,
        period: `Q2 ${currentYear}`,
        status: 'completed',
        lastModified: '2024-07-15',
        size: '2.1 MB'
      },
      {
        id: `${reportId}-q1-${currentYear}`,
        name: `Q1 ${currentYear} ${baseData.name}`,
        period: `Q1 ${currentYear}`,
        status: 'completed',
        lastModified: '2024-04-15',
        size: '1.9 MB'
      },
      {
        id: `${reportId}-q4-${currentYear - 1}`,
        name: `Q4 ${currentYear - 1} ${baseData.name}`,
        period: `Q4 ${currentYear - 1}`,
        status: 'completed',
        lastModified: '2024-01-15',
        size: '2.0 MB'
      }
    ];
  }

  private generatePerformanceMetrics(reportId: string, baseData: any): PerformanceMetrics {
    const { growthRates } = baseData;
    
    return {
      qoqGrowth: growthRates.qoq,
      yoyGrowth: growthRates.yoy,
      industryAverage: growthRates.industry,
      trend: growthRates.qoq > growthRates.industry ? 'up' : 
             growthRates.qoq < growthRates.industry * 0.8 ? 'down' : 'stable',
      benchmark: growthRates.industry
    };
  }

  private generateProjectionData(reportId: string, baseData: any): ProjectionData {
    const { projections } = baseData;
    
    return {
      next3Months: projections.next3,
      next6Months: projections.next6,
      next12Months: projections.next12,
      confidence: projections.next12 > 30 ? 'high' : 
                 projections.next12 > 15 ? 'medium' : 'low',
      riskFactors: this.getRiskFactors(reportId)
    };
  }

  private getRiskFactors(reportId: string): string[] {
    const riskFactors = {
      'balance-sheet': ['Asset quality deterioration', 'Liquidity constraints', 'Capital adequacy'],
      'income-statement': ['Interest rate volatility', 'Credit losses', 'Operating cost inflation'],
      'loan-portfolio': ['Credit risk concentration', 'Economic downturn impact', 'Regulatory changes'],
      'interest-rates': ['Central bank policy changes', 'Market volatility', 'Competition pressure'],
      'liquid-assets': ['Market liquidity conditions', 'Investment losses', 'Regulatory requirements'],
      'complaint-report': ['Service quality issues', 'Regulatory scrutiny', 'Customer satisfaction'],
      'deposits-borrowings': ['Deposit flight risk', 'Interest rate sensitivity', 'Funding costs'],
      'agent-banking-balances': ['Agent network stability', 'Technology failures', 'Regulatory compliance'],
      'loans-disbursed': ['Credit demand fluctuations', 'Economic conditions', 'Competition'],
      'geographical-distribution': ['Regional economic conditions', 'Infrastructure challenges', 'Regulatory variations']
    };

    return riskFactors[reportId as keyof typeof riskFactors] || riskFactors['balance-sheet'];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default ReportAnalyticsService;










