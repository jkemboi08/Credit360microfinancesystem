// Enhanced Budget Management System
// Comprehensive budget management for managers and business owners

import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { SupabaseExpenseService } from '../services/supabaseExpenseService';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Eye,
  Download,
  Settings,
  Calendar,
  BarChart3,
  Target,
  Users,
  Building,
  FileText,
  X,
  Save,
  Trash2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Types - Updated to match existing budget_items system
interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  budgetPeriodId: string;
  budgetedAmount: number;
  actualAmount: number;
  committedAmount: number;
  availableAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  isOverBudget: boolean;
  lastUpdated: Date;
  updatedBy: string;
}

interface ExpenseCategory {
  id: string;
  category_name: string;
  category_code: string;
  description: string;
  budget_type: string;
}

interface Expenditure {
  id: string;
  budget_id: string;
  category_id: string;
  description: string;
  amount: number;
  expenditure_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  vendor_name?: string;
  invoice_number?: string;
  notes?: string;
}

interface BudgetSummary {
  total_budgeted: number;
  total_actual: number;
  total_variance: number;
  variance_percentage: number;
}

interface MonthlyData {
  month_name: string;
  month_number: number;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
}

interface OverBudgetCategory {
  category_name: string;
  budgeted_amount: number;
  actual_spend: number;
  variance: number;
  variance_percentage: number;
}

// Function to create default categories in the database
const createDefaultCategories = async () => {
  try {
    console.log('Creating default expense categories in database...');
    
    const defaultCategories = [
      {
        category_name: 'Salaries and Benefits',
        category_code: 'OP001',
        category_type: 'operating',
        is_budgetable: true,
        is_active: true,
        description: 'Employee salaries, benefits, and compensation'
      },
      {
        category_name: 'Rent and Utilities',
        category_code: 'OP002',
        category_type: 'operating',
        is_budgetable: true,
        is_active: true,
        description: 'Office rent, utilities, and facility costs'
      },
      {
        category_name: 'Transport and Communication',
        category_code: 'OP003',
        category_type: 'operating',
        is_budgetable: true,
        is_active: true,
        description: 'Transportation and communication expenses'
      },
      {
        category_name: 'Office Supplies',
        category_code: 'OP004',
        category_type: 'operating',
        is_budgetable: true,
        is_active: true,
        description: 'Office supplies and equipment'
      },
      {
        category_name: 'Training and Development',
        category_code: 'OP005',
        category_type: 'operating',
        is_budgetable: true,
        is_active: true,
        description: 'Employee training and development programs'
      }
    ];

    // First, check if any of these categories already exist
    const { data: existingCategories, error: checkError } = await supabase
      .from('expense_categories')
      .select('id, category_name, category_code')
      .in('category_name', defaultCategories.map(cat => cat.category_name));

    if (checkError) {
      console.error('Error checking existing categories:', checkError);
    }

    // Filter out categories that already exist
    const existingNames = existingCategories?.map(cat => cat.category_name) || [];
    const categoriesToCreate = defaultCategories.filter(cat => !existingNames.includes(cat.category_name));

    let createdCategories = existingCategories || [];

    // Only create categories that don't exist
    if (categoriesToCreate.length > 0) {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert(categoriesToCreate)
        .select();

      if (error) {
        console.error('Error creating default categories:', error);
        // Return fallback categories with proper structure
        return defaultCategories.map((cat, index) => ({
          id: `fallback-${index + 1}`,
          ...cat
        }));
      }

      createdCategories = [...(existingCategories || []), ...(data || [])];
    }

    console.log('Successfully created/retrieved default categories:', createdCategories);
    return createdCategories || [];
  } catch (error) {
    console.error('Error in createDefaultCategories:', error);
    // Return fallback categories
    return [
      { id: 'fallback-1', category_name: 'Salaries and Benefits', category_code: 'OP001', category_type: 'operating' },
      { id: 'fallback-2', category_name: 'Rent and Utilities', category_code: 'OP002', category_type: 'operating' },
      { id: 'fallback-3', category_name: 'Transport and Communication', category_code: 'OP003', category_type: 'operating' },
      { id: 'fallback-4', category_name: 'Office Supplies', category_code: 'OP004', category_type: 'operating' },
      { id: 'fallback-5', category_name: 'Training and Development', category_code: 'OP005', category_type: 'operating' }
    ];
  }
};

