import React, { useState, useEffect } from 'react';
import { User, DollarSign, Calendar, Star, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LoyaltyTierDisplay from './LoyaltyTierDisplay';

interface CustomerData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  national_id_number: string | null;
  phone_number: string | null;
  email_address: string | null;
  status: string | null;
  client_category: string | null;
  created_at: string | null;
  updated_at: string | null;
  preferred_loan_amount: number | null;
  preferred_loan_term: number | null;
  credit_limit: number | null;
  pre_approved_amount: number | null;
}

interface LoanProduct {
  id: number;
  name: string;
  min_amount: number;
  max_amount: number;
  interest_rate: number;
  tenor_min_months: number | null;
  tenor_max_months: number | null;
  processing_fee_rate: number | null;
}

interface QuickApplicationFormProps {
  customer: CustomerData;
  onApplicationSubmit: (applicationData: any) => void;
  onCancel: () => void;
}

const QuickApplicationForm: React.FC<QuickApplicationFormProps> = ({
  customer,
  onApplicationSubmit,
  onCancel
}) => {
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [formData, setFormData] = useState({
    loan_amount: customer.preferred_loan_amount || customer.credit_limit || 0,
    loan_term: customer.preferred_loan_term || 12,
    loan_purpose: '',
    guarantor_count: 0,
    collateral_value: 0,
    special_conditions: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLoanProducts();
  }, []);

  const fetchLoanProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setLoanProducts(data || []);
    } catch (err) {
      console.error('Error fetching loan products:', err);
    }
  };

  const calculateInterestRate = (baseRate: number) => {
    // Apply loyalty tier discount
    const discount = getTierDiscount(customer.client_category);
    return Math.max(0, baseRate - discount);
  };

  const getTierDiscount = (tier: string | null) => {
    switch (tier) {
      case 'platinum': return 1.0;
      case 'gold': return 0.5;
      case 'silver': return 0.25;
      default: return 0;
    }
  };

  const calculateProcessingFee = (amount: number, rate: number | null) => {
    if (!rate) return 0;
    const discount = getTierDiscount(customer.client_category);
    const adjustedRate = Math.max(0, rate - (rate * discount * 0.1)); // 10% of discount applied to processing fee
    return amount * (adjustedRate / 100);
  };

  const calculateMonthlyPayment = (amount: number, rate: number, term: number) => {
    const monthlyRate = rate / 100 / 12;
    const numPayments = term;
    
    if (monthlyRate === 0) {
      return amount / numPayments;
    }
    
    return amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedProduct) {
        throw new Error('Please select a loan product');
      }

      const applicationData = {
        client_id: customer.id,
        loan_product_id: selectedProduct.id,
        loan_amount: formData.loan_amount,
        loan_term_months: formData.loan_term,
        interest_rate: calculateInterestRate(selectedProduct.interest_rate),
        processing_fee: calculateProcessingFee(formData.loan_amount, selectedProduct.processing_fee_rate),
        loan_purpose: formData.loan_purpose,
        guarantor_count: formData.guarantor_count,
        collateral_value: formData.collateral_value,
        special_conditions: formData.special_conditions,
        application_type: 'quick_application',
        loyalty_benefits_applied: true,
        tier_discount: getTierDiscount(customer.client_category),
        created_at: new Date().toISOString()
      };

      onApplicationSubmit(applicationData);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const isEligibleForExpressApproval = () => {
    return customer.client_category === 'gold' || customer.client_category === 'platinum';
  };

  const getMaxLoanAmount = () => {
    const productMax = selectedProduct?.max_amount || 0;
    const creditLimit = customer.credit_limit || 0;
    const preApproved = customer.pre_approved_amount || 0;
    
    return Math.min(productMax, Math.max(creditLimit, preApproved));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Quick Loan Application</h2>
              <p className="text-blue-100">
                {customer.first_name} {customer.last_name} - {customer.client_category?.toUpperCase()} Customer
              </p>
            </div>
          </div>
          {isEligibleForExpressApproval() && (
            <div className="flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Express Eligible</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Customer Info */}
        <div className="mb-6">
          <LoyaltyTierDisplay
            tier={customer.client_category}
            status={customer.status}
            performanceScore={0}
            lifetimeValue={0}
            totalLoans={0}
            compact={false}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Credit Limit</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(customer.credit_limit || 0)}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Performance</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              0/100
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Total Loans</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              0
            </div>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Loan Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Loan Product *
            </label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = loanProducts.find(p => p.id === parseInt(e.target.value));
                setSelectedProduct(product || null);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose a loan product</option>
              {loanProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {formatCurrency(product.min_amount)} to {formatCurrency(product.max_amount)} 
                  ({product.interest_rate}% interest)
                </option>
              ))}
            </select>
          </div>

          {/* Loan Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Amount (TZS) *
            </label>
            <input
              type="number"
              value={formData.loan_amount}
              onChange={(e) => setFormData({ ...formData, loan_amount: parseFloat(e.target.value) || 0 })}
              min={selectedProduct?.min_amount || 0}
              max={getMaxLoanAmount()}
              step="1000"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Max: {formatCurrency(getMaxLoanAmount())}
            </p>
          </div>

          {/* Loan Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Term (Months) *
            </label>
            <input
              type="number"
              value={formData.loan_term}
              onChange={(e) => setFormData({ ...formData, loan_term: parseInt(e.target.value) || 0 })}
              min={selectedProduct?.tenor_min_months || 1}
              max={selectedProduct?.tenor_max_months || 60}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Loan Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Purpose *
            </label>
            <select
              value={formData.loan_purpose}
              onChange={(e) => setFormData({ ...formData, loan_purpose: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select purpose</option>
              <option value="business">Business Investment</option>
              <option value="education">Education</option>
              <option value="medical">Medical Emergency</option>
              <option value="home">Home Improvement</option>
              <option value="vehicle">Vehicle Purchase</option>
              <option value="agriculture">Agriculture</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Loan Calculation */}
          {selectedProduct && formData.loan_amount > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Loan Calculation</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Interest Rate</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {calculateInterestRate(selectedProduct.interest_rate).toFixed(2)}%
                  </div>
                  {getTierDiscount(customer.client_category) > 0 && (
                    <div className="text-xs text-green-600">
                      -{getTierDiscount(customer.client_category)}% tier discount
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-600">Processing Fee</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(calculateProcessingFee(formData.loan_amount, selectedProduct.processing_fee_rate))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Monthly Payment</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(calculateMonthlyPayment(
                      formData.loan_amount,
                      calculateInterestRate(selectedProduct.interest_rate),
                      formData.loan_term
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(
                      formData.loan_amount + 
                      calculateProcessingFee(formData.loan_amount, selectedProduct.processing_fee_rate)
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProduct}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    {isEligibleForExpressApproval() ? 'Submit Express Application' : 'Submit Application'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickApplicationForm;

