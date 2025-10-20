/**
 * Loan Closure Monitoring Service
 * Monitors data health and provides alerts for loan closure management
 */

import { LoanClosureData } from './loanClosureDataService';
import LoanClosureValidationService from './loanClosureValidationService';

export interface MonitoringAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  loanId?: string;
  resolved: boolean;
}

export interface DataHealthReport {
  totalLoans: number;
  healthyLoans: number;
  problematicLoans: number;
  alerts: MonitoringAlert[];
  lastChecked: Date;
  overallHealth: 'healthy' | 'degraded' | 'critical';
}

class LoanClosureMonitoringService {
  private static instance: LoanClosureMonitoringService;
  private alerts: MonitoringAlert[] = [];
  private healthHistory: DataHealthReport[] = [];

  static getInstance(): LoanClosureMonitoringService {
    if (!LoanClosureMonitoringService.instance) {
      LoanClosureMonitoringService.instance = new LoanClosureMonitoringService();
    }
    return LoanClosureMonitoringService.instance;
  }

  /**
   * Monitor loan closure data health
   */
  async monitorDataHealth(loans: LoanClosureData[]): Promise<DataHealthReport> {
    console.log('🔍 LoanClosureMonitoringService - Monitoring data health...');

    const validation = LoanClosureValidationService.validateLoanArray(loans);
    const alerts: MonitoringAlert[] = [];

    // Process validation errors as critical alerts
    validation.errors.forEach((error, index) => {
      alerts.push({
        id: `error-${Date.now()}-${index}`,
        type: 'error',
        message: error,
        timestamp: new Date(),
        resolved: false
      });
    });

    // Process validation warnings as warning alerts
    validation.warnings.forEach((warning, index) => {
      alerts.push({
        id: `warning-${Date.now()}-${index}`,
        type: 'warning',
        message: warning,
        timestamp: new Date(),
        resolved: false
      });
    });

    // Check for data consistency issues
    const consistencyAlerts = this.checkDataConsistency(loans);
    alerts.push(...consistencyAlerts);

    // Check for performance issues
    const performanceAlerts = this.checkPerformanceIssues(loans);
    alerts.push(...performanceAlerts);

    // Update alerts list
    this.alerts = [...this.alerts, ...alerts].slice(-100); // Keep last 100 alerts

    const healthyLoans = loans.filter(loan => {
      const loanValidation = LoanClosureValidationService.validateLoanData(loan);
      return loanValidation.isValid && loanValidation.warnings.length === 0;
    }).length;

    const problematicLoans = loans.length - healthyLoans;

    const overallHealth = this.determineOverallHealth(loans.length, healthyLoans, alerts);

    const report: DataHealthReport = {
      totalLoans: loans.length,
      healthyLoans,
      problematicLoans,
      alerts: alerts.filter(alert => !alert.resolved),
      lastChecked: new Date(),
      overallHealth
    };

    this.healthHistory.push(report);
    if (this.healthHistory.length > 50) {
      this.healthHistory = this.healthHistory.slice(-50); // Keep last 50 reports
    }

    console.log('📊 Data health report:', report);
    return report;
  }

  /**
   * Check for data consistency issues
   */
  private checkDataConsistency(loans: LoanClosureData[]): MonitoringAlert[] {
    const alerts: MonitoringAlert[] = [];

    // Check for duplicate loan IDs
    const loanIds = loans.map(l => l.id);
    const duplicateIds = loanIds.filter((id, index) => loanIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      alerts.push({
        id: `consistency-${Date.now()}`,
        type: 'error',
        message: `Duplicate loan IDs found: ${duplicateIds.join(', ')}`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check for loans with same client but different client IDs
    const clientGroups = loans.reduce((acc, loan) => {
      if (!acc[loan.clientName]) {
        acc[loan.clientName] = [];
      }
      acc[loan.clientName].push(loan);
      return acc;
    }, {} as Record<string, LoanClosureData[]>);

    Object.entries(clientGroups).forEach(([clientName, clientLoans]) => {
      const uniqueClientIds = new Set(clientLoans.map(l => l.clientId));
      if (uniqueClientIds.size > 1) {
        alerts.push({
          id: `consistency-${Date.now()}`,
          type: 'warning',
          message: `Client "${clientName}" has multiple client IDs: ${Array.from(uniqueClientIds).join(', ')}`,
          timestamp: new Date(),
          resolved: false
        });
      }
    });

    return alerts;
  }

  /**
   * Check for performance issues
   */
  private checkPerformanceIssues(loans: LoanClosureData[]): MonitoringAlert[] {
    const alerts: MonitoringAlert[] = [];

    // Check for unusually large datasets
    if (loans.length > 1000) {
      alerts.push({
        id: `performance-${Date.now()}`,
        type: 'warning',
        message: `Large dataset detected: ${loans.length} loans. Consider implementing pagination.`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check for loans with missing critical data
    const loansWithMissingData = loans.filter(loan => 
      !loan.clientName || 
      !loan.originalAmount || 
      loan.status === 'active' && !loan.nextPaymentDate
    );

    if (loansWithMissingData.length > 0) {
      alerts.push({
        id: `performance-${Date.now()}`,
        type: 'warning',
        message: `${loansWithMissingData.length} loans have missing critical data`,
        timestamp: new Date(),
        resolved: false
      });
    }

    return alerts;
  }

  /**
   * Determine overall health status
   */
  private determineOverallHealth(
    totalLoans: number, 
    healthyLoans: number, 
    alerts: MonitoringAlert[]
  ): 'healthy' | 'degraded' | 'critical' {
    const errorAlerts = alerts.filter(a => a.type === 'error' && !a.resolved);
    const warningAlerts = alerts.filter(a => a.type === 'warning' && !a.resolved);
    
    const healthPercentage = totalLoans > 0 ? (healthyLoans / totalLoans) * 100 : 100;

    if (errorAlerts.length > 0 || healthPercentage < 50) {
      return 'critical';
    } else if (warningAlerts.length > 5 || healthPercentage < 80) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get current alerts
   */
  getAlerts(): MonitoringAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Alert resolved: ${alertId}`);
    }
  }

  /**
   * Get health history
   */
  getHealthHistory(): DataHealthReport[] {
    return [...this.healthHistory];
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
    console.log(`🗑️ Cleared alerts older than ${olderThanHours} hours`);
  }

  /**
   * Get monitoring summary
   */
  getMonitoringSummary(): {
    totalAlerts: number;
    unresolvedAlerts: number;
    healthTrend: 'improving' | 'stable' | 'declining';
    lastHealthCheck: Date | null;
  } {
    const unresolvedAlerts = this.alerts.filter(a => !a.resolved).length;
    const recentReports = this.healthHistory.slice(-5);
    
    let healthTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentReports.length >= 2) {
      const latest = recentReports[recentReports.length - 1];
      const previous = recentReports[recentReports.length - 2];
      
      if (latest.healthyLoans > previous.healthyLoans) {
        healthTrend = 'improving';
      } else if (latest.healthyLoans < previous.healthyLoans) {
        healthTrend = 'declining';
      }
    }

    return {
      totalAlerts: this.alerts.length,
      unresolvedAlerts,
      healthTrend,
      lastHealthCheck: this.healthHistory.length > 0 ? 
        this.healthHistory[this.healthHistory.length - 1].lastChecked : null
    };
  }
}

export default LoanClosureMonitoringService;




