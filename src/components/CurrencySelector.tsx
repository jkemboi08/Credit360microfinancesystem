import React from 'react';
import { getCurrencyOptions } from '../constants/currencies';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  disabled?: boolean;
  className?: string;
  showFullName?: boolean;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
  showFullName = true
}) => {
  const currencyOptions = getCurrencyOptions();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
      } ${className}`}
    >
      {currencyOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {showFullName ? option.label : `${option.value} (${option.symbol})`}
        </option>
      ))}
    </select>
  );
};

export default CurrencySelector;


















