import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  content?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  color?: 'blue' | 'green' | 'purple' | 'red' | 'gray';
  className?: string;
  showContent?: boolean;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  color = 'blue',
  className = '',
  showContent = true
}) => {
  const getColorClasses = (isActive: boolean) => {
    const colorMap = {
      blue: {
        active: 'border-blue-500 text-blue-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        pill: isActive 
          ? 'bg-blue-100 text-blue-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      },
      green: {
        active: 'border-green-500 text-green-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        pill: isActive 
          ? 'bg-green-100 text-green-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      },
      purple: {
        active: 'border-purple-500 text-purple-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        pill: isActive 
          ? 'bg-purple-100 text-purple-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      },
      red: {
        active: 'border-red-500 text-red-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        pill: isActive 
          ? 'bg-red-100 text-red-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      },
      gray: {
        active: 'border-gray-500 text-gray-600',
        inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        pill: isActive 
          ? 'bg-gray-100 text-gray-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }
    };

    return colorMap[color];
  };

  const renderUnderlineTabs = () => (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8 px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const colorClasses = getColorClasses(isActive);
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive ? colorClasses.active : colorClasses.inactive
              }`}
            >
              {Icon && <Icon className="w-4 h-4 mr-2" />}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );

  const renderPillTabs = () => (
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const colorClasses = getColorClasses(isActive);
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${colorClasses.pill}`}
            >
              {Icon && <Icon className="w-4 h-4 mr-2" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDefaultTabs = () => (
    <div className="p-6 border-b border-gray-200">
      <div className="flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const colorClasses = getColorClasses(isActive);
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? colorClasses.pill : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {Icon && <Icon className="w-4 h-4 mr-2 inline" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (!showContent) return null;
    
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (!activeTabData?.content) return null;

    return (
      <div className="p-6">
        {activeTabData.content}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {variant === 'underline' && renderUnderlineTabs()}
      {variant === 'pills' && renderPillTabs()}
      {variant === 'default' && renderDefaultTabs()}
      {renderTabContent()}
    </div>
  );
};

export default Tabs;












