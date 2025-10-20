import React, { useState } from 'react';
import { X, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RegulatoryReportsService, ComparisonData } from '../../services/regulatoryReportsService';

interface ComparisonReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  currentPeriod: string;
}

const ComparisonReportModal: React.FC<ComparisonReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  currentPeriod
}) => {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [previousPeriod, setPreviousPeriod] = useState('Q3 2025');

  useEffect(() => {
    if (isOpen) {
      generateComparison();
    }
  }, [isOpen, currentPeriod, previousPeriod]);

  const generateComparison = async () => {
    setLoading(true);
    try {
      const data = await RegulatoryReportsService.generateComparisonReport(
        reportType,
        currentPeriod,
        previousPeriod
      );
      setComparisonData(data);
    } catch (error) {
      console.error('Error generating comparison report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadComparison = () => {
    if (comparisonData) {
      // Implementation would download the comparison report
      console.log('Downloading comparison report:', comparisonData);
    }
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (variance < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Comparison Report - {reportType}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Period
              </label>
              <input
                type="text"
                value={currentPeriod}
                disabled
                className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previous Period
              </label>
              <select
                value={previousPeriod}
                onChange={(e) => setPreviousPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Q3 2025">Q3 2025</option>
                <option value="Q2 2025">Q2 2025</option>
                <option value="Q1 2025">Q1 2025</option>
                <option value="Q4 2024">Q4 2024</option>
              </select>
            </div>
            <button
              onClick={generateComparison}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : comparisonData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Current Period</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {currentPeriod}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Previous Period</h3>
                <p className="text-2xl font-bold text-green-600">
                  {previousPeriod}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Variance</h3>
                <p className="text-2xl font-bold text-purple-600">
                  +12.5%
                </p>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-b">
                      Item
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-900 border-b">
                      Current Period
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-900 border-b">
                      Previous Period
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-900 border-b">
                      Variance
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-900 border-b">
                      % Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900 border-b">
                      Total Assets
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                      TSh 1,500,000,000
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                      TSh 1,350,000,000
                    </td>
                    <td className="px-4 py-2 text-sm text-green-600 text-right border-b flex items-center justify-end space-x-1">
                      {getVarianceIcon(150000000)}
                      <span>TSh 150,000,000</span>
                    </td>
                    <td className={`px-4 py-2 text-sm text-right border-b ${getVarianceColor(11.11)}`}>
                      +11.11%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900 border-b">
                      Total Liabilities
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                      TSh 1,200,000,000
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                      TSh 1,100,000,000
                    </td>
                    <td className="px-4 py-2 text-sm text-green-600 text-right border-b flex items-center justify-end space-x-1">
                      {getVarianceIcon(100000000)}
                      <span>TSh 100,000,000</span>
                    </td>
                    <td className={`px-4 py-2 text-sm text-right border-b ${getVarianceColor(9.09)}`}>
                      +9.09%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900 border-b">
                      Total Capital
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                      TSh 300,000,000
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">
                      TSh 250,000,000
                    </td>
                    <td className="px-4 py-2 text-sm text-green-600 text-right border-b flex items-center justify-end space-x-1">
                      {getVarianceIcon(50000000)}
                      <span>TSh 50,000,000</span>
                    </td>
                    <td className={`px-4 py-2 text-sm text-right border-b ${getVarianceColor(20)}`}>
                      +20.00%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Download Button */}
            <div className="flex justify-end">
              <button
                onClick={handleDownloadComparison}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>Download Comparison Report</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No comparison data available
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonReportModal;



