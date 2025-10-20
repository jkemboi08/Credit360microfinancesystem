import React, { useState } from 'react';
import Layout from '../components/Layout';
import { FileText, Download, BarChart3, PieChart, TrendingUp, DollarSign, Users, Shield, Activity, Target, AlertTriangle, UserCheck, Building } from 'lucide-react';

const ReportsSimple: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    {
      id: 'portfolio',
      name: 'Portfolio Quality Report',
      description: 'PAR 30, NPL, and loan performance metrics',
      category: 'Financial',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 'disbursement',
      name: 'Disbursement Report',
      description: 'Summarize disbursed loans by date, channel, and product',
      category: 'Financial',
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      id: 'client-analysis',
      name: 'Client Analysis Report',
      description: 'Client demographics, segmentation, and behavior analysis',
      category: 'Analytics',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'loan-performance',
      name: 'Loan Performance Report',
      description: 'Detailed loan performance by product, status, and risk grade',
      category: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      id: 'staff-performance',
      name: 'Staff Performance Report',
      description: 'Staff productivity, loan processing efficiency, and KPIs',
      category: 'Operations',
      icon: <UserCheck className="w-5 h-5" />
    },
    {
      id: 'risk-assessment',
      name: 'Risk Assessment Report',
      description: 'Credit risk analysis, default predictions, and risk mitigation',
      category: 'Risk Management',
      icon: <Shield className="w-5 h-5" />
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'Regulatory compliance, audit trails, and policy adherence',
      category: 'Compliance',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'operational',
      name: 'Operational Report',
      description: 'System performance, user activity, and operational metrics',
      category: 'Operations',
      icon: <Activity className="w-5 h-5" />
    }
  ];

  const generateReport = async () => {
    if (!selectedReport) return;

    setLoading(true);
    
    try {
      // Simulate report generation with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate simple report data
      const reportData = generateReportData(selectedReport);
      setReportData(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = (reportType: string) => {
    const baseData = {
      reportType,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: '2025-01-01',
        endDate: '2025-10-06'
      }
    };

    switch (reportType) {
      case 'portfolio':
        return {
          ...baseData,
          title: 'Portfolio Quality Report',
          summary: {
            totalLoans: 1250,
            activeLoans: 980,
            par30: 3.2,
            nplRatio: 1.8,
            totalPortfolioValue: 45000000
          },
          details: [
            { category: 'Performing Loans', count: 950, amount: 42000000, percentage: 93.4 },
            { category: 'PAR 1-30 Days', count: 20, amount: 1500000, percentage: 3.2 },
            { category: 'PAR 31-90 Days', count: 8, amount: 800000, percentage: 1.6 },
            { category: 'Over 90 Days', count: 2, amount: 700000, percentage: 1.8 }
          ]
        };

      case 'disbursement':
        return {
          ...baseData,
          title: 'Disbursement Report',
          summary: {
            totalDisbursed: 25000000,
            loanCount: 450,
            averageLoanSize: 55556
          },
          details: [
            { product: 'Micro Loans', count: 300, amount: 12000000, percentage: 48 },
            { product: 'SME Loans', count: 100, amount: 8000000, percentage: 32 },
            { product: 'Group Loans', count: 50, amount: 5000000, percentage: 20 }
          ]
        };

      case 'client-analysis':
        return {
          ...baseData,
          title: 'Client Analysis Report',
          summary: {
            totalClients: 2500,
            verifiedClients: 2200,
            verificationRate: 88
          },
          details: [
            { segment: 'Individual', count: 1800, percentage: 72 },
            { segment: 'Group Members', count: 500, percentage: 20 },
            { segment: 'SME', count: 200, percentage: 8 }
          ],
          demographics: {
            male: 60,
            female: 40,
            ageGroups: {
              '18-25': 15,
              '26-35': 35,
              '36-45': 30,
              '46-55': 15,
              '55+': 5
            }
          }
        };

      default:
        return {
          ...baseData,
          title: 'Report Generated',
          summary: {
            message: 'Report data generated successfully'
          },
          details: []
        };
    }
  };

  const downloadReport = () => {
    if (!reportData) return;
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">Generate and download various reports</p>
          </div>
        </div>

        {/* Report Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedReport === report.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <div className="flex items-center mb-2">
                  <div className="text-blue-600 mr-3">{report.icon}</div>
                  <h3 className="font-medium text-gray-900">{report.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                <span className="inline-block px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded">
                  {report.category}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={generateReport}
              disabled={loading || !selectedReport}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            
            {reportData && (
              <button
                onClick={downloadReport}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            )}
          </div>
        </div>

        {/* Report Results */}
        {reportData && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{reportData.title}</h2>
              <div className="text-sm text-gray-500">
                Generated: {new Date(reportData.generatedAt).toLocaleString()}
              </div>
            </div>

            {/* Summary */}
            {reportData.summary && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            {reportData.details && reportData.details.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(reportData.details[0]).map((key) => (
                          <th
                            key={key}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.details.map((item: any, index: number) => (
                        <tr key={index}>
                          {Object.values(item).map((value: any, valueIndex: number) => (
                            <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {typeof value === 'number' ? value.toLocaleString() : value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportsSimple;