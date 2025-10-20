import React from 'react';
import {
  Archive,
  Download,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { ReportAnalytics } from '../../services/reportAnalyticsService';

interface ReportAnalyticsCardsProps {
  reportAnalytics: ReportAnalytics | null;
  isLoadingAnalytics: boolean;
}

const ReportAnalyticsCards: React.FC<ReportAnalyticsCardsProps> = ({
  reportAnalytics,
  isLoadingAnalytics
}) => {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Historical Reports Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Archive className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Historical Reports</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Access and manage historical {reportAnalytics?.reportType || 'reports'} with advanced filtering and comparison capabilities.
        </p>
        {isLoadingAnalytics ? (
          <div className="space-y-2">
            <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
            <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
            <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {reportAnalytics?.historicalReports.slice(0, 3).map((report) => (
              <button 
                key={report.id}
                className="w-full text-left p-3 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 flex items-center justify-between"
              >
                <div>
                  <span className="block font-medium">{report.period}</span>
                  <span className="text-xs text-gray-500">{report.size}</span>
                </div>
                <Download className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}
        <button className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
          View All Historical Reports
        </button>
      </div>

      {/* Performance Comparison Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Performance Comparison</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Compare current {reportAnalytics?.reportType || 'report'} performance with previous periods and industry benchmarks.
        </p>
        {isLoadingAnalytics ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
            <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
            <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              reportAnalytics?.performanceMetrics.trend === 'up' ? 'bg-green-50' : 
              reportAnalytics?.performanceMetrics.trend === 'down' ? 'bg-red-50' : 'bg-yellow-50'
            }`}>
              <span className="text-sm font-medium">QoQ Growth</span>
              <span className={`text-sm font-bold ${
                reportAnalytics?.performanceMetrics.trend === 'up' ? 'text-green-600' : 
                reportAnalytics?.performanceMetrics.trend === 'down' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {reportAnalytics?.performanceMetrics.qoqGrowth ? `+${reportAnalytics.performanceMetrics.qoqGrowth}%` : '+0%'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">YoY Growth</span>
              <span className="text-sm font-bold text-blue-600">
                {reportAnalytics?.performanceMetrics.yoyGrowth ? `+${reportAnalytics.performanceMetrics.yoyGrowth}%` : '+0%'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium">Industry Avg</span>
              <span className="text-sm font-bold text-purple-600">
                {reportAnalytics?.performanceMetrics.industryAverage ? `+${reportAnalytics.performanceMetrics.industryAverage}%` : '+0%'}
              </span>
            </div>
          </div>
        )}
        <button className="w-full mt-4 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100">
          Generate Comparison Report
        </button>
      </div>

      {/* Analytics & Projections Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Analytics & Projections</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Advanced analytics and projections for {reportAnalytics?.reportType || 'reports'} with trend analysis.
        </p>
        {isLoadingAnalytics ? (
          <div className="space-y-2">
            <div className="animate-pulse bg-gray-200 h-6 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-6 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-6 rounded"></div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Next 3 Months</span>
              <span className={`font-medium ${
                (reportAnalytics?.projectionData.next3Months || 0) > 10 ? 'text-green-600' : 
                (reportAnalytics?.projectionData.next3Months || 0) > 5 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {reportAnalytics?.projectionData.next3Months ? `+${reportAnalytics.projectionData.next3Months}%` : '+0%'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Next 6 Months</span>
              <span className={`font-medium ${
                (reportAnalytics?.projectionData.next6Months || 0) > 15 ? 'text-green-600' : 
                (reportAnalytics?.projectionData.next6Months || 0) > 10 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {reportAnalytics?.projectionData.next6Months ? `+${reportAnalytics.projectionData.next6Months}%` : '+0%'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Next 12 Months</span>
              <span className={`font-medium ${
                (reportAnalytics?.projectionData.next12Months || 0) > 25 ? 'text-green-600' : 
                (reportAnalytics?.projectionData.next12Months || 0) > 15 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {reportAnalytics?.projectionData.next12Months ? `+${reportAnalytics.projectionData.next12Months}%` : '+0%'}
              </span>
            </div>
            {reportAnalytics?.projectionData.confidence && (
              <div className="mt-2 text-xs text-gray-500">
                Confidence: <span className={`font-medium ${
                  reportAnalytics.projectionData.confidence === 'high' ? 'text-green-600' : 
                  reportAnalytics.projectionData.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {reportAnalytics.projectionData.confidence.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}
        <div className="mt-4 space-y-2">
          <button className="w-full px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100">
            View Projections
          </button>
          <button className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">
            Download Charts
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportAnalyticsCards;










