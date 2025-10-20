// API service for Deposits and Borrowings from Banks (MSP2_07)
export interface BankData {
  sno: number;
  name: string;
  depositsTZS: number;
  depositsFCY: number;
  borrowedTZS: number;
  borrowedFCY: number;
  section: 'banks' | 'mfsp' | 'mno' | 'abroad';
}

export interface DepositsBorrowingsApiResponse {
  success: boolean;
  data: BankData[];
  lastUpdated: string;
  quarter: string;
  year: number;
}

class DepositsBorrowingsApiService {
  private static instance: DepositsBorrowingsApiService;
  private cache: DepositsBorrowingsApiResponse | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): DepositsBorrowingsApiService {
    if (!DepositsBorrowingsApiService.instance) {
      DepositsBorrowingsApiService.instance = new DepositsBorrowingsApiService();
    }
    return DepositsBorrowingsApiService.instance;
  }

  public async fetchDepositsBorrowingsData(quarter?: string, year?: number): Promise<DepositsBorrowingsApiResponse> {
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
      console.error('Error fetching deposits and borrowings data:', error);
      throw new Error('Failed to fetch deposits and borrowings data from CMS');
    }
  }

  private async simulateApiCall(quarter?: string, year?: number): Promise<DepositsBorrowingsApiResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const currentYear = year || new Date().getFullYear();
    const currentQuarter = quarter || 'Q3';

    // Mock data for deposits and borrowings
    const mockData: BankData[] = [
      // Banks and Financial Institutions in Tanzania (Rows 1-29)
      { sno: 1, name: "ABSA BANK TANZANIA LIMITED", depositsTZS: 15000000, depositsFCY: 5000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 2, name: "ACCESS BANK TANZANIA LIMITED", depositsTZS: 12000000, depositsFCY: 3000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 3, name: "AFRICAN BANKING CORPORATION LIMITED", depositsTZS: 8000000, depositsFCY: 2000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 4, name: "AKIBA COMMERCIAL BANK LIMITED", depositsTZS: 25000000, depositsFCY: 8000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 5, name: "BANK OF AFRICA TANZANIA LIMITED", depositsTZS: 18000000, depositsFCY: 6000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 6, name: "BANK OF TANZANIA", depositsTZS: 50000000, depositsFCY: 15000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 7, name: "CITIBANK TANZANIA LIMITED", depositsTZS: 30000000, depositsFCY: 10000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 8, name: "CRDB BANK PLC", depositsTZS: 75000000, depositsFCY: 25000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 9, name: "DCB COMMERCIAL BANK PLC", depositsTZS: 20000000, depositsFCY: 7000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 10, name: "EQUITY BANK TANZANIA LIMITED", depositsTZS: 35000000, depositsFCY: 12000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 11, name: "EXIM BANK TANZANIA LIMITED", depositsTZS: 28000000, depositsFCY: 9000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 12, name: "HABIB BANK LIMITED", depositsTZS: 15000000, depositsFCY: 4000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 13, name: "ICBC TANZANIA LIMITED", depositsTZS: 22000000, depositsFCY: 8000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 14, name: "I&M BANK TANZANIA LIMITED", depositsTZS: 32000000, depositsFCY: 11000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 15, name: "KCB BANK TANZANIA LIMITED", depositsTZS: 40000000, depositsFCY: 13000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 16, name: "MAENDELEO BANK PLC", depositsTZS: 18000000, depositsFCY: 5000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 17, name: "MAKAMU COMMERCIAL BANK PLC", depositsTZS: 12000000, depositsFCY: 3000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 18, name: "MBONI COMMERCIAL BANK PLC", depositsTZS: 10000000, depositsFCY: 2000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 19, name: "MUFINDO COMMERCIAL BANK PLC", depositsTZS: 8000000, depositsFCY: 1500000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 20, name: "NATIONAL BANK OF COMMERCE LIMITED", depositsTZS: 60000000, depositsFCY: 20000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 21, name: "NMB BANK PLC", depositsTZS: 80000000, depositsFCY: 30000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 22, name: "PEOPLE'S BANK OF ZANZIBAR", depositsTZS: 25000000, depositsFCY: 8000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 23, name: "POSTAL BANK LIMITED", depositsTZS: 15000000, depositsFCY: 4000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 24, name: "STANBIC BANK TANZANIA LIMITED", depositsTZS: 35000000, depositsFCY: 12000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 25, name: "TANZANIA COMMERCIAL BANK LIMITED", depositsTZS: 45000000, depositsFCY: 15000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 26, name: "TIB DEVELOPMENT BANK LIMITED", depositsTZS: 30000000, depositsFCY: 10000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 27, name: "TRIUMPH BANK LIMITED", depositsTZS: 12000000, depositsFCY: 3000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 28, name: "UNITED BANK FOR AFRICA TANZANIA LIMITED", depositsTZS: 28000000, depositsFCY: 9000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },
      { sno: 29, name: "ZANZIBAR COMMERCIAL BANK LIMITED", depositsTZS: 20000000, depositsFCY: 6000000, borrowedTZS: 0, borrowedFCY: 0, section: 'banks' },

      // Microfinance Service Providers in Tanzania (Rows 32-45)
      { sno: 32, name: "AKIBA MICROFINANCE BANK LIMITED", depositsTZS: 5000000, depositsFCY: 1000000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 33, name: "AMANA MICROFINANCE BANK LIMITED", depositsTZS: 3000000, depositsFCY: 500000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 34, name: "BENKI YA WATU MICROFINANCE BANK LIMITED", depositsTZS: 4000000, depositsFCY: 800000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 35, name: "CRDB MICROFINANCE BANK LIMITED", depositsTZS: 8000000, depositsFCY: 2000000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 36, name: "ECOBANK MICROFINANCE BANK LIMITED", depositsTZS: 6000000, depositsFCY: 1500000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 37, name: "FINCA MICROFINANCE BANK LIMITED", depositsTZS: 7000000, depositsFCY: 1800000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 38, name: "HABIB MICROFINANCE BANK LIMITED", depositsTZS: 2500000, depositsFCY: 400000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 39, name: "KILIMO MICROFINANCE BANK LIMITED", depositsTZS: 3500000, depositsFCY: 700000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 40, name: "MEC MICROFINANCE BANK LIMITED", depositsTZS: 2000000, depositsFCY: 300000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 41, name: "MWANANCHI MICROFINANCE BANK LIMITED", depositsTZS: 4500000, depositsFCY: 900000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 42, name: "NMB MICROFINANCE BANK LIMITED", depositsTZS: 10000000, depositsFCY: 2500000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 43, name: "SACCOS MICROFINANCE BANK LIMITED", depositsTZS: 3000000, depositsFCY: 600000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 44, name: "TANZANIA MICROFINANCE BANK LIMITED", depositsTZS: 4000000, depositsFCY: 800000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },
      { sno: 45, name: "WAKALA MICROFINANCE BANK LIMITED", depositsTZS: 2500000, depositsFCY: 500000, borrowedTZS: 0, borrowedFCY: 0, section: 'mfsp' },

      // Mobile Network Operators Float Balances (Rows 48-55)
      { sno: 48, name: "VODACOM TANZANIA LIMITED", depositsTZS: 15000000, depositsFCY: 0, borrowedTZS: 0, borrowedFCY: 0, section: 'mno' },
      { sno: 49, name: "AIRTEL TANZANIA LIMITED", depositsTZS: 12000000, depositsFCY: 0, borrowedTZS: 0, borrowedFCY: 0, section: 'mno' },
      { sno: 50, name: "TIGO TANZANIA LIMITED", depositsTZS: 8000000, depositsFCY: 0, borrowedTZS: 0, borrowedFCY: 0, section: 'mno' },
      { sno: 51, name: "HALOTEL TANZANIA LIMITED", depositsTZS: 3000000, depositsFCY: 0, borrowedTZS: 0, borrowedFCY: 0, section: 'mno' },
      { sno: 52, name: "ZANTEL TANZANIA LIMITED", depositsTZS: 2000000, depositsFCY: 0, borrowedTZS: 0, borrowedFCY: 0, section: 'mno' },
      { sno: 53, name: "SMART TANZANIA LIMITED", depositsTZS: 1500000, depositsFCY: 0, borrowedTZS: 0, borrowedFCY: 0, section: 'mno' },
      { sno: 54, name: "TTCL TANZANIA LIMITED", depositsTZS: 1000000, depositsFCY: 0, borrowedTZS: 0, borrowedFCY: 0, section: 'mno' },
      { sno: 55, name: "OTHER MNOs", depositsTZS: 2000000, depositsFCY: 0, borrowedTZS: 0, borrowedFCY: 0, section: 'mno' },

      // Borrowings from Abroad (Rows 59-64)
      { sno: 59, name: "AFRICAN DEVELOPMENT BANK", depositsTZS: 0, depositsFCY: 0, borrowedTZS: 50000000, borrowedFCY: 20000000, section: 'abroad' },
      { sno: 60, name: "WORLD BANK", depositsTZS: 0, depositsFCY: 0, borrowedTZS: 75000000, borrowedFCY: 30000000, section: 'abroad' },
      { sno: 61, name: "EUROPEAN INVESTMENT BANK", depositsTZS: 0, depositsFCY: 0, borrowedTZS: 30000000, borrowedFCY: 12000000, section: 'abroad' },
      { sno: 62, name: "INTERNATIONAL FINANCE CORPORATION", depositsTZS: 0, depositsFCY: 0, borrowedTZS: 40000000, borrowedFCY: 15000000, section: 'abroad' },
      { sno: 63, name: "KFW DEVELOPMENT BANK", depositsTZS: 0, depositsFCY: 0, borrowedTZS: 25000000, borrowedFCY: 10000000, section: 'abroad' },
      { sno: 64, name: "OTHER INTERNATIONAL LENDERS", depositsTZS: 0, depositsFCY: 0, borrowedTZS: 20000000, borrowedFCY: 8000000, section: 'abroad' }
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

export default DepositsBorrowingsApiService;










