// API service for Sectoral Classification of Microfinance Loans (MSP2_03)
export interface SectoralLoanData {
  sector: string;
  numberOfBorrowers: number;
  currentAmount: number;
  esm: number;
  substandard: number;
  doubtful: number;
  loss: number;
  amountWrittenOff: number;
}

export interface SectoralClassificationApiResponse {
  success: boolean;
  data: SectoralLoanData[];
  lastUpdated: string;
  totals?: {
    totalBorrowers: number;
    totalOutstanding: number;
    totalCurrent: number;
    totalEsm: number;
    totalSubstandard: number;
    totalDoubtful: number;
    totalLoss: number;
    totalWrittenOff: number;
  };
  collateral?: {
    cashCollateral: number;
    insuranceGuarantee: number;
    compulsorySaving: number;
  };
}

class SectoralClassificationApiService {
  private static instance: SectoralClassificationApiService;
  private cache: SectoralClassificationApiResponse | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): SectoralClassificationApiService {
    if (!SectoralClassificationApiService.instance) {
      SectoralClassificationApiService.instance = new SectoralClassificationApiService();
    }
    return SectoralClassificationApiService.instance;
  }

  public async fetchSectoralClassificationData(): Promise<SectoralClassificationApiResponse> {
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
      console.error('Error fetching sectoral classification data:', error);
      throw new Error('Failed to fetch sectoral classification data from CMS');
    }
  }

  private async simulateApiCall(): Promise<SectoralClassificationApiResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data for all 21 sectors
    const mockData: SectoralLoanData[] = [
      {
        sector: "Agriculture",
        numberOfBorrowers: 1250,
        currentAmount: 125000000,
        esm: 2500000,
        substandard: 5000000,
        doubtful: 2000000,
        loss: 1000000,
        amountWrittenOff: 500000
      },
      {
        sector: "Fishing",
        numberOfBorrowers: 320,
        currentAmount: 32000000,
        esm: 800000,
        substandard: 1600000,
        doubtful: 640000,
        loss: 320000,
        amountWrittenOff: 160000
      },
      {
        sector: "Forest",
        numberOfBorrowers: 180,
        currentAmount: 18000000,
        esm: 360000,
        substandard: 720000,
        doubtful: 288000,
        loss: 144000,
        amountWrittenOff: 72000
      },
      {
        sector: "Hunting",
        numberOfBorrowers: 45,
        currentAmount: 4500000,
        esm: 90000,
        substandard: 180000,
        doubtful: 72000,
        loss: 36000,
        amountWrittenOff: 18000
      },
      {
        sector: "Financial Intermediaries",
        numberOfBorrowers: 25,
        currentAmount: 50000000,
        esm: 1000000,
        substandard: 2000000,
        doubtful: 800000,
        loss: 400000,
        amountWrittenOff: 200000
      },
      {
        sector: "Mining and Quarrying",
        numberOfBorrowers: 80,
        currentAmount: 80000000,
        esm: 1600000,
        substandard: 3200000,
        doubtful: 1280000,
        loss: 640000,
        amountWrittenOff: 320000
      },
      {
        sector: "Manufacturing",
        numberOfBorrowers: 450,
        currentAmount: 90000000,
        esm: 1800000,
        substandard: 3600000,
        doubtful: 1440000,
        loss: 720000,
        amountWrittenOff: 360000
      },
      {
        sector: "Building and Construction",
        numberOfBorrowers: 380,
        currentAmount: 76000000,
        esm: 1520000,
        substandard: 3040000,
        doubtful: 1216000,
        loss: 608000,
        amountWrittenOff: 304000
      },
      {
        sector: "Real Estate",
        numberOfBorrowers: 120,
        currentAmount: 60000000,
        esm: 1200000,
        substandard: 2400000,
        doubtful: 960000,
        loss: 480000,
        amountWrittenOff: 240000
      },
      {
        sector: "Leasing",
        numberOfBorrowers: 60,
        currentAmount: 30000000,
        esm: 600000,
        substandard: 1200000,
        doubtful: 480000,
        loss: 240000,
        amountWrittenOff: 120000
      },
      {
        sector: "Transport and Communication",
        numberOfBorrowers: 280,
        currentAmount: 56000000,
        esm: 1120000,
        substandard: 2240000,
        doubtful: 896000,
        loss: 448000,
        amountWrittenOff: 224000
      },
      {
        sector: "Trade",
        numberOfBorrowers: 850,
        currentAmount: 170000000,
        esm: 3400000,
        substandard: 6800000,
        doubtful: 2720000,
        loss: 1360000,
        amountWrittenOff: 680000
      },
      {
        sector: "Tourism",
        numberOfBorrowers: 150,
        currentAmount: 30000000,
        esm: 600000,
        substandard: 1200000,
        doubtful: 480000,
        loss: 240000,
        amountWrittenOff: 120000
      },
      {
        sector: "Hotels and Restaurants",
        numberOfBorrowers: 200,
        currentAmount: 40000000,
        esm: 800000,
        substandard: 1600000,
        doubtful: 640000,
        loss: 320000,
        amountWrittenOff: 160000
      },
      {
        sector: "Warehousing and Storage",
        numberOfBorrowers: 90,
        currentAmount: 18000000,
        esm: 360000,
        substandard: 720000,
        doubtful: 288000,
        loss: 144000,
        amountWrittenOff: 72000
      },
      {
        sector: "Electricity",
        numberOfBorrowers: 40,
        currentAmount: 20000000,
        esm: 400000,
        substandard: 800000,
        doubtful: 320000,
        loss: 160000,
        amountWrittenOff: 80000
      },
      {
        sector: "Gas",
        numberOfBorrowers: 30,
        currentAmount: 15000000,
        esm: 300000,
        substandard: 600000,
        doubtful: 240000,
        loss: 120000,
        amountWrittenOff: 60000
      },
      {
        sector: "Water",
        numberOfBorrowers: 35,
        currentAmount: 17500000,
        esm: 350000,
        substandard: 700000,
        doubtful: 280000,
        loss: 140000,
        amountWrittenOff: 70000
      },
      {
        sector: "Education",
        numberOfBorrowers: 300,
        currentAmount: 60000000,
        esm: 1200000,
        substandard: 2400000,
        doubtful: 960000,
        loss: 480000,
        amountWrittenOff: 240000
      },
      {
        sector: "Health",
        numberOfBorrowers: 180,
        currentAmount: 36000000,
        esm: 720000,
        substandard: 1440000,
        doubtful: 576000,
        loss: 288000,
        amountWrittenOff: 144000
      },
      {
        sector: "Other Services",
        numberOfBorrowers: 220,
        currentAmount: 44000000,
        esm: 880000,
        substandard: 1760000,
        doubtful: 704000,
        loss: 352000,
        amountWrittenOff: 176000
      },
      {
        sector: "Personal (Private)",
        numberOfBorrowers: 500,
        currentAmount: 100000000,
        esm: 2000000,
        substandard: 4000000,
        doubtful: 1600000,
        loss: 800000,
        amountWrittenOff: 400000
      }
    ];

    // Calculate totals
    const totals = mockData.reduce((acc, sector) => {
      const totalOutstanding = sector.currentAmount + sector.esm + sector.substandard + sector.doubtful + sector.loss;
      return {
        totalBorrowers: acc.totalBorrowers + sector.numberOfBorrowers,
        totalOutstanding: acc.totalOutstanding + totalOutstanding,
        totalCurrent: acc.totalCurrent + sector.currentAmount,
        totalEsm: acc.totalEsm + sector.esm,
        totalSubstandard: acc.totalSubstandard + sector.substandard,
        totalDoubtful: acc.totalDoubtful + sector.doubtful,
        totalLoss: acc.totalLoss + sector.loss,
        totalWrittenOff: acc.totalWrittenOff + sector.amountWrittenOff
      };
    }, {
      totalBorrowers: 0,
      totalOutstanding: 0,
      totalCurrent: 0,
      totalEsm: 0,
      totalSubstandard: 0,
      totalDoubtful: 0,
      totalLoss: 0,
      totalWrittenOff: 0
    });

    return {
      success: true,
      data: mockData,
      lastUpdated: new Date().toISOString(),
      totals,
      collateral: {
        cashCollateral: 5000000,
        insuranceGuarantee: 3000000,
        compulsorySaving: 2000000
      }
    };
  }

  public clearCache(): void {
    this.cache = null;
    this.lastFetchTime = 0;
  }
}

export default SectoralClassificationApiService;










