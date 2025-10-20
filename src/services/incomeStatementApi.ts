// API service for fetching Income Statement data from CMS
export interface IncomeStatementData {
  [key: string]: {
    quarterly: number;
    ytd: number;
  };
}

export interface IncomeStatementApiResponse {
  success: boolean;
  data: IncomeStatementData;
  message?: string;
  lastUpdated?: string;
}

// Mock API endpoint - replace with actual CMS API endpoint
const CMS_API_BASE_URL = import.meta.env.VITE_CMS_API_URL || 'http://localhost:3001/api';

export class IncomeStatementApiService {
  private static instance: IncomeStatementApiService;
  private cache: IncomeStatementData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): IncomeStatementApiService {
    if (!IncomeStatementApiService.instance) {
      IncomeStatementApiService.instance = new IncomeStatementApiService();
    }
    return IncomeStatementApiService.instance;
  }

  async fetchIncomeStatementData(forceRefresh: boolean = false): Promise<IncomeStatementApiResponse> {
    const now = Date.now();
    
    // Return cached data if available and not expired
    if (!forceRefresh && this.cache && (now - this.lastFetch) < this.CACHE_DURATION) {
      return {
        success: true,
        data: this.cache,
        message: 'Data loaded from cache',
        lastUpdated: new Date(this.lastFetch).toISOString()
      };
    }

    try {
      // In a real implementation, this would call the actual CMS API
      const response = await this.simulateCmsApiCall();
      
      if (response.success) {
        this.cache = response.data;
        this.lastFetch = now;
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching income statement data:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to fetch data from CMS'
      };
    }
  }

  private async simulateCmsApiCall(): Promise<IncomeStatementApiResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data - replace with actual API call
    // This simulates data fetched from CMS for the 42 rows
    const mockData: IncomeStatementData = {
      // Interest Income (C2-C6)
      'C2': { quarterly: 92631912.15, ytd: 183527847.25 }, // Interest - Loans to Clients
      'C3': { quarterly: 1500000.00, ytd: 3000000.00 },    // Interest - Loans to Microfinance Service Providers
      'C4': { quarterly: 2500000.00, ytd: 5000000.00 },    // Interest - Investments in Govt Securities
      'C5': { quarterly: 500000.00, ytd: 1000000.00 },     // Interest - Bank Deposits
      'C6': { quarterly: 200000.00, ytd: 400000.00 },      // Interest - Others

      // Interest Expense (C8-C12)
      'C8': { quarterly: 12000000.00, ytd: 24000000.00 },  // Interest - Borrowings from Banks & Financial Institutions
      'C9': { quarterly: 8000000.00, ytd: 16000000.00 },   // Interest - Borrowing from Microfinance Service Providers
      'C10': { quarterly: 3000000.00, ytd: 6000000.00 },   // Interest - Borrowings from Abroad
      'C11': { quarterly: 2000000.00, ytd: 4000000.00 },   // Interest - Borrowing from Shareholders
      'C12': { quarterly: 1000000.00, ytd: 2000000.00 },   // Interest - Others

      // Bad Debts and Provisions (C14-C15)
      'C14': { quarterly: 500000.00, ytd: 1000000.00 },    // Bad Debts Written Off Not Provided For
      'C15': { quarterly: 2000000.00, ytd: 4000000.00 },   // Provision for Bad and Doubtful Debts

      // Non-Interest Income (C17-C22)
      'C17': { quarterly: 1500000.00, ytd: 3000000.00 },   // Commissions
      'C18': { quarterly: 2000000.00, ytd: 4000000.00 },   // Fees
      'C19': { quarterly: 500000.00, ytd: 1000000.00 },    // Rental Income on Premises
      'C20': { quarterly: 300000.00, ytd: 600000.00 },     // Dividends on Equity Investment
      'C21': { quarterly: 200000.00, ytd: 400000.00 },     // Income from Recovery of Charged off Assets
      'C22': { quarterly: 800000.00, ytd: 1600000.00 },    // Other Income

      // Non-Interest Expenses (C24-C39)
      'C24': { quarterly: 5000000.00, ytd: 10000000.00 },  // Management Salaries and Benefits
      'C25': { quarterly: 8000000.00, ytd: 16000000.00 },  // Employees Salaries and Benefits
      'C26': { quarterly: 2000000.00, ytd: 4000000.00 },   // Wages
      'C27': { quarterly: 1000000.00, ytd: 2000000.00 },   // Pensions Contributions
      'C28': { quarterly: 500000.00, ytd: 1000000.00 },    // Skills and Development Levy
      'C29': { quarterly: 3000000.00, ytd: 6000000.00 },   // Rental Expense on Premises and Equipment
      'C30': { quarterly: 1500000.00, ytd: 3000000.00 },   // Depreciation - Premises and Equipment
      'C31': { quarterly: 800000.00, ytd: 1600000.00 },    // Amortization - Leasehold Rights and Equipment
      'C32': { quarterly: 300000.00, ytd: 600000.00 },     // Foreclosure and Litigation Expenses
      'C33': { quarterly: 2000000.00, ytd: 4000000.00 },   // Management Fees
      'C34': { quarterly: 500000.00, ytd: 1000000.00 },    // Auditors Fees
      'C35': { quarterly: 1000000.00, ytd: 2000000.00 },   // Taxes
      'C36': { quarterly: 300000.00, ytd: 600000.00 },     // License Fees
      'C37': { quarterly: 400000.00, ytd: 800000.00 },     // Insurance
      'C38': { quarterly: 600000.00, ytd: 1200000.00 },    // Utilities Expenses
      'C39': { quarterly: 1200000.00, ytd: 2400000.00 },   // Other Non-Interest Expenses

      // Income Tax Provision (C41)
      'C41': { quarterly: 3000000.00, ytd: 6000000.00 },   // Income Tax Provision
    };

    return {
      success: true,
      data: mockData,
      message: 'Data fetched successfully from CMS',
      lastUpdated: new Date().toISOString()
    };
  }

  // Method to get specific row data
  getRowData(rowId: string): { quarterly: number; ytd: number } {
    return this.cache?.[rowId] || { quarterly: 0, ytd: 0 };
  }

  // Method to clear cache
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }

  // Method to get all cached data
  getAllCachedData(): IncomeStatementData {
    return this.cache || {};
  }
}

export default IncomeStatementApiService;
