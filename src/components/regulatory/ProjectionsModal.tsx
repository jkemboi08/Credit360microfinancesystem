import React, { useState, useEffect } from 'react';
import { X, Download, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { RegulatoryReportsService, ProjectionData } from '../../services/regulatoryReportsService';

interface ProjectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
}

const ProjectionsModal: React.FC<ProjectionsModalProps> = ({
  isOpen,
  onClose,
  reportType
}) => {
  const [projections, setProjections] = useState<ProjectionData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjections();
    }
  }, [isOpen, reportType]);

  const loadProjections = async () => {
    setLoading(true);
    try {
      const data = await RegulatoryReportsService.getProjections(reportType);
      setProjections(data);
    } catch (error) {
      console.error('Error loading projections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadProjections = () => {
    // Implementation would download the projections report
    console.log('Downloading projections:', projections);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 60) return <AlertCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Projections - {reportType}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Projections Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projections.map((projection, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{projection.period}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getConfidenceColor(projection.confidence)}`}>
                      {getConfidenceIcon(projection.confidence)}
                      <span>{projection.confidence}%</span>
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Projected Growth</span>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <p className="font-medium mb-1">Assumptions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {projection.assumptions.map((assumption, idx) => (
                          <li key={idx} className="text-xs">{assumption}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Projections Chart Placeholder */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Projection Trends</h3>
              <div className="h-64 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                  <p>Projection Chart</p>
                  <p className="text-sm">Visual representation of projected trends</p>
                </div>
              </div>
            </div>

            {/* Key Metrics Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-b">
                      Metric
                    </th>
                    {projections.map((projection, index) => (
                      <th key={index} className="px-4 py-2 text-center text-sm font-medium text-gray-900 border-b">
                        {projection.period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900 border-b">
                      Total Assets
                    </td>
                    {projections.map((projection, index) => (
                      <td key={index} className="px-4 py-2 text-sm text-gray-900 text-center border-b">
                        TSh 1,650,000,000
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900 border-b">
                      Total Liabilities
                    </td>
                    {projections.map((projection, index) => (
                      <td key={index} className="px-4 py-2 text-sm text-gray-900 text-center border-b">
                        TSh 1,320,000,000
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900 border-b">
                      Total Capital
                    </td>
                    {projections.map((projection, index) => (
                      <td key={index} className="px-4 py-2 text-sm text-gray-900 text-center border-b">
                        TSh 330,000,000
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900 border-b">
                      Growth Rate
                    </td>
                    {projections.map((projection, index) => (
                      <td key={index} className="px-4 py-2 text-sm text-green-600 text-center border-b font-medium">
                        +{10 + index * 2}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Download Button */}
            <div className="flex justify-end">
              <button
                onClick={handleDownloadProjections}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Download className="w-4 h-4" />
                <span>Download Projections Report</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectionsModal;



