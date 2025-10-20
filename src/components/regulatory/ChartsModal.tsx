import React, { useState, useEffect } from 'react';
import { X, Download, BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import { RegulatoryReportsService, ChartData } from '../../services/regulatoryReportsService';

interface ChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  reportData: any;
}

const ChartsModal: React.FC<ChartsModalProps> = ({
  isOpen,
  onClose,
  reportType,
  reportData
}) => {
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      generateCharts();
    }
  }, [isOpen, reportType, reportData]);

  const generateCharts = async () => {
    setLoading(true);
    try {
      const data = await RegulatoryReportsService.generateCharts(reportType, reportData);
      setCharts(data);
    } catch (error) {
      console.error('Error generating charts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChartSelect = (chartId: string) => {
    setSelectedCharts(prev => 
      prev.includes(chartId) 
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  const handleDownloadCharts = async () => {
    const selectedChartsData = charts.filter((_, index) => 
      selectedCharts.includes(index.toString())
    );
    await RegulatoryReportsService.downloadCharts(selectedChartsData);
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-6 h-6" />;
      case 'line':
        return <TrendingUp className="w-6 h-6" />;
      case 'pie':
        return <PieChart className="w-6 h-6" />;
      case 'area':
        return <Activity className="w-6 h-6" />;
      default:
        return <BarChart3 className="w-6 h-6" />;
    }
  };

  const getChartColor = (type: string) => {
    switch (type) {
      case 'bar':
        return 'text-blue-600 bg-blue-50';
      case 'line':
        return 'text-green-600 bg-green-50';
      case 'pie':
        return 'text-purple-600 bg-purple-50';
      case 'area':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Charts & Analytics - {reportType}
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
            {/* Chart Selection */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Available Charts</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedCharts(charts.map((_, index) => index.toString()))}
                  className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedCharts([])}
                  className="px-3 py-1 text-sm text-gray-600 bg-gray-50 rounded hover:bg-gray-100"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {charts.map((chart, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCharts.includes(index.toString())
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleChartSelect(index.toString())}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${getChartColor(chart.type)}`}>
                      {getChartIcon(chart.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{chart.title}</h4>
                      <p className="text-sm text-gray-500 capitalize">{chart.type} Chart</p>
                    </div>
                    <div className={`w-4 h-4 rounded border-2 ${
                      selectedCharts.includes(index.toString())
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedCharts.includes(index.toString()) && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Chart Preview */}
                  <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className={`p-2 rounded-lg ${getChartColor(chart.type)} inline-block mb-2`}>
                        {getChartIcon(chart.type)}
                      </div>
                      <p className="text-sm">Chart Preview</p>
                    </div>
                  </div>
                  
                  {/* Chart Data Info */}
                  <div className="mt-3 text-xs text-gray-500">
                    <p>Data Points: {chart.data.length}</p>
                    <p>Labels: {chart.labels.length}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Charts Summary */}
            {selectedCharts.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">
                      {selectedCharts.length} chart(s) selected
                    </h4>
                    <p className="text-sm text-blue-700">
                      Ready for download
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadCharts}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Selected Charts</span>
                  </button>
                </div>
              </div>
            )}

            {/* Chart Types Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Chart Types Available</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Bar Charts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Line Charts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Pie Charts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Area Charts</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartsModal;



