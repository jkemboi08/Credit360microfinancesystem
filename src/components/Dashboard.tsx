import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface DashboardMetric {
  id: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

export interface DashboardProps {
  title: string;
  subtitle?: string;
  metrics: DashboardMetric[];
  children?: React.ReactNode;
  className?: string;
  gradient?: 'blue' | 'green' | 'purple' | 'red' | 'indigo';
}

const Dashboard: React.FC<DashboardProps> = ({
  title,
  subtitle,
  metrics,
  children,
  className = '',
  gradient = 'blue'
}) => {
  const getGradientClasses = () => {
    const gradients = {
      blue: 'from-blue-600 to-indigo-600',
      green: 'from-green-600 to-emerald-600',
      purple: 'from-purple-600 to-violet-600',
      red: 'from-red-600 to-orange-600',
      indigo: 'from-indigo-600 to-purple-600'
    };
    return gradients[gradient];
  };

  const getMetricColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      red: 'text-red-600 bg-red-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      purple: 'text-purple-600 bg-purple-100',
      gray: 'text-gray-600 bg-gray-100'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${getGradientClasses()} rounded-xl p-6 text-white`}>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {subtitle && <p className="text-opacity-90">{subtitle}</p>}
      </div>

      {/* Metrics Grid */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {typeof metric.value === 'number' 
                        ? metric.value.toLocaleString() 
                        : metric.value
                      }
                    </p>
                    {metric.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
                    )}
                    {metric.trend && (
                      <div className="flex items-center mt-2">
                        <span className={`text-xs font-medium ${
                          metric.trend.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {metric.trend.isPositive ? '+' : ''}{metric.trend.value}%
                        </span>
                        <span className="text-xs text-gray-500 ml-1">vs last period</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-full ${getMetricColorClasses(metric.color)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Additional Content */}
      {children}
    </div>
  );
};

export default Dashboard;












