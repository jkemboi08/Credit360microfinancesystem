import React from 'react';
import { getCurrencyOptions, formatCurrency } from '../constants/currencies';

interface CurrencyInputProps {
  value: number;
  currency: string;
  onValueChange: (value: number) => void;
  onCurrencyChange: (currency: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showSymbol?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  placeholder = "0.00",
  disabled = false,
  className = "",
  showSymbol = true
}) => {
  const currencyOptions = getCurrencyOptions();

  return (
    <div className={`flex ${className}`}>
      <input
        type="number"
        value={value}
        onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        disabled={disabled}
        className={`flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
        }`}
        step="0.01"
        min="0"
      />
      <select
        value={currency}
        onChange={(e) => onCurrencyChange(e.target.value)}
        disabled={disabled}
        className={`px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
        }`}
      >
        {currencyOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {showSymbol ? `${option.value} (${option.symbol})` : option.value}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencyInput;


















