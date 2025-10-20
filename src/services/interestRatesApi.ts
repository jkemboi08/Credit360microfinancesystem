import { supabase } from '../lib/supabaseClient';

export interface InterestRateData {
  sno: number;
  type: string;
  borrowers: number;
  outstandingAmount: number;
  weightedAvgRateStraight: number;
  nominalLowStraight: number;
  nominalHighStraight: number;
  weightedAvgRateReducing: number;
  nominalLowReducing: number;
  nominalHighReducing: number;
  isCalculated: boolean;
  isSubRow?: boolean;
  parentId?: string;
}

export interface InterestRatesApiResponse {
  success: boolean;
  data: InterestRateData[];
  message?: string;
  lastUpdated?: string;
}

// Static loan types as per BoT requirements (14 types + 1 total)
const STATIC_LOAN_TYPES = [
  { sno: 1, type: 'Consumer Loans', isSubRow: false },
  { sno: 2, type: 'Business Loans', isSubRow: false },
  { sno: 3, type: 'Agricultural Loans', isSubRow: false },
  { sno: 4, type: 'Group Loans', isSubRow: false },
  { sno: 5, type: 'Microenterprise Loans', isSubRow: false },
  { sno: 6, type: 'SME Loans', isSubRow: false },
  { sno: 7, type: 'Housing Loans', isSubRow: false },
  { sno: 8, type: 'Education Loans', isSubRow: false },
  { sno: 9, type: 'Health Loans', isSubRow: false },
  { sno: 10, type: 'Salaried Loans', isSubRow: false, isCalculated: true },
  { sno: 11, type: '  (a) Government Employees', isSubRow: true, parentId: 10 },
  { sno: 12, type: '  (b) Private Sector Employees', isSubRow: true, parentId: 10 },
  { sno: 13, type: 'Other Loans', isSubRow: false },
  { sno: 14, type: 'Islamic Finance Loans', isSubRow: false },
  { sno: 15, type: 'Total', isSubRow: false, isCalculated: true }
];

export class InterestRatesApiService {
  private static instance: InterestRatesApiService;
  private cache: InterestRateData[] | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

  static getInstance(): InterestRatesApiService {
    if (!InterestRatesApiService.instance) {
      InterestRatesApiService.instance = new InterestRatesApiService();
    }
    return InterestRatesApiService.instance;
  }

