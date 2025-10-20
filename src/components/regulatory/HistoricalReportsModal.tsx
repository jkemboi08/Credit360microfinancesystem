import React, { useState, useEffect } from 'react';
import { X, Download, Eye, Calendar, CheckCircle, Clock } from 'lucide-react';
import { RegulatoryReportsService, HistoricalReport } from '../../services/regulatoryReportsService';

interface HistoricalReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
}

const HistoricalReportsModal: React.FC<HistoricalReportsModalProps> = ({
  isOpen,
  onClose,
  reportType
}) => {
  const [reports, setReports] = useState<HistoricalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HistoricalReport | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistoricalReports();
    }
  }, [isOpen, reportType]);

  const loadHistoricalReports = async () => {
    setLoading(true);
    try {
      const data = await RegulatoryReportsService.getHistoricalReports(reportType);
      setReports(data);
    } catch (error) {
      console.error('Error loading historical reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report: HistoricalReport) => {
    setSelectedReport(report);
  };

  const handleDownloadReport = (report: HistoricalReport) => {
    // Implementation would download the specific report
    console.log('Downloading report:', report);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'submitted':
        return 'text-blue-600 bg-blue-50';
      case 'draft':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'submitted':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Historical Reports - {reportType}
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
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No historical reports found
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {reportType} - {report.quarterEndDate}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span>{report.status.toUpperCase()}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDownloadReport(report)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 bg-green-50 rounded hover:bg-green-100"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedReport && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Report Details</h4>
            <pre className="text-sm text-gray-600 overflow-auto max-h-40">
              {JSON.stringify(selectedReport.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalReportsModal;



