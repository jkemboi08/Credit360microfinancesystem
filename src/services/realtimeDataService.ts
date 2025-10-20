// Real-time Data Sharing Service
// Provides dynamic, real-time data synchronization between all modules using Supabase

import { supabase } from '../lib/supabaseClient';
import { 
  ComprehensiveExpenseSystem, 
  ExpenseCategory, 
  ExpenseFormData,
  PendingExpense 
} from '../types/expense';

// Event types for real-time updates
export type DataUpdateEvent = 
  | 'expense_created'
  | 'expense_updated'
  | 'expense_approved'
  | 'expense_rejected'
  | 'staff_salary_updated'
  | 'staff_benefit_updated'
  | 'bot_report_updated'
  | 'budget_updated'
  | 'category_updated';

// Real-time data update interface
export interface RealtimeDataUpdate {
  eventType: DataUpdateEvent;
  module: 'expense' | 'staff' | 'bot_reports' | 'budget';
  data: any;
  timestamp: Date;
  userId: string;
  affectedModules: string[];
}

// Cross-module data integration interface
export interface CrossModuleData {
  expenseData: {
    totalExpenses: number;
    categories: ExpenseCategory[];
    pendingApprovals: PendingExpense[];
    recentExpenses: ExpenseFormData[];
  };
  staffData: {
    totalStaff: number;
    salaryExpenses: number;
    benefitExpenses: number;
    trainingExpenses: number;
    recentHires: any[];
  };
  botReportData: {
    msp202Data: any;
    msp210Data: any;
    lastSync: Date;
    validationStatus: 'passed' | 'failed' | 'pending';
  };
  budgetData: {
    totalBudget: number;
    spentAmount: number;
    remainingAmount: number;
    variancePercentage: number;
  };
}

export class RealtimeDataService {
  private static instance: RealtimeDataService;
  private eventListeners: Map<DataUpdateEvent, Function[]> = new Map();
  private crossModuleData: CrossModuleData | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private supabaseSubscriptions: any[] = [];

  private constructor() {
    this.initializeRealTimeUpdates();
    this.setupSupabaseSubscriptions();
  }

  public static getInstance(): RealtimeDataService {
    if (!RealtimeDataService.instance) {
      RealtimeDataService.instance = new RealtimeDataService();
    }
    return RealtimeDataService.instance;
  }

  // Initialize real-time update mechanisms
  private initializeRealTimeUpdates(): void {
    // Set up periodic data synchronization
    this.updateInterval = setInterval(() => {
      this.synchronizeCrossModuleData();
    }, 10000); // Update every 10 seconds

    // Initialize cross-module data
    this.synchronizeCrossModuleData();
  }

  // Setup Supabase real-time subscriptions
  private setupSupabaseSubscriptions(): void {
    console.log('🔗 Setting up Supabase real-time subscriptions...');

    // Subscribe to loan_applications changes
    const loanApplicationsSubscription = supabase
      .channel('loan_applications_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'loan_applications'
      }, (payload) => {
        console.log('📊 Loan application change detected:', payload);
        this.emit('expense_updated', payload.new || payload.old, 'system');
      })
      .subscribe();