const BudgetManagement: React.FC = () => {
  const { user } = useSupabaseAuth();
  
  // State management
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<any[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [overBudgetCategories, setOverBudgetCategories] = useState<OverBudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Form states
  const [newBudgetItem, setNewBudgetItem] = useState({
    categoryId: '',
    budgetedAmount: 0
  });

  // Fiscal year management
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(new Date().getFullYear());
  const [availableFiscalYears, setAvailableFiscalYears] = useState<number[]>([]);
  const [showFiscalYearModal, setShowFiscalYearModal] = useState(false);
  const [newFiscalYear, setNewFiscalYear] = useState(new Date().getFullYear());
  
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [varianceExplanation, setVarianceExplanation] = useState('');
  const [proposedAdjustment, setProposedAdjustment] = useState(0);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [editAmount, setEditAmount] = useState(0);

  useEffect(() => {
    loadFiscalYears();
    loadBudgetData();
  }, []);

  // Load available fiscal years
  const loadFiscalYears = async () => {
    try {
      // Generate fiscal years from 2020 to current year + 2
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let year = 2020; year <= currentYear + 2; year++) {
        years.push(year);
      }
      setAvailableFiscalYears(years);
    } catch (error) {
      console.error('Error loading fiscal years:', error);
    }
  };

  // Create new fiscal year
  const createFiscalYear = async () => {
    try {
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Create budget period for the new fiscal year
      const startDate = new Date(newFiscalYear, 0, 1); // January 1st
      const endDate = new Date(newFiscalYear, 11, 31); // December 31st
      
      const { data: newPeriod, error: periodError } = await supabase
        .from('budget_periods')
        .insert({
          name: `${newFiscalYear} Fiscal Year`,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_active: true,
          is_locked: false,
          created_by: user.id
        })
        .select()
        .single();

      if (periodError) {
        console.error('Error creating fiscal year:', periodError);
        alert(`Error creating fiscal year: ${periodError.message}`);
        return;
      }

      console.log('Created fiscal year:', newPeriod);
      setAvailableFiscalYears(prev => [...prev, newFiscalYear].sort());
      setSelectedFiscalYear(newFiscalYear);
      setShowFiscalYearModal(false);
      loadBudgetData(); // Reload data for the new fiscal year
    } catch (error) {
      console.error('Error creating fiscal year:', error);
      alert('Error creating fiscal year');
    }
  };

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Fetch budget items and budget categories from existing system
      let fetchedBudgetItems: any[] = [];
      let fetchedCategories: any[] = [];
      
      try {
        console.log('Starting to fetch budget data...');
        
        // Get budget categories (operating expense categories that are budgetable)
        console.log('Loading budget categories...');
        try {
          fetchedCategories = await SupabaseExpenseService.getBudgetCategories();
          console.log('Budget categories result:', fetchedCategories);
          console.log('Budget categories length:', fetchedCategories.length);
        } catch (categoryError) {
          console.error('Error fetching budget categories:', categoryError);
          // Create default categories in the database
          console.log('Creating default categories in database...');
          fetchedCategories = await createDefaultCategories();
        }
        
        // Test the budget items API call
        console.log('Testing getBudgetItems...');
        try {
          fetchedBudgetItems = await SupabaseExpenseService.getBudgetItems();
          console.log('Budget items result:', fetchedBudgetItems);
          console.log('Budget items length:', fetchedBudgetItems.length);
        } catch (budgetError) {
          console.error('Error fetching budget items:', budgetError);
          fetchedBudgetItems = [];
        }
        
        setBudgetItems(fetchedBudgetItems);
        setBudgetCategories(fetchedCategories);
        
        // Debug: Log the loaded categories
        console.log('Loaded budget categories:', fetchedCategories);
        console.log('Category IDs:', fetchedCategories.map(cat => ({ name: cat.category_name, id: cat.id })));
        
        // If still no categories, create some default budget categories
        if (fetchedCategories.length === 0) {
          console.log('No budget categories found, creating default categories...');
          fetchedCategories = await createDefaultCategories();
        }
      } catch (error) {
        console.error('Error fetching budget data:', error);
        console.error('Error details:', error);
        // Set empty arrays to prevent errors
        setBudgetItems([]);
        setExpenseCategories([]);
      }
      
      if (fetchedBudgetItems.length > 0) {
        // Calculate summary from actual data
        const totalBudgeted = fetchedBudgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0);
        const totalActual = fetchedBudgetItems.reduce((sum, item) => sum + item.actualAmount, 0);
        const totalVariance = totalBudgeted - totalActual;
        const variancePercentage = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;
        
        setSummary({
          total_budgeted: totalBudgeted,
          total_actual: totalActual,
          total_variance: totalVariance,
          variance_percentage: variancePercentage
        });
        
        // Get over-budget categories
        const overBudgetCategories = fetchedBudgetItems
          .filter(item => item.variancePercentage < -5)
          .map(item => ({
            category_name: item.categoryName,
            budgeted_amount: item.budgetedAmount,
            actual_spend: item.actualAmount,
            variance: item.varianceAmount,
            variance_percentage: item.variancePercentage
          }));
        setOverBudgetCategories(overBudgetCategories);
        
        // Generate mock monthly data for now (can be replaced with actual API call)
        const mockMonthlyData: MonthlyData[] = [
          { month_name: 'January', month_number: 1, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 },
          { month_name: 'February', month_number: 2, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 },
          { month_name: 'March', month_number: 3, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 },
          { month_name: 'April', month_number: 4, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 },
          { month_name: 'May', month_number: 5, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 },
          { month_name: 'June', month_number: 6, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 },
          { month_name: 'July', month_number: 7, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 },
          { month_name: 'August', month_number: 8, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 },
          { month_name: 'September', month_number: 9, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 },
          { month_name: 'October', month_number: 10, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 },
          { month_name: 'November', month_number: 11, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 },
          { month_name: 'December', month_number: 12, budgeted_amount: totalBudgeted / 12, actual_amount: totalActual / 12, variance: totalVariance / 12 }
        ];
        setMonthlyData(mockMonthlyData);
      } else {
        // No budget items found, set empty state
        setSummary({
          total_budgeted: 0,
          total_actual: 0,
          total_variance: 0,
          variance_percentage: 0
        });
        setMonthlyData([]);
        setOverBudgetCategories([]);
      }
      
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return TrendingUp;
    if (variance < 0) return TrendingDown;
    return Target;
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreateBudget = async () => {
    try {
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      if (!newBudgetItem.categoryId || newBudgetItem.budgetedAmount <= 0) {
        alert('Please select a category and enter a valid budget amount');
        return;
      }

      // Debug: Log the category ID being used
      console.log('Creating budget item with categoryId:', newBudgetItem.categoryId);
      console.log('Available categories:', budgetCategories);
      
      // Check if the categoryId is a fallback ID
      if (newBudgetItem.categoryId.startsWith('fallback-')) {
        console.error('ERROR: Using fallback category ID:', newBudgetItem.categoryId);
        alert('Error: Invalid category selected. Please refresh the page and try again.');
        return;
      }

      // Create budget item using existing system
      const result = await SupabaseExpenseService.createBudgetItem({
        categoryId: newBudgetItem.categoryId,
        budgetedAmount: newBudgetItem.budgetedAmount,
        actualAmount: 0
      });

      if (!result.success) {
        alert(`Error creating budget item: ${result.error}`);
        return;
      }

      // Reset form
      setNewBudgetItem({
        categoryId: '',
        budgetedAmount: 0
      });

      setShowCreateModal(false);
      // Reload data to get the new budget item and updated categories
      await loadBudgetData();
    } catch (error) {
      console.error('Error creating budget item:', error);
    }
  };

  const handleItemClick = (item: BudgetItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleEditItem = (item: BudgetItem) => {
    setEditingItem(item);
    setEditAmount(item.budgetedAmount);
    setShowEditModal(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this budget item? This action cannot be undone.')) {
      return;
    }

    try {
      // Note: You'll need to add a deleteBudgetItem method to SupabaseExpenseService
      // For now, we'll just reload the data
      loadBudgetData();
    } catch (error) {
      console.error('Error deleting budget item:', error);
    }
  };

  const handleProposeAdjustment = async () => {
    try {
      // API call to propose budget adjustment
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error proposing adjustment:', error);
    }
  };

  // Real-time variance calculation
  const calculateVariance = (budgetedAmount: number, actualSpend: number) => {
    return budgetedAmount - actualSpend;
  };

  const calculateVariancePercentage = (budgetedAmount: number, actualSpend: number) => {
    if (budgetedAmount === 0) return 0;
    return ((budgetedAmount - actualSpend) / budgetedAmount) * 100;
  };

  // Update category budget amount
  const handleEditCategory = (item: BudgetItem) => {
    setEditingItem(item);
    setEditAmount(item.budgetedAmount);
    setShowEditModal(true);
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    try {
      // Update the budget item in Supabase
      const result = await SupabaseExpenseService.updateBudgetItem(editingItem.id, editAmount);

      if (!result.success) {
        alert(`Error updating budget item: ${result.error}`);
        return;
      }

      // Reload data to get updated values
      loadBudgetData();

      setShowEditModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving budget item:', error);
    }
  };

  const handleDeleteCategory = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this budget line item? This action cannot be undone.')) {
      return;
    }

    try {
      // Note: You'll need to add a deleteBudgetItem method to SupabaseExpenseService
      // For now, we'll just reload the data
      loadBudgetData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error deleting budget item:', error);
    }
  };

  // Prepare chart data
  const budgetVsActualsData = monthlyData.map(month => ({
    month: month.month_name,
    budgeted: month.budgeted_amount,
    actual: month.actual_amount,
    variance: month.variance
  }));

  const expenseBreakdownData = budgetItems.map(item => ({
    name: item.categoryName,
    value: item.budgetedAmount,
    actual: item.actualAmount,
    variance: item.varianceAmount
  }));

  // Color palette for pie chart
  const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
    '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
  ];

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">
            Budgeted: {formatCurrency(payload[0]?.value || 0)}
          </p>
          <p className="text-green-600">
            Actual: {formatCurrency(payload[1]?.value || 0)}
          </p>
          <p className="text-gray-600">
            Variance: {formatCurrency((payload[0]?.value || 0) - (payload[1]?.value || 0))}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-blue-600">
            Budgeted: {formatCurrency(data.value)}
          </p>
          <p className="text-green-600">
            Actual: {formatCurrency(data.actual)}
          </p>
          <p className="text-gray-600">
            Variance: {formatCurrency(data.variance)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading budget data...</div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <BarChart3 className="w-6 h-6 mr-2" />
                Annual Business Budget
              </h1>
              <p className="text-indigo-100">Comprehensive budget management and analysis</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Budget Line Item
            </button>
          </div>
        </div>

      {/* Fiscal Year Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Fiscal Year</h2>
            <p className="text-gray-600 text-sm">Select the fiscal year for budget planning</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="fiscal-year" className="text-sm font-medium text-gray-700">
                Current Year:
              </label>
              <select
                id="fiscal-year"
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableFiscalYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowFiscalYearModal(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Fiscal Year
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary Dashboard - Metrics in one row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Annual Budget</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary ? formatCurrency(summary.total_budgeted) : 'TSh 0'}
              </p>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <Target className="w-3 h-3 mr-1" />
                Budget allocation
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Actual Spend (YTD)</p>
              <p className="text-2xl font-bold text-green-600">
                {summary ? formatCurrency(summary.total_actual) : 'TSh 0'}
              </p>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <DollarSign className="w-3 h-3 mr-1" />
                Year to date
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining Budget</p>
              <p className={`text-2xl font-bold ${summary && summary.total_variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary ? formatCurrency(summary.total_variance) : 'TSh 0'}
              </p>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                {summary && summary.total_variance > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Under budget
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Over budget
                  </>
                )}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${summary && summary.total_variance > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {summary && summary.total_variance > 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Variance</p>
              <p className={`text-2xl font-bold ${getVarianceColor(summary?.variance_percentage || 0)}`}>
                {summary ? `${summary.variance_percentage.toFixed(1)}%` : '0%'}
              </p>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                {React.createElement(getVarianceIcon(summary?.variance_percentage || 0), { className: "w-3 h-3 mr-1" })}
                Performance indicator
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${summary && summary.variance_percentage > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {React.createElement(getVarianceIcon(summary?.variance_percentage || 0), { 
                className: `w-6 h-6 ${summary && summary.variance_percentage > 0 ? 'text-green-600' : 'text-red-600'}` 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Charts in one row below metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Actuals</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="budgeted" 
                  name="Budgeted" 
                  fill="#3B82F6" 
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="actual" 
                  name="Actual" 
                  fill="#10B981" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdownData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<PieTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color, fontSize: '12px' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Over-Budget Categories */}
      {overBudgetCategories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-red-600 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Top Over-Budget Categories
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {overBudgetCategories.map((category, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{category.category_name}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(category.budgeted_amount)} budgeted vs {formatCurrency(category.actual_spend)} actual
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                    {category.variance_percentage.toFixed(1)}% over
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Budget Management Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Budget Line Items</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Filter by type</option>
                <option value="operating">Operating</option>
                <option value="capital">Capital</option>
                <option value="financial">Financial</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Filter by status</option>
                <option value="on-budget">On Budget</option>
                <option value="over-budget">Over Budget</option>
                <option value="under-budget">Under Budget</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budgeted Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Spend</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budgetItems
                .filter(item => 
                  item.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleCategoryExpansion(item.id)}
                          className="mr-2 p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedCategories.has(item.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <p className="font-medium text-gray-900">{item.categoryName}</p>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            operating
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(item.budgetedAmount)}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(item.actualAmount)}
                    </td>
                    <td className={`px-4 py-3 ${getVarianceColor(item.varianceAmount)}`}>
                      {formatCurrency(item.varianceAmount)}
                    </td>
                    <td className={`px-4 py-3 ${getVarianceColor(item.variancePercentage)}`}>
                      {item.variancePercentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.variancePercentage > 5 ? 'bg-green-100 text-green-800' :
                        item.variancePercentage < -5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.variancePercentage > 5 ? 'Under Budget' :
                         item.variancePercentage < -5 ? 'Over Budget' : 'On Track'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleItemClick(item)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                          title="Edit item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Budget Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Budget Line Item</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Category</label>
                <select
                  value={newBudgetItem.categoryId}
                  onChange={(e) => setNewBudgetItem({ ...newBudgetItem, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {budgetCategories.length === 0 ? (
                    <option value="" disabled>Loading categories...</option>
                  ) : (
                    budgetCategories
                      .filter(cat => cat.category_type === 'operating')
                      .map(category => (
                        <option key={category.id} value={category.id}>
                          {category.category_name}
                        </option>
                      ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount</label>
                <input
                  type="number"
                  value={newBudgetItem.budgetedAmount}
                  onChange={(e) => setNewBudgetItem({ ...newBudgetItem, budgetedAmount: parseFloat(e.target.value) })}
                  placeholder="Enter budget amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleCreateBudget}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Budget Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Budget Item Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Budget Item</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-lg font-medium text-gray-900">{editingItem.categoryName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Budget Amount</label>
                <p className="text-sm text-gray-600">{formatCurrency(editingItem.budgetedAmount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Amount</label>
                <p className="text-sm text-gray-600">{formatCurrency(editingItem.actualAmount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Budget Amount</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">New Variance:</p>
                <p className={`font-medium ${getVarianceColor(editAmount - editingItem.actualAmount)}`}>
                  {formatCurrency(editAmount - editingItem.actualAmount)} 
                  ({editingItem.actualAmount > 0 ? (((editAmount - editingItem.actualAmount) / editAmount) * 100).toFixed(1) : 0}%)
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Item Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Budget Item Analysis: {selectedItem.categoryName}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Budget Item Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Budgeted</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(selectedItem.budgetedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Actual</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedItem.actualAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Variance</p>
                    <p className={`text-xl font-bold ${getVarianceColor(selectedItem.varianceAmount)}`}>
                      {formatCurrency(selectedItem.varianceAmount)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${selectedItem.variancePercentage < 0 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, (selectedItem.actualAmount / selectedItem.budgetedAmount) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Variance Analysis */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Variance Analysis</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Explanation of Variance</label>
                    <textarea
                      value={varianceExplanation}
                      onChange={(e) => setVarianceExplanation(e.target.value)}
                      placeholder="Explain the reasons for budget variance..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Budget Adjustment</label>
                    <input
                      type="number"
                      value={proposedAdjustment}
                      onChange={(e) => setProposedAdjustment(parseFloat(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleProposeAdjustment}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Propose Budget Adjustment
                  </button>
                </div>
              </div>

              {/* Financial Forecast */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Financial Forecast</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">Forecasting Tool</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Use different assumptions to see how they impact the overall budget.
                    Adjust inflation rates, salary increases, and other factors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fiscal Year Modal */}
      {showFiscalYearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Fiscal Year</h3>
              <button
                onClick={() => setShowFiscalYearModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="new-fiscal-year" className="block text-sm font-medium text-gray-700 mb-2">
                  Fiscal Year
                </label>
                <input
                  type="number"
                  id="new-fiscal-year"
                  value={newFiscalYear}
                  onChange={(e) => setNewFiscalYear(parseInt(e.target.value))}
                  min="2020"
                  max="2030"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowFiscalYearModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createFiscalYear}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Fiscal Year
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default BudgetManagement;