// East Africa Countries Currencies
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  country: string;
  isDefault?: boolean;
}

export const EAST_AFRICA_CURRENCIES: Currency[] = [
  {
    code: 'TZS',
    name: 'Tanzanian Shilling',
    symbol: 'TSh',
    country: 'Tanzania',
    isDefault: true
  },
  {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    country: 'Kenya'
  },
  {
    code: 'UGX',
    name: 'Ugandan Shilling',
    symbol: 'USh',
    country: 'Uganda'
  },
  {
    code: 'RWF',
    name: 'Rwandan Franc',
    symbol: 'RF',
    country: 'Rwanda'
  },
  {
    code: 'BIF',
    name: 'Burundian Franc',
    symbol: 'FBu',
    country: 'Burundi'
  },
  {
    code: 'ETB',
    name: 'Ethiopian Birr',
    symbol: 'Br',
    country: 'Ethiopia'
  },
  {
    code: 'SOS',
    name: 'Somali Shilling',
    symbol: 'S',
    country: 'Somalia'
  },
  {
    code: 'DJF',
    name: 'Djiboutian Franc',
    symbol: 'Fdj',
    country: 'Djibouti'
  },
  {
    code: 'ERN',
    name: 'Eritrean Nakfa',
    symbol: 'Nfk',
    country: 'Eritrea'
  },
  {
    code: 'SSP',
    name: 'South Sudanese Pound',
    symbol: '£',
    country: 'South Sudan'
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    country: 'International'
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    country: 'International'
  }
];

// Get default currency (TZS)
export const DEFAULT_CURRENCY = EAST_AFRICA_CURRENCIES.find(c => c.isDefault) || EAST_AFRICA_CURRENCIES[0];

// Get currency by code
export const getCurrencyByCode = (code: string): Currency | undefined => {
  return EAST_AFRICA_CURRENCIES.find(currency => currency.code === code);
};

// Format currency amount
export const formatCurrency = (amount: number, currencyCode: string = 'TZS'): string => {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) return `${amount.toFixed(2)} ${currencyCode}`;
  
  return `${currency.symbol} ${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// Get currency options for dropdowns
export const getCurrencyOptions = () => {
  return EAST_AFRICA_CURRENCIES.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name} (${currency.country})`,
    symbol: currency.symbol
  }));
};


