    // Subscribe to clients changes
    const clientsSubscription = supabase
      .channel('clients_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clients'
      }, (payload) => {
        console.log('👥 Client change detected:', payload);
        this.emit('staff_salary_updated', payload.new || payload.old, 'system');
      })
      .subscribe();

    // Subscribe to employees changes
    const employeesSubscription = supabase
      .channel('employees_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employees'
      }, (payload) => {
        console.log('👨‍💼 Employee change detected:', payload);
        this.emit('staff_salary_updated', payload.new || payload.old, 'system');
      })
      .subscribe();

    // Subscribe to savings_accounts changes
    const savingsSubscription = supabase
      .channel('savings_accounts_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'savings_accounts'
      }, (payload) => {
        console.log('💰 Savings account change detected:', payload);
        this.emit('budget_updated', payload.new || payload.old, 'system');
      })
      .subscribe();

    // Store subscriptions for cleanup
    this.supabaseSubscriptions = [
      loanApplicationsSubscription,
      clientsSubscription,
      employeesSubscription,
      savingsSubscription
    ];

    console.log('✅ Supabase real-time subscriptions established');
  }

  // Subscribe to real-time updates
  public subscribe(eventType: DataUpdateEvent, callback: Function): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    this.eventListeners.get(eventType)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Emit real-time updates
  public emit(eventType: DataUpdateEvent, data: any, userId: string = 'system'): void {
    const update: RealtimeDataUpdate = {
      eventType,
      module: this.getModuleFromEvent(eventType),
      data,
      timestamp: new Date(),
      userId,
      affectedModules: this.getAffectedModules(eventType)
    };

    // Notify all subscribers
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in real-time update callback:', error);
      }
    });

    // Update cross-module data
    this.updateCrossModuleData(update);
  }

  // Get current cross-module data
  public getCrossModuleData(): CrossModuleData | null {
    return this.crossModuleData;
  }

  // Force synchronization of all modules
  public forceSynchronization(): void {
    this.synchronizeCrossModuleData();
  }

  // Private method to synchronize cross-module data
  private async synchronizeCrossModuleData(): Promise<void> {
    try {
      // Fetch data from all modules
      const [expenseData, staffData, botReportData, budgetData] = await Promise.all([
        this.fetchExpenseData(),
        this.fetchStaffData(),
        this.fetchBOTReportData(),
        this.fetchBudgetData()
      ]);

      this.crossModuleData = {
        expenseData,
        staffData,
        botReportData,
        budgetData
      };

      // Emit synchronization event
      this.emit('bot_report_updated', this.crossModuleData, 'system');
    } catch (error) {
      console.error('Error synchronizing cross-module data:', error);
    }
  }

  // Fetch expense data from Supabase
  private async fetchExpenseData(): Promise<any> {
    try {
      // Get loan applications as expense data
      const { data: loanApplications, error: loanError } = await supabase
        .from('loan_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (loanError) {
        console.error('Error fetching loan applications:', loanError);
        return { totalExpenses: 0, categories: [], pendingApprovals: [], recentExpenses: [] };
      }

      const totalExpenses = loanApplications?.reduce((sum, app) => sum + (app.requested_amount || 0), 0) || 0;
      const pendingApprovals = loanApplications?.filter(app => app.status === 'pending') || [];

      return {
        totalExpenses,
        categories: [],
        pendingApprovals,
        recentExpenses: loanApplications || []
      };
    } catch (error) {
      console.error('Error fetching expense data:', error);
      return { totalExpenses: 0, categories: [], pendingApprovals: [], recentExpenses: [] };
    }
  }

  // Fetch staff data from Supabase
  private async fetchStaffData(): Promise<any> {
    try {
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'active');

      if (employeeError) {
        console.error('Error fetching employees:', employeeError);
        return { totalStaff: 0, salaryExpenses: 0, benefitExpenses: 0, trainingExpenses: 0, recentHires: [] };
      }

      const totalStaff = employees?.length || 0;
      const salaryExpenses = employees?.reduce((sum, emp) => sum + (emp.gross_salary || 0), 0) || 0;
      const benefitExpenses = employees?.reduce((sum, emp) => sum + (emp.allowances || 0), 0) || 0;

      return {
        totalStaff,
        salaryExpenses,
        benefitExpenses,
        trainingExpenses: 0,
        recentHires: employees?.slice(0, 5) || []
      };
    } catch (error) {
      console.error('Error fetching staff data:', error);
      return { totalStaff: 0, salaryExpenses: 0, benefitExpenses: 0, trainingExpenses: 0, recentHires: [] };
    }
  }

  // Fetch BOT report data from Supabase
  private async fetchBOTReportData(): Promise<any> {
    try {
      // Get loan applications for BOT reporting
      const { data: loanApplications, error: loanError } = await supabase
        .from('loan_applications')
        .select('*');

      if (loanError) {
        console.error('Error fetching loan applications for BOT reports:', loanError);
        return {
          msp202Data: { interestExpenses: 0, operatingExpenses: 0, taxExpenses: 0 },
          msp210Data: { regionalExpenses: {}, branchExpenses: {} },
          lastSync: new Date(),
          validationStatus: 'failed' as const
        };
      }

      const totalLoanAmount = loanApplications?.reduce((sum, app) => sum + (app.requested_amount || 0), 0) || 0;

      return {
        msp202Data: {
          interestExpenses: totalLoanAmount * 0.15, // 15% interest
          operatingExpenses: totalLoanAmount * 0.05, // 5% operating
          taxExpenses: totalLoanAmount * 0.02 // 2% tax
        },
        msp210Data: {
          regionalExpenses: {},
          branchExpenses: {}
        },
        lastSync: new Date(),
        validationStatus: 'passed' as const
      };
    } catch (error) {
      console.error('Error fetching BOT report data:', error);
      return {
        msp202Data: { interestExpenses: 0, operatingExpenses: 0, taxExpenses: 0 },
        msp210Data: { regionalExpenses: {}, branchExpenses: {} },
        lastSync: new Date(),
        validationStatus: 'failed' as const
      };
    }
  }

  // Fetch budget data from Supabase
  private async fetchBudgetData(): Promise<any> {
    try {
      // Get savings accounts for budget data
      const { data: savingsAccounts, error: savingsError } = await supabase
        .from('savings_accounts')
        .select('*');

      if (savingsError) {
        console.error('Error fetching savings accounts:', savingsError);
        return { totalBudget: 0, spentAmount: 0, remainingAmount: 0, variancePercentage: 0 };
      }

      const totalBudget = 10000000; // Base budget
      const spentAmount = savingsAccounts?.reduce((sum, account) => sum + (account.current_balance || 0), 0) || 0;
      const remainingAmount = totalBudget - spentAmount;
      const variancePercentage = ((spentAmount - totalBudget) / totalBudget) * 100;

      return {
        totalBudget,
        spentAmount,
        remainingAmount,
        variancePercentage
      };
    } catch (error) {
      console.error('Error fetching budget data:', error);
      return { totalBudget: 0, spentAmount: 0, remainingAmount: 0, variancePercentage: 0 };
    }
  }

  // Update cross-module data based on events
  private updateCrossModuleData(update: RealtimeDataUpdate): void {
    if (!this.crossModuleData) return;

    switch (update.eventType) {
      case 'expense_created':
      case 'expense_updated':
        this.updateExpenseData(update);
        break;
      case 'staff_salary_updated':
      case 'staff_benefit_updated':
        this.updateStaffData(update);
        break;
      case 'bot_report_updated':
        this.updateBOTReportData(update);
        break;
      case 'budget_updated':
        this.updateBudgetData(update);
        break;
    }
  }

  // Update expense data
  private updateExpenseData(update: RealtimeDataUpdate): void {
    if (!this.crossModuleData) return;

    // Update expense totals
    if (update.data.amount) {
      this.crossModuleData.expenseData.totalExpenses += update.data.amount;
    }

    // Update categories
    if (update.data.category) {
      // Find and update category
      const categoryIndex = this.crossModuleData.expenseData.categories.findIndex(
        cat => cat.categoryCode === update.data.category
      );
      if (categoryIndex > -1) {
        this.crossModuleData.expenseData.categories[categoryIndex].actualAmount += update.data.amount;
      }
    }

    // Add to recent expenses
    this.crossModuleData.expenseData.recentExpenses.unshift(update.data);
    if (this.crossModuleData.expenseData.recentExpenses.length > 10) {
      this.crossModuleData.expenseData.recentExpenses.pop();
    }
  }

  // Update staff data
  private updateStaffData(update: RealtimeDataUpdate): void {
    if (!this.crossModuleData) return;

    switch (update.eventType) {
      case 'staff_salary_updated':
        this.crossModuleData.staffData.salaryExpenses += update.data.amount || 0;
        break;
      case 'staff_benefit_updated':
        this.crossModuleData.staffData.benefitExpenses += update.data.amount || 0;
        break;
    }
  }

  // Update BOT report data
  private updateBOTReportData(update: RealtimeDataUpdate): void {
    if (!this.crossModuleData) return;

    // Update BOT report data based on expense changes
    if (update.data.category && update.data.amount) {
      const categoryCode = update.data.category;
      
      if (categoryCode.startsWith('INT')) {
        this.crossModuleData.botReportData.msp202Data.interestExpenses += update.data.amount;
      } else if (categoryCode.startsWith('OP')) {
        this.crossModuleData.botReportData.msp202Data.operatingExpenses += update.data.amount;
      } else if (categoryCode.startsWith('TAX')) {
        this.crossModuleData.botReportData.msp202Data.taxExpenses += update.data.amount;
      }
    }

    this.crossModuleData.botReportData.lastSync = new Date();
  }

  // Update budget data
  private updateBudgetData(update: RealtimeDataUpdate): void {
    if (!this.crossModuleData) return;

    if (update.data.amount) {
      this.crossModuleData.budgetData.spentAmount += update.data.amount;
      this.crossModuleData.budgetData.remainingAmount -= update.data.amount;
      
      // Recalculate variance
      const variance = this.crossModuleData.budgetData.spentAmount - this.crossModuleData.budgetData.totalBudget;
      this.crossModuleData.budgetData.variancePercentage = (variance / this.crossModuleData.budgetData.totalBudget) * 100;
    }
  }

  // Get module from event type
  private getModuleFromEvent(eventType: DataUpdateEvent): 'expense' | 'staff' | 'bot_reports' | 'budget' {
    if (eventType.startsWith('expense_')) return 'expense';
    if (eventType.startsWith('staff_')) return 'staff';
    if (eventType.startsWith('bot_')) return 'bot_reports';
    return 'budget';
  }

  // Get affected modules for an event
  private getAffectedModules(eventType: DataUpdateEvent): string[] {
    const affectedModules = ['expense']; // Expense module is always affected

    switch (eventType) {
      case 'expense_created':
      case 'expense_updated':
      case 'expense_approved':
        affectedModules.push('bot_reports', 'budget');
        break;
      case 'staff_salary_updated':
      case 'staff_benefit_updated':
        affectedModules.push('expense', 'bot_reports', 'budget');
        break;
      case 'bot_report_updated':
        affectedModules.push('expense', 'staff');
        break;
      case 'budget_updated':
        affectedModules.push('expense', 'staff');
        break;
    }

    return affectedModules;
  }

  // Cleanup method
  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Unsubscribe from Supabase real-time subscriptions
    this.supabaseSubscriptions.forEach(subscription => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    });
    
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const realtimeDataService = RealtimeDataService.getInstance();




























