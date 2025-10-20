import React from 'react';
import { 
  BarChart3, 
  FileText, 
  Upload, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

interface WorkflowStats {
  totalLoans: number;
  inAssessment: number;
  approved: number;
  contractGenerated: number;
  contractUploaded: number;
  readyForDisbursement: number;
  disbursed: number;
  rejected: number;
}

interface WorkflowStatusDashboardProps {
  stats: WorkflowStats;
  onRefresh: () => void;
  isLoading?: boolean;
}

const WorkflowStatusDashboard: React.FC<WorkflowStatusDashboardProps> = ({
  stats,
  onRefresh,
  isLoading = false
}) => {
  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const workflowSteps = [
    {
      title: 'Assessment',
      count: stats.inAssessment,
      percentage: getPercentage(stats.inAssessment, stats.totalLoans),
      color: 'blue',
      icon: BarChart3
    },
    {
      title: 'Approved',
      count: stats.approved,
      percentage: getPercentage(stats.approved, stats.totalLoans),
      color: 'green',
      icon: CheckCircle
    },
    {
      title: 'Contract Generated',
      count: stats.contractGenerated,
      percentage: getPercentage(stats.contractGenerated, stats.totalLoans),
      color: 'purple',
      icon: FileText
    },
    {
      title: 'Contract Uploaded',
      count: stats.contractUploaded,
      percentage: getPercentage(stats.contractUploaded, stats.totalLoans),
      color: 'orange',
      icon: Upload
    },
    {
      title: 'Ready for Disbursement',
      count: stats.readyForDisbursement,
      percentage: getPercentage(stats.readyForDisbursement, stats.totalLoans),
      color: 'yellow',
      icon: DollarSign
    },
    {
      title: 'Disbursed',
      count: stats.disbursed,
      percentage: getPercentage(stats.disbursed, stats.totalLoans),
      color: 'emerald',
      icon: TrendingUp
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      red: 'bg-red-50 border-red-200 text-red-800'
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getIconColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
      emerald: 'text-emerald-600',
      red: 'text-red-600'
    };
    return colorMap[color] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workflow Status Dashboard</h2>
          <p className="text-gray-600">Real-time overview of loan processing pipeline</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Clock className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Loans</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLoans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contracts Generated</p>
              <p className="text-2xl font-bold text-gray-900">{stats.contractGenerated}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disbursed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.disbursed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Workflow Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflowSteps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.title}
                className={`p-4 rounded-lg border-2 ${getColorClasses(step.color)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <IconComponent className={`w-5 h-5 mr-2 ${getIconColor(step.color)}`} />
                    <span className="font-medium">{step.title}</span>
                  </div>
                  <span className="text-sm font-bold">{step.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      step.color === 'blue' ? 'bg-blue-500' :
                      step.color === 'green' ? 'bg-green-500' :
                      step.color === 'purple' ? 'bg-purple-500' :
                      step.color === 'orange' ? 'bg-orange-500' :
                      step.color === 'yellow' ? 'bg-yellow-500' :
                      step.color === 'emerald' ? 'bg-emerald-500' :
                      'bg-gray-500'
                    }`}
                    style={{ width: `${step.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs opacity-75">{step.percentage}% of total loans</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejected Loans Alert */}
      {stats.rejected > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Rejected Loans</h4>
              <p className="text-sm text-red-700">
                {stats.rejected} loan{stats.rejected !== 1 ? 's' : ''} have been rejected and require attention.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowStatusDashboard;




