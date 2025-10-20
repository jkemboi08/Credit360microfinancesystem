// API service for Computation of Liquid Assets (MSP2_05)
export interface LiquidAssetsData {
  cashInHand: number;
  balancesWithBanks: number;
  balancesWithMFSPs: number;
  mnosFloatCash: number;
  treasuryBills: number;
  governmentSecurities: number;
  privateSecurities: number;
  otherLiquidAssets: number;
  totalAssets: number;
}

export interface LiquidAssetsApiResponse {
  success: boolean;
  data: LiquidAssetsData;
  lastUpdated: string;
  msp201Data?: {
    C2: number; // Cash in hand from Balance Sheet
    C3: number; // Balances with banks from Balance Sheet
    C4: number; // Other liquid assets from Balance Sheet
    C5: number; // Total assets from Balance Sheet
  };
}

class LiquidAssetsApiService {
  private static instance: LiquidAssetsApiService;
  private cache: LiquidAssetsApiResponse | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): LiquidAssetsApiService {
    if (!LiquidAssetsApiService.instance) {
      LiquidAssetsApiService.instance = new LiquidAssetsApiService();
    }
    return LiquidAssetsApiService.instance;
  }

  public async fetchLiquidAssetsData(): Promise<LiquidAssetsApiResponse> {
    // Check cache first
    const now = Date.now();
    if (this.cache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      // Simulate API call to CMS
      const response = await this.simulateApiCall();
      
      // Update cache
      this.cache = response;
      this.lastFetchTime = now;
      
      return response;
    } catch (error) {
      console.error('Error fetching liquid assets data:', error);
      throw new Error('Failed to fetch liquid assets data from CMS');
    }
  }

  private async simulateApiCall(): Promise<LiquidAssetsApiResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data for liquid assets
    const mockData: LiquidAssetsData = {
      cashInHand: 25000000,
      balancesWithBanks: 363974919.27,
      balancesWithMFSPs: 15000000,
      mnosFloatCash: 8500000,
      treasuryBills: 50000000,
      governmentSecurities: 25000000,
      privateSecurities: 15000000,
      otherLiquidAssets: 10000000,
      totalAssets: 905867729.89
    };

    // Mock MSP2_01 data for validations
    const msp201Data = {
      C2: 25000000, // Cash in hand
      C3: 363974919.27, // Balances with banks
      C4: 10000000, // Other liquid assets
      C5: 905867729.89 // Total assets
    };

    return {
      success: true,
      data: mockData,
      lastUpdated: new Date().toISOString(),
      msp201Data
    };
  }

  public clearCache(): void {
    this.cache = null;
    this.lastFetchTime = 0;
  }
}

export default LiquidAssetsApiService;