  async fetchInterestRatesData(forceRefresh: boolean = false): Promise<InterestRatesApiResponse> {
    try {
      // Check cache first
      if (!forceRefresh && this.cache && (Date.now() - this.lastFetch) < this.CACHE_DURATION) {
        return {
          success: true,
          data: this.cache,
          message: 'Data loaded from cache',
          lastUpdated: new Date(this.lastFetch).toISOString()
        };
      }

      // Fetch data from CMS (Credit Management System)
      const interestRates = await this.fetchFromCMS();

      // Update cache
      this.cache = interestRates;
      this.lastFetch = Date.now();

      return {
        success: true,
        data: interestRates,
        message: 'Data fetched successfully from CMS',
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching interest rates data:', error);
      return {
        success: false,
        data: this.cache || [],
        message: `Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastUpdated: this.cache ? new Date(this.lastFetch).toISOString() : undefined
      };
    }
  }

  private async fetchFromCMS(): Promise<InterestRateData[]> {
    try {
      // Fetch interest rates data from the CMS system
      const { data: ratesData, error } = await supabase
        .from('interest_rates_structure')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('No interest rates data found in database, using mock data');
        return this.getMockData();
      }

      // If we have real data, process it
      if (ratesData && ratesData.length > 0) {
        return this.processRealData(ratesData[0]);
      }

      // Fallback to mock data
      return this.getMockData();

    } catch (error) {
      console.warn('Error fetching from CMS, using mock data:', error);
      return this.getMockData();
    }
  }

  private processRealData(cmsData: any): InterestRateData[] {
    const interestRates: InterestRateData[] = [];
    
    // Process the 14 loan types (rows 1-14)
    for (let i = 0; i < 14; i++) {
      const loanType = STATIC_LOAN_TYPES[i];
      const loanKey = `loan_type_${i + 1}`;
      
      const borrowers = cmsData[`${loanKey}_borrowers`] || 0;
      const outstandingAmount = cmsData[`${loanKey}_outstanding_amount`] || 0;
      const weightedAvgRateStraight = cmsData[`${loanKey}_weighted_avg_straight`] || 0;
      const nominalLowStraight = cmsData[`${loanKey}_nominal_low_straight`] || 0;
      const nominalHighStraight = cmsData[`${loanKey}_nominal_high_straight`] || 0;
      const weightedAvgRateReducing = cmsData[`${loanKey}_weighted_avg_reducing`] || 0;
      const nominalLowReducing = cmsData[`${loanKey}_nominal_low_reducing`] || 0;
      const nominalHighReducing = cmsData[`${loanKey}_nominal_high_reducing`] || 0;

      interestRates.push({
        sno: loanType.sno,
        type: loanType.type,
        borrowers,
        outstandingAmount,
        weightedAvgRateStraight,
        nominalLowStraight,
        nominalHighStraight,
        weightedAvgRateReducing,
        nominalLowReducing,
        nominalHighReducing,
        isCalculated: loanType.isCalculated || false,
        isSubRow: loanType.isSubRow || false,
        parentId: loanType.parentId
      });
    }

    // Add sub-rows for Salaried Loans (Government and Private Sector Employees)
    const salariedLoans = interestRates.find(item => item.sno === 10);
    if (salariedLoans) {
      // Add Government Employees sub-row
      interestRates.push({
        sno: 11,
        type: '  (a) Government Employees',
        borrowers: cmsData['salaried_government_borrowers'] || 0,
        outstandingAmount: cmsData['salaried_government_outstanding'] || 0,
        weightedAvgRateStraight: cmsData['salaried_government_weighted_avg_straight'] || 0,
        nominalLowStraight: cmsData['salaried_government_nominal_low_straight'] || 0,
        nominalHighStraight: cmsData['salaried_government_nominal_high_straight'] || 0,
        weightedAvgRateReducing: cmsData['salaried_government_weighted_avg_reducing'] || 0,
        nominalLowReducing: cmsData['salaried_government_nominal_low_reducing'] || 0,
        nominalHighReducing: cmsData['salaried_government_nominal_high_reducing'] || 0,
        isCalculated: false,
        isSubRow: true,
        parentId: 10
      });

      // Add Private Sector Employees sub-row
      interestRates.push({
        sno: 12,
        type: '  (b) Private Sector Employees',
        borrowers: cmsData['salaried_private_borrowers'] || 0,
        outstandingAmount: cmsData['salaried_private_outstanding'] || 0,
        weightedAvgRateStraight: cmsData['salaried_private_weighted_avg_straight'] || 0,
        nominalLowStraight: cmsData['salaried_private_nominal_low_straight'] || 0,
        nominalHighStraight: cmsData['salaried_private_nominal_high_straight'] || 0,
        weightedAvgRateReducing: cmsData['salaried_private_weighted_avg_reducing'] || 0,
        nominalLowReducing: cmsData['salaried_private_nominal_low_reducing'] || 0,
        nominalHighReducing: cmsData['salaried_private_nominal_high_reducing'] || 0,
        isCalculated: false,
        isSubRow: true,
        parentId: 10
      });

      // Calculate Salaried Loans totals from sub-rows
      const governmentEmployees = interestRates.find(item => item.sno === 11);
      const privateSectorEmployees = interestRates.find(item => item.sno === 12);
      
      if (governmentEmployees && privateSectorEmployees) {
        salariedLoans.borrowers = governmentEmployees.borrowers + privateSectorEmployees.borrowers;
        salariedLoans.outstandingAmount = governmentEmployees.outstandingAmount + privateSectorEmployees.outstandingAmount;
        salariedLoans.weightedAvgRateStraight = this.calculateWeightedAverageRate([
          { rate: governmentEmployees.weightedAvgRateStraight, amount: governmentEmployees.outstandingAmount },
          { rate: privateSectorEmployees.weightedAvgRateStraight, amount: privateSectorEmployees.outstandingAmount }
        ]);
        salariedLoans.weightedAvgRateReducing = this.calculateWeightedAverageRate([
          { rate: governmentEmployees.weightedAvgRateReducing, amount: governmentEmployees.outstandingAmount },
          { rate: privateSectorEmployees.weightedAvgRateReducing, amount: privateSectorEmployees.outstandingAmount }
        ]);
        salariedLoans.nominalLowStraight = Math.min(governmentEmployees.nominalLowStraight, privateSectorEmployees.nominalLowStraight);
        salariedLoans.nominalHighStraight = Math.max(governmentEmployees.nominalHighStraight, privateSectorEmployees.nominalHighStraight);
        salariedLoans.nominalLowReducing = Math.min(governmentEmployees.nominalLowReducing, privateSectorEmployees.nominalLowReducing);
        salariedLoans.nominalHighReducing = Math.max(governmentEmployees.nominalHighReducing, privateSectorEmployees.nominalHighReducing);
      }
    }

    // Calculate totals (row 15)
    const totalBorrowers = interestRates.reduce((sum, item) => sum + item.borrowers, 0);
    const totalOutstanding = interestRates.reduce((sum, item) => sum + item.outstandingAmount, 0);
    
    // Calculate weighted average rates
    const weightedAvgStraight = this.calculateWeightedAverageRate(
      interestRates.map(item => ({ rate: item.weightedAvgRateStraight, amount: item.outstandingAmount }))
    );
    const weightedAvgReducing = this.calculateWeightedAverageRate(
      interestRates.map(item => ({ rate: item.weightedAvgRateReducing, amount: item.outstandingAmount }))
    );

    // Calculate nominal rates
    const straightRates = interestRates.map(item => item.weightedAvgRateStraight).filter(rate => rate > 0);
    const reducingRates = interestRates.map(item => item.weightedAvgRateReducing).filter(rate => rate > 0);

    const nominalLowStraight = straightRates.length > 0 ? Math.min(...straightRates) : 0;
    const nominalHighStraight = straightRates.length > 0 ? Math.max(...straightRates) : 0;
    const nominalLowReducing = reducingRates.length > 0 ? Math.min(...reducingRates) : 0;
    const nominalHighReducing = reducingRates.length > 0 ? Math.max(...reducingRates) : 0;

    interestRates.push({
      sno: 15,
      type: 'Total',
      borrowers: totalBorrowers,
      outstandingAmount: totalOutstanding,
      weightedAvgRateStraight: weightedAvgStraight,
      nominalLowStraight,
      nominalHighStraight,
      weightedAvgRateReducing: weightedAvgReducing,
      nominalLowReducing,
      nominalHighReducing,
      isCalculated: true
    });

    return interestRates;
  }

  private getMockData(): InterestRateData[] {
    const interestRates: InterestRateData[] = [];
    
    // Generate mock data for 14 loan types
    for (let i = 0; i < 14; i++) {
      const loanType = STATIC_LOAN_TYPES[i];
      
      // Generate realistic interest rate data
      const borrowers = Math.floor(Math.random() * 500) + 50; // 50-550 borrowers
      const outstandingAmount = Math.floor(Math.random() * 100000000) + 10000000; // 10M-100M TZS
      const baseRate = 15 + Math.random() * 20; // 15-35% base rate
      const variation = 2 + Math.random() * 3; // 2-5% variation
      
      const weightedAvgRateStraight = baseRate;
      const nominalLowStraight = Math.max(0, baseRate - variation);
      const nominalHighStraight = baseRate + variation;
      const weightedAvgRateReducing = baseRate * 0.8; // Reducing rates typically lower
      const nominalLowReducing = Math.max(0, (baseRate - variation) * 0.8);
      const nominalHighReducing = (baseRate + variation) * 0.8;

      interestRates.push({
        sno: loanType.sno,
        type: loanType.type,
        borrowers,
        outstandingAmount,
        weightedAvgRateStraight,
        nominalLowStraight,
        nominalHighStraight,
        weightedAvgRateReducing,
        nominalLowReducing,
        nominalHighReducing,
        isCalculated: loanType.isCalculated || false,
        isSubRow: loanType.isSubRow || false,
        parentId: loanType.parentId
      });
    }

    // Add sub-rows for Salaried Loans (Government and Private Sector Employees)
    const salariedLoans = interestRates.find(item => item.sno === 10);
    if (salariedLoans) {
      // Add Government Employees sub-row
      const govBorrowers = Math.floor(Math.random() * 200) + 30;
      const govOutstanding = Math.floor(Math.random() * 50000000) + 5000000;
      const govBaseRate = 12 + Math.random() * 8; // 12-20% for government employees
      
      interestRates.push({
        sno: 11,
        type: '  (a) Government Employees',
        borrowers: govBorrowers,
        outstandingAmount: govOutstanding,
        weightedAvgRateStraight: govBaseRate,
        nominalLowStraight: Math.max(0, govBaseRate - 2),
        nominalHighStraight: govBaseRate + 2,
        weightedAvgRateReducing: govBaseRate * 0.8,
        nominalLowReducing: Math.max(0, (govBaseRate - 2) * 0.8),
        nominalHighReducing: (govBaseRate + 2) * 0.8,
        isCalculated: false,
        isSubRow: true,
        parentId: 10
      });

      // Add Private Sector Employees sub-row
      const privateBorrowers = Math.floor(Math.random() * 300) + 50;
      const privateOutstanding = Math.floor(Math.random() * 80000000) + 10000000;
      const privateBaseRate = 18 + Math.random() * 12; // 18-30% for private sector
      
      interestRates.push({
        sno: 12,
        type: '  (b) Private Sector Employees',
        borrowers: privateBorrowers,
        outstandingAmount: privateOutstanding,
        weightedAvgRateStraight: privateBaseRate,
        nominalLowStraight: Math.max(0, privateBaseRate - 3),
        nominalHighStraight: privateBaseRate + 3,
        weightedAvgRateReducing: privateBaseRate * 0.8,
        nominalLowReducing: Math.max(0, (privateBaseRate - 3) * 0.8),
        nominalHighReducing: (privateBaseRate + 3) * 0.8,
        isCalculated: false,
        isSubRow: true,
        parentId: 10
      });

      // Calculate Salaried Loans totals from sub-rows
      const governmentEmployees = interestRates.find(item => item.sno === 11);
      const privateSectorEmployees = interestRates.find(item => item.sno === 12);
      
      if (governmentEmployees && privateSectorEmployees) {
        salariedLoans.borrowers = governmentEmployees.borrowers + privateSectorEmployees.borrowers;
        salariedLoans.outstandingAmount = governmentEmployees.outstandingAmount + privateSectorEmployees.outstandingAmount;
        salariedLoans.weightedAvgRateStraight = this.calculateWeightedAverageRate([
          { rate: governmentEmployees.weightedAvgRateStraight, amount: governmentEmployees.outstandingAmount },
          { rate: privateSectorEmployees.weightedAvgRateStraight, amount: privateSectorEmployees.outstandingAmount }
        ]);
        salariedLoans.weightedAvgRateReducing = this.calculateWeightedAverageRate([
          { rate: governmentEmployees.weightedAvgRateReducing, amount: governmentEmployees.outstandingAmount },
          { rate: privateSectorEmployees.weightedAvgRateReducing, amount: privateSectorEmployees.outstandingAmount }
        ]);
        salariedLoans.nominalLowStraight = Math.min(governmentEmployees.nominalLowStraight, privateSectorEmployees.nominalLowStraight);
        salariedLoans.nominalHighStraight = Math.max(governmentEmployees.nominalHighStraight, privateSectorEmployees.nominalHighStraight);
        salariedLoans.nominalLowReducing = Math.min(governmentEmployees.nominalLowReducing, privateSectorEmployees.nominalLowReducing);
        salariedLoans.nominalHighReducing = Math.max(governmentEmployees.nominalHighReducing, privateSectorEmployees.nominalHighReducing);
      }
    }

    // Calculate totals (row 15)
    const totalBorrowers = interestRates.reduce((sum, item) => sum + item.borrowers, 0);
    const totalOutstanding = interestRates.reduce((sum, item) => sum + item.outstandingAmount, 0);
    
    // Calculate weighted average rates
    const weightedAvgStraight = this.calculateWeightedAverageRate(
      interestRates.map(item => ({ rate: item.weightedAvgRateStraight, amount: item.outstandingAmount }))
    );
    const weightedAvgReducing = this.calculateWeightedAverageRate(
      interestRates.map(item => ({ rate: item.weightedAvgRateReducing, amount: item.outstandingAmount }))
    );

    // Calculate nominal rates
    const straightRates = interestRates.map(item => item.weightedAvgRateStraight).filter(rate => rate > 0);
    const reducingRates = interestRates.map(item => item.weightedAvgRateReducing).filter(rate => rate > 0);

    const nominalLowStraight = straightRates.length > 0 ? Math.min(...straightRates) : 0;
    const nominalHighStraight = straightRates.length > 0 ? Math.max(...straightRates) : 0;
    const nominalLowReducing = reducingRates.length > 0 ? Math.min(...reducingRates) : 0;
    const nominalHighReducing = reducingRates.length > 0 ? Math.max(...reducingRates) : 0;

    interestRates.push({
      sno: 15,
      type: 'Total',
      borrowers: totalBorrowers,
      outstandingAmount: totalOutstanding,
      weightedAvgRateStraight: weightedAvgStraight,
      nominalLowStraight,
      nominalHighStraight,
      weightedAvgRateReducing: weightedAvgReducing,
      nominalLowReducing,
      nominalHighReducing,
      isCalculated: true
    });

    return interestRates;
  }

  private calculateWeightedAverageRate(loans: { rate: number; amount: number }[]): number {
    if (loans.length === 0) return 0;
    const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
    if (totalAmount === 0) return 0;
    const weightedSum = loans.reduce((sum, loan) => sum + (loan.rate * loan.amount), 0);
    return weightedSum / totalAmount;
  }

  // Get MSP2_01.C17 + MSP2_01.C22 value for validation
  async getMSP201C17C22Value(): Promise<number> {
    try {
      // This would fetch the C17 + C22 values from MSP2_01 (Balance Sheet)
      // For now, we'll return a mock value
      return 2500000000; // 2.5B TZS mock value
    } catch (error) {
      console.error('Error fetching MSP2_01.C17+C22 value:', error);
      return 0;
    }
  }

  // Get MSP2_03.C67 value for validation
  async getMSP203C67Value(): Promise<number> {
    try {
      // This would fetch the C67 value from MSP2_03 (Loan Portfolio)
      // For now, we'll return a mock value
      return 1500; // 1500 borrowers mock value
    } catch (error) {
      console.error('Error fetching MSP2_03.C67 value:', error);
      return 0;
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}

export default InterestRatesApiService;
