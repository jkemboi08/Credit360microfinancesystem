import { useState, useCallback } from 'react';
import { TabItem } from '../components/Tabs';

export interface UseTabsOptions {
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const useTabs = (tabs: TabItem[], options: UseTabsOptions = {}) => {
  const { defaultTab, onTabChange } = options;
  
  // Use the first tab as default if no default is specified
  const initialTab = defaultTab || tabs[0]?.id || '';
  
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  }, [onTabChange]);

  const getActiveTabContent = useCallback(() => {
    return tabs.find(tab => tab.id === activeTab)?.content;
  }, [tabs, activeTab]);

  const getActiveTab = useCallback(() => {
    return tabs.find(tab => tab.id === activeTab);
  }, [tabs, activeTab]);

  return {
    activeTab,
    setActiveTab: handleTabChange,
    getActiveTabContent,
    getActiveTab
  };
};












