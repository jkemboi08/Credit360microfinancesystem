// API service for Complaint Report (MSP2_06)
export interface ComplaintData {
  row: number;
  C: number; // Number
  D: number; // Value
  E: number; // Interest Rate
  F: number; // Agreement
  G: number; // Repayment
  H: number; // Loan Statement
  I: number; // Loan Process
  J: number; // Others
}

export interface ComplaintReportApiResponse {
  success: boolean;
  data: ComplaintData[];
  lastUpdated: string;
  quarter: string;
  year: number;
}

class ComplaintReportApiService {
  private static instance: ComplaintReportApiService;
  private cache: ComplaintReportApiResponse | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): ComplaintReportApiService {
    if (!ComplaintReportApiService.instance) {
      ComplaintReportApiService.instance = new ComplaintReportApiService();
    }
    return ComplaintReportApiService.instance;
  }

  public async fetchComplaintReportData(quarter?: string, year?: number): Promise<ComplaintReportApiResponse> {
    // Check cache first
    const now = Date.now();
    if (this.cache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      // Simulate API call to CMS
      const response = await this.simulateApiCall(quarter, year);
      
      // Update cache
      this.cache = response;
      this.lastFetchTime = now;
      
      return response;
    } catch (error) {
      console.error('Error fetching complaint report data:', error);
      throw new Error('Failed to fetch complaint report data from CMS');
    }
  }

  private async simulateApiCall(quarter?: string, year?: number): Promise<ComplaintReportApiResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const currentYear = year || new Date().getFullYear();
    const currentQuarter = quarter || 'Q3';

    // Mock data for complaint report
    const mockData: ComplaintData[] = [
      {
        row: 1,
        C: 15, // Balance at beginning of quarter - Number
        D: 2500000, // Value
        E: 2, // Interest Rate
        F: 1, // Agreement
        G: 3, // Repayment
        H: 4, // Loan Statement
        I: 2, // Loan Process
        J: 3 // Others
      },
      {
        row: 2,
        C: 28, // Complaints received during the quarter - Number
        D: 4500000, // Value
        E: 5, // Interest Rate
        F: 3, // Agreement
        G: 6, // Repayment
        H: 7, // Loan Statement
        I: 4, // Loan Process
        J: 3 // Others
      },
      {
        row: 3,
        C: 22, // Complaints resolved during the quarter - Number
        D: 3800000, // Value
        E: 4, // Interest Rate
        F: 2, // Agreement
        G: 5, // Repayment
        H: 6, // Loan Statement
        I: 3, // Loan Process
        J: 2 // Others
      },
      {
        row: 4,
        C: 3, // Complaints withdrawn during the quarter - Number
        D: 500000, // Value
        E: 1, // Interest Rate
        F: 0, // Agreement
        G: 1, // Repayment
        H: 1, // Loan Statement
        I: 0, // Loan Process
        J: 0 // Others
      },
      {
        row: 5,
        C: 18, // Unresolved complaints at the end of quarter - Number (computed)
        D: 2700000, // Value (computed)
        E: 4, // Interest Rate (computed)
        F: 2, // Agreement (computed)
        G: 3, // Repayment (computed)
        H: 4, // Loan Statement (computed)
        I: 3, // Loan Process (computed)
        J: 4 // Others (computed)
      }
    ];

    return {
      success: true,
      data: mockData,
      lastUpdated: new Date().toISOString(),
      quarter: currentQuarter,
      year: currentYear
    };
  }

  public clearCache(): void {
    this.cache = null;
    this.lastFetchTime = 0;
  }
}

export default ComplaintReportApiService;










