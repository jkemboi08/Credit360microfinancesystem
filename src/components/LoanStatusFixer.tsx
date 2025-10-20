import React, { useState } from 'react';
import { fixLoanStatus, fixAllLoanStatuses } from '../utils/fixLoanStatus';

const LoanStatusFixer: React.FC = () => {
  const [applicationId, setApplicationId] = useState('LA-1760356981765');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFixSpecificLoan = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await fixLoanStatus(applicationId);
      setResult(result);
    } catch (error) {
      setResult({ success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleFixAllLoans = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await fixAllLoanStatuses();
      setResult(result);
    } catch (error) {
      setResult({ success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Loan Status Fixer</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Application ID
          </label>
          <input
            type="text"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter application ID"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleFixSpecificLoan}
            disabled={loading || !applicationId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Fixing...' : 'Fix Specific Loan'}
          </button>

          <button
            onClick={handleFixAllLoans}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Fixing All...' : 'Fix All Loans'}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`font-medium ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.message}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Approval Levels Configuration:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Level 1: 0 - 500,000 TSh (Loan Officer) - No Committee Required</li>
          <li>• Level 2: 500,001 - 2,000,000 TSh (Senior Officer) - No Committee Required</li>
          <li>• Level 3: 2,000,001 - 5,000,000 TSh (Manager) - Committee Required</li>
          <li>• Level 4: 5,000,001+ TSh (Committee) - Committee Required</li>
        </ul>
        <p className="text-sm text-yellow-600 mt-2">
          The loan with 1,000,000 TSh should be Level 2 (Senior Officer) and NOT require committee review.
        </p>
      </div>
    </div>
  );
};

export default LoanStatusFixer;







