// API service for fetching Balance Sheet data from CMS
export interface BalanceSheetData {
  [key: string]: number;
}

export interface BalanceSheetApiResponse {
  success: boolean;
  data: BalanceSheetData;
  message?: string;
}

// Mock API endpoint - replace with actual CMS API endpoint
const CMS_API_BASE_URL = import.meta.env.VITE_CMS_API_URL || 'http://localhost:3001/api';

export class BalanceSheetApiService {
  private static instance: BalanceSheetApiService;
  private cache: BalanceSheetData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): BalanceSheetApiService {
    if (!BalanceSheetApiService.instance) {
      BalanceSheetApiService.instance = new BalanceSheetApiService();
    }
    return BalanceSheetApiService.instance;
  }

  async fetchBalanceSheetData(forceRefresh: boolean = false): Promise<BalanceSheetApiResponse> {
    try {
      // Check cache first
      if (!forceRefresh && this.cache && (Date.now() - this.lastFetch) < this.CACHE_DURATION) {
        return {
          success: true,
          data: this.cache,
          message: 'Data loaded from cache'
        };
      }

      // Simulate API call - replace with actual CMS API call
      const response = await this.simulateCmsApiCall();
      
      if (response.success) {
        this.cache = response.data;
        this.lastFetch = Date.now();
      }

      return response;
    } catch (error) {
      console.error('Error fetching balance sheet data:', error);
      return {
        success: false,
        data: {},
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async simulateCmsApiCall(): Promise<BalanceSheetApiResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data - replace with actual API call
    const mockData: BalanceSheetData = {
      // Cash and Cash Equivalents
      'C2': 1500000,  // Cash in Hand
      'C4': 25000000, // Non-Agent Banking Balances
      'C5': 5000000,  // Agent-Banking Balances
      'C6': 3000000,  // Balances with Microfinance Service Providers
      'C7': 800000,   // MNOs Float Balances

      // Investment in Debt Securities
      'C9': 15000000, // Treasury Bills
      'C10': 8000000, // Other Government Securities
      'C11': 5000000, // Private Securities
      'C12': 2000000, // Others
      'C13': 500000,  // Allowance for Probable Losses (Deduction)

      // Equity Investments
      'C15': 10000000, // Equity Investment
      'C16': 200000,   // Allowance for Probable Losses (Deduction)

      // Loans
      'C18': 500000000, // Loans to Clients
      'C19': 10000000,  // Loan to Staff and Related Parties
      'C20': 5000000,   // Loans to other Microfinance Service Providers
      'C21': 15000000,  // Accrued Interest on Loans
      'C22': 25000000,  // Allowances for Probable Losses (Deduction)

      // Property, Plant and Equipment
      'C24': 80000000,  // Property, Plant and Equipment
      'C25': 20000000,  // Accumulated Depreciation (Deduction)

      // Other Assets
      'C27': 5000000,   // Receivables
      'C28': 2000000,   // Prepaid Expenses
      'C29': 1000000,   // Deferred Tax Assets
      'C30': 3000000,   // Intangible Assets
      'C31': 1500000,   // Miscellaneous Assets
      'C32': 500000,    // Allowance for Probable Losses (Deduction)

      // Borrowings in Tanzania
      'C37': 100000000, // Borrowings from Banks and Financial Institutions
      'C38': 50000000,  // Borrowings from Other Microfinance Service Providers
      'C39': 20000000,  // Borrowing from Shareholders
      'C40': 30000000,  // Borrowing from Public through Debt Securities
      'C41': 10000000,  // Other Borrowings

      // Borrowings from Abroad
      'C43': 50000000,  // Borrowings from Banks and Financial Institutions
      'C44': 15000000,  // Borrowing from Shareholders
      'C45': 10000000,  // Other Borrowings

      // Other Liabilities
      'C46': 25000000,  // Cash Collateral/Loan Insurance Guarantees/Compulsory Savings
      'C47': 5000000,   // Tax Payables
      'C48': 2000000,   // Dividend Payables
      'C49': 8000000,   // Other Payables and Accruals

      // Capital
      'C52': 100000000, // Paid-up Ordinary Share Capital
      'C53': 0,         // Paid-up Preference Shares
      'C54': 5000000,   // Capital Grants
      'C55': 2000000,   // Donations
      'C56': 10000000,  // Share Premium
      'C57': 15000000,  // General Reserves
      'C58': 25000000,  // Retained Earnings
      'C59': 5000000,   // Profit/Loss
      'C60': 3000000,   // Other Reserves
    };

    return {
      success: true,
      data: mockData,
      message: 'Data fetched successfully from CMS'
    };
  }

  // Method to clear cache
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }

  // Method to get cached data
  getCachedData(): BalanceSheetData | null {
    return this.cache;
  }
}

// Export singleton instance
export const balanceSheetApi = BalanceSheetApiService.getInstance();
