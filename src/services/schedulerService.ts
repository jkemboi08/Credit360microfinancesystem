import { aiNotificationService } from './aiNotificationService';

export interface SchedulerConfig {
  enabled: boolean;
  reminderCheckInterval: number; // minutes
  escalationCheckInterval: number; // minutes
  maxRetries: number;
  retryDelay: number; // minutes
}

export interface ScheduledTask {
  id: string;
  name: string;
  interval: number;
  lastRun: Date | null;
  nextRun: Date;
  enabled: boolean;
  retryCount: number;
  maxRetries: number;
}

class SchedulerService {
  private config: SchedulerConfig;
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor(config: SchedulerConfig) {
    this.config = config;
    this.initializeTasks();
  }

  // Initialize default tasks
  private initializeTasks() {
    this.addTask({
      id: 'reminder_check',
      name: 'Payment Reminder Check',
      interval: this.config.reminderCheckInterval,
      lastRun: null,
      nextRun: new Date(Date.now() + this.config.reminderCheckInterval * 60 * 1000),
      enabled: true,
      retryCount: 0,
      maxRetries: this.config.maxRetries
    });

    this.addTask({
      id: 'escalation_check',
      name: 'Overdue Payment Escalation Check',
      interval: this.config.escalationCheckInterval,
      lastRun: null,
      nextRun: new Date(Date.now() + this.config.escalationCheckInterval * 60 * 1000),
      enabled: true,
      retryCount: 0,
      maxRetries: this.config.maxRetries
    });
  }

  // Add a new scheduled task
  addTask(task: ScheduledTask) {
    this.tasks.set(task.id, task);
    this.scheduleTask(task);
  }

  // Remove a scheduled task
  removeTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      const interval = this.intervals.get(taskId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(taskId);
      }
      this.tasks.delete(taskId);
    }
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting AI Notification Scheduler...');

    // Schedule all tasks
    this.tasks.forEach((task) => {
      this.scheduleTask(task);
    });

    console.log(`Scheduler started with ${this.tasks.size} tasks`);
  }

  // Stop the scheduler
  stop() {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    this.isRunning = false;
    
    // Clear all intervals
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();

    console.log('Scheduler stopped');
  }

  // Schedule a specific task
  private scheduleTask(task: ScheduledTask) {
    if (!task.enabled) return;

    const interval = setInterval(async () => {
      try {
        await this.executeTask(task);
      } catch (error) {
        console.error(`Error executing task ${task.name}:`, error);
        await this.handleTaskError(task, error);
      }
    }, task.interval * 60 * 1000);

    this.intervals.set(task.id, interval);
  }

  // Execute a specific task
  private async executeTask(task: ScheduledTask) {
    console.log(`Executing task: ${task.name}`);
    
    const startTime = new Date();
    task.lastRun = startTime;
    task.nextRun = new Date(startTime.getTime() + task.interval * 60 * 1000);

    try {
      switch (task.id) {
        case 'reminder_check':
          await this.runReminderCheck();
          break;
        case 'escalation_check':
          await this.runEscalationCheck();
          break;
        default:
          console.log(`Unknown task: ${task.id}`);
      }

      // Reset retry count on successful execution
      task.retryCount = 0;
      console.log(`Task ${task.name} completed successfully`);
    } catch (error) {
      throw error;
    }
  }

  // Run reminder check task
  private async runReminderCheck() {
    console.log('Running AI notification system for reminders...');
    
    const result = await aiNotificationService.runNotificationSystem();
    
    if (result.success) {
      console.log(`Reminder check completed: ${result.notificationsSent} notifications sent, ${result.escalated} escalated`);
    } else {
      console.error('Reminder check failed:', result.errors);
      throw new Error(`Reminder check failed: ${result.errors.join(', ')}`);
    }
  }

  // Run escalation check task
  private async runEscalationCheck() {
    console.log('Running AI notification system for escalations...');
    
    // This could be a separate method for escalation-only checks
    // For now, we'll use the same method but could be optimized
    const result = await aiNotificationService.runNotificationSystem();
    
    if (result.success) {
      console.log(`Escalation check completed: ${result.notificationsSent} notifications sent, ${result.escalated} escalated`);
    } else {
      console.error('Escalation check failed:', result.errors);
      throw new Error(`Escalation check failed: ${result.errors.join(', ')}`);
    }
  }

  // Handle task execution errors
  private async handleTaskError(task: ScheduledTask, error: any) {
    task.retryCount++;
    
    console.error(`Task ${task.name} failed (attempt ${task.retryCount}/${task.maxRetries}):`, error);

    if (task.retryCount >= task.maxRetries) {
      console.error(`Task ${task.name} exceeded maximum retries, disabling task`);
      task.enabled = false;
      
      // Clear the interval for this task
      const interval = this.intervals.get(task.id);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(task.id);
      }
    } else {
      // Schedule retry after delay
      console.log(`Scheduling retry for task ${task.name} in ${this.config.retryDelay} minutes`);
      setTimeout(() => {
        if (task.enabled) {
          this.scheduleTask(task);
        }
      }, this.config.retryDelay * 60 * 1000);
    }
  }

  // Get task status
  getTaskStatus(taskId: string): ScheduledTask | null {
    return this.tasks.get(taskId) || null;
  }

  // Get all tasks status
  getAllTasksStatus(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  // Update task configuration
  updateTask(taskId: string, updates: Partial<ScheduledTask>) {
    const task = this.tasks.get(taskId);
    if (task) {
      const updatedTask = { ...task, ...updates };
      this.tasks.set(taskId, updatedTask);
      
      // Reschedule if interval changed
      if (updates.interval !== undefined) {
        const interval = this.intervals.get(taskId);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(taskId);
        }
        this.scheduleTask(updatedTask);
      }
    }
  }

  // Update scheduler configuration
  updateConfig(newConfig: Partial<SchedulerConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart scheduler if running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      taskCount: this.tasks.size,
      config: this.config,
      tasks: this.getAllTasksStatus()
    };
  }

  // Manual trigger for testing
  async triggerTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      console.log(`Manually triggering task: ${task.name}`);
      await this.executeTask(task);
    } else {
      console.error(`Task not found: ${taskId}`);
    }
  }

  // Get next run times for all tasks
  getNextRuns() {
    const nextRuns: { [taskId: string]: Date } = {};
    this.tasks.forEach((task, taskId) => {
      nextRuns[taskId] = task.nextRun;
    });
    return nextRuns;
  }
}

// Create default scheduler instance
const defaultConfig: SchedulerConfig = {
  enabled: true,
  reminderCheckInterval: 60, // Check every hour
  escalationCheckInterval: 120, // Check every 2 hours
  maxRetries: 3,
  retryDelay: 30 // 30 minutes between retries
};

export const schedulerService = new SchedulerService(defaultConfig);

// Auto-start scheduler in development
if (process.env.NODE_ENV === 'development') {
  // Start scheduler after a short delay to allow app to initialize
  setTimeout(() => {
    schedulerService.start();
  }, 5000);
}

export { SchedulerService };























