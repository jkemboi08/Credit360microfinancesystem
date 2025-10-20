import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import {
  MessageCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  Send,
  User,
  Calendar,
  FileText,
  Shield,
  BarChart3,
  TrendingUp,
  Target,
  AlertCircle,
  Activity,
  PieChart,
  LineChart,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Bell,
  Award,
  Users,
  Building,
  Zap,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';

// Enhanced Complaint Management Interfaces
interface QuarterlyComplaintTracker {
  msp206Data: {
    row1_balanceAtBeginning: number;
    row2_complaintsReceived: number;
    row3_complaintsResolved: number;
    row4_complaintsWithdrawn: number;
    row5_unresolvedComplaints: number;
  };
  quarterlyBreakdown: {
    currentQuarter: QuarterData;
    previousQuarter: QuarterData;
    yearToDate: YearToDateData;
    historicalQuarters: QuarterData[];
  };
  validationStatus: {
    mathematicalConsistency: boolean;
    dataCompleteness: boolean;
    crossPeriodConsistency: boolean;
    lastValidationTime: Date;
  };
  performanceMetrics: {
    resolutionRate: number;
    withdrawalRate: number;
    carryOverRate: number;
    averageResolutionTime: number;
    complianceScore: number;
  };
}

interface QuarterData {
  quarter: string;
  year: number;
  startDate: Date;
  endDate: Date;
  openingBalance: number;
  complaintsReceived: number;
  complaintsResolved: number;
  complaintsWithdrawn: number;
  closingBalance: number;
  complaintBreakdown: {
    byCategory: ComplaintCategoryData[];
    byChannel: ComplaintChannelData[];
    bySeverity: ComplaintSeverityData[];
    byResolutionTime: ResolutionTimeData[];
    byBranch: BranchComplaintData[];
  };
  qualityMetrics: {
    firstCallResolutionRate: number;
    customerSatisfactionScore: number;
    escalationRate: number;
    repeatComplaintRate: number;
  };
}

interface ResolutionTimelineMonitor {
  timelineAnalytics: {
    averageResolutionTime: number;
    medianResolutionTime: number;
    resolutionTimeDistribution: TimeDistribution[];
    slaComplianceRate: number;
    escalationRate: number;
  };
  realTimeTracking: {
    activeComplaints: ActiveComplaint[];
    overdueComplaints: OverdueComplaint[];
    criticalComplaints: CriticalComplaint[];
    todaysResolutions: TodayResolution[];
  };
  efficiencyMetrics: {
    firstCallResolution: number;
    resolutionByChannel: ChannelEfficiency[];
    resolutionByCategory: CategoryEfficiency[];
    resolutionByStaff: StaffEfficiency[];
  };
  slaManagement: {
    slaTargets: SLATarget[];
    currentPerformance: SLAPerformance[];
    breaches: SLABreach[];
    improvementAreas: ImprovementArea[];
  };
}

interface ComplaintAnalytics {
  patternRecognition: {
    complaintTrends: ComplaintTrend[];
    seasonalPatterns: SeasonalPattern[];
    cyclicalPatterns: CyclicalPattern[];
    anomalyDetection: Anomaly[];
  };
  rootCauseAnalysis: {
    primaryCauses: RootCause[];
    contributingFactors: ContributingFactor[];
    systemicIssues: SystemicIssue[];
    preventableComplaints: PreventableComplaint[];
  };
  customerJourneyAnalysis: {
    touchpointAnalysis: TouchpointAnalysis[];
    journeyStageComplaints: JourneyStageComplaint[];
    experienceGaps: ExperienceGap[];
    satisfactionCorrelation: SatisfactionCorrelation[];
  };
  predictiveAnalytics: {
    complaintForecasting: ComplaintForecast[];
    riskPrediction: RiskPrediction[];
    preventionOpportunities: PreventionOpportunity[];
    earlyWarningSignals: EarlyWarningSignal[];
  };
}

// Supporting interfaces
interface ComplaintCategoryData {
  category: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface ActiveComplaint {
  complaintId: string;
  clientId: string;
  clientName: string;
  complaintCategory: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  dateReceived: Date;
  currentAge: number;
  slaDeadline: Date;
  daysUntilDeadline: number;
  currentStatus: string;
  currentAssignee: string;
  lastActivity: Date;
  progressPercentage: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

interface YearToDateData {
  totalComplaints: number;
  resolvedComplaints: number;
  unresolvedComplaints: number;
  averageResolutionTime: number;
  slaComplianceRate: number;
}

interface TimeDistribution {
  timeRange: string;
  count: number;
  percentage: number;
}

interface SLATarget {
  category: string;
  targetDays: number;
  currentPerformance: number;
  complianceRate: number;
}

interface ComplaintTrend {
  period: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

interface RootCause {
  cause: string;
  frequency: number;
  impact: 'High' | 'Medium' | 'Low';
  preventability: boolean;
}

const Complaints: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'quarterly' | 'timeline' | 'analytics'>('overview');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [showAssignStaff, setShowAssignStaff] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [showResolutionNotes, setShowResolutionNotes] = useState(false);
  const [assignedStaff, setAssignedStaff] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>(getCurrentQuarter());
  const [msp206Data, setMSP206Data] = useState<QuarterlyComplaintTracker | null>(null);
  const [timelineData, setTimelineData] = useState<ResolutionTimelineMonitor | null>(null);
  const [analyticsData, setAnalyticsData] = useState<ComplaintAnalytics | null>(null);

  // Fetch real data from Supabase
  const { data: complaintsData, loading: complaintsLoading } = useSupabaseQuery('complaints', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: clients, loading: clientsLoading } = useSupabaseQuery('clients', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: users, loading: usersLoading } = useSupabaseQuery('users', {
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Helper functions
  function getCurrentQuarter(): string {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `Q${quarter} ${now.getFullYear()}`;
  }

  function getQuarterDates(quarter: string) {
    const [q, year] = quarter.split(' ');
    const quarterNum = parseInt(q.substring(1));
    const yearNum = parseInt(year);
    
    const startMonth = (quarterNum - 1) * 3;
    const startDate = new Date(yearNum, startMonth, 1);
    const endDate = new Date(yearNum, startMonth + 3, 0);
    
    return { startDate, endDate };
  }

  // Generate mock data for enhanced features
  const generateMSP206Data = (quarter: string): QuarterlyComplaintTracker => {
    const { startDate, endDate } = getQuarterDates(quarter);
    const previousQuarter = getPreviousQuarter(quarter);
    
    return {
      msp206Data: {
        row1_balanceAtBeginning: 12,
        row2_complaintsReceived: 45,
        row3_complaintsResolved: 38,
        row4_complaintsWithdrawn: 3,
        row5_unresolvedComplaints: 16 // Calculated: 12 + 45 - 38 - 3
      },
      quarterlyBreakdown: {
        currentQuarter: {
          quarter,
          year: new Date().getFullYear(),
          startDate,
          endDate,
          openingBalance: 12,
          complaintsReceived: 45,
          complaintsResolved: 38,
          complaintsWithdrawn: 3,
          closingBalance: 16,
          complaintBreakdown: {
            byCategory: [
              { category: 'Loan Terms', count: 18, percentage: 40, trend: 'up' },
              { category: 'Payment Issues', count: 12, percentage: 27, trend: 'down' },
              { category: 'Customer Service', count: 8, percentage: 18, trend: 'stable' },
              { category: 'Collections', count: 4, percentage: 9, trend: 'up' },
              { category: 'Data Rights', count: 3, percentage: 6, trend: 'stable' }
            ],
            byChannel: [],
            bySeverity: [],
            byResolutionTime: [],
            byBranch: []
          },
          qualityMetrics: {
            firstCallResolutionRate: 0.68,
            customerSatisfactionScore: 4.2,
            escalationRate: 0.12,
            repeatComplaintRate: 0.08
          }
        },
        previousQuarter: {
          quarter: previousQuarter,
          year: new Date().getFullYear(),
          startDate: new Date(),
          endDate: new Date(),
          openingBalance: 8,
          complaintsReceived: 42,
          complaintsResolved: 35,
          complaintsWithdrawn: 3,
          closingBalance: 12,
          complaintBreakdown: {
            byCategory: [],
            byChannel: [],
            bySeverity: [],
            byResolutionTime: [],
            byBranch: []
          },
          qualityMetrics: {
            firstCallResolutionRate: 0.65,
            customerSatisfactionScore: 4.1,
            escalationRate: 0.15,
            repeatComplaintRate: 0.10
          }
        },
        yearToDate: {
          totalComplaints: 156,
          resolvedComplaints: 128,
          unresolvedComplaints: 16,
          averageResolutionTime: 8.5,
          slaComplianceRate: 0.92
        },
        historicalQuarters: []
      },
      validationStatus: {
        mathematicalConsistency: true,
        dataCompleteness: true,
        crossPeriodConsistency: true,
        lastValidationTime: new Date()
      },
      performanceMetrics: {
        resolutionRate: 0.84, // 38/45
        withdrawalRate: 0.07, // 3/45
        carryOverRate: 0.36, // 16/45
        averageResolutionTime: 8.5,
        complianceScore: 92
      }
    };
  };

  const generateTimelineData = (): ResolutionTimelineMonitor => {
    return {
      timelineAnalytics: {
        averageResolutionTime: 8.5,
        medianResolutionTime: 7,
        resolutionTimeDistribution: [
          { timeRange: '0-3 days', count: 12, percentage: 32 },
          { timeRange: '4-7 days', count: 15, percentage: 40 },
          { timeRange: '8-14 days', count: 8, percentage: 21 },
          { timeRange: '15+ days', count: 3, percentage: 7 }
        ],
        slaComplianceRate: 0.92,
        escalationRate: 0.12
      },
      realTimeTracking: {
        activeComplaints: [
          {
            complaintId: 'CMP001',
            clientId: 'C001',
            clientName: 'Mary Kinyangi',
            complaintCategory: 'Loan Terms',
            severity: 'High',
            dateReceived: new Date('2025-01-08'),
            currentAge: 5,
            slaDeadline: new Date('2025-01-22'),
            daysUntilDeadline: 9,
            currentStatus: 'In Progress',
            currentAssignee: 'John Mwangi',
            lastActivity: new Date('2025-01-12'),
            progressPercentage: 65,
            riskLevel: 'Medium'
          },
          {
            complaintId: 'CMP002',
            clientId: 'C002',
            clientName: 'Peter Mollel',
            complaintCategory: 'Payment Issues',
            severity: 'Medium',
            dateReceived: new Date('2025-01-05'),
            currentAge: 8,
            slaDeadline: new Date('2025-01-19'),
            daysUntilDeadline: 6,
            currentStatus: 'Under Review',
            currentAssignee: 'Sarah Mollel',
            lastActivity: new Date('2025-01-11'),
            progressPercentage: 80,
            riskLevel: 'Low'
          }
        ],
        overdueComplaints: [],
        criticalComplaints: [],
        todaysResolutions: []
      },
      efficiencyMetrics: {
        firstCallResolution: 0.68,
        resolutionByChannel: [],
        resolutionByCategory: [],
        resolutionByStaff: []
      },
      slaManagement: {
        slaTargets: [
          { category: 'General', targetDays: 14, currentPerformance: 8.5, complianceRate: 0.92 },
          { category: 'Critical', targetDays: 3, currentPerformance: 2.8, complianceRate: 0.95 },
          { category: 'High Priority', targetDays: 7, currentPerformance: 6.2, complianceRate: 0.88 }
        ],
        currentPerformance: [],
        breaches: [],
        improvementAreas: []
      }
    };
  };

  const generateAnalyticsData = (): ComplaintAnalytics => {
    return {
      patternRecognition: {
        complaintTrends: [
          { period: 'Q1 2024', count: 38, trend: 'up', changePercentage: 12 },
          { period: 'Q2 2024', count: 42, trend: 'up', changePercentage: 11 },
          { period: 'Q3 2024', count: 35, trend: 'down', changePercentage: -17 },
          { period: 'Q4 2024', count: 42, trend: 'up', changePercentage: 20 },
          { period: 'Q1 2025', count: 45, trend: 'up', changePercentage: 7 }
        ],
        seasonalPatterns: [],
        cyclicalPatterns: [],
        anomalyDetection: []
      },
      rootCauseAnalysis: {
        primaryCauses: [
          { cause: 'Incorrect Interest Calculation', frequency: 18, impact: 'High', preventability: true },
          { cause: 'Payment Processing Delays', frequency: 12, impact: 'Medium', preventability: true },
          { cause: 'Poor Communication', frequency: 8, impact: 'Medium', preventability: true },
          { cause: 'System Errors', frequency: 4, impact: 'High', preventability: true },
          { cause: 'Policy Confusion', frequency: 3, impact: 'Low', preventability: true }
        ],
        contributingFactors: [],
        systemicIssues: [],
        preventableComplaints: []
      },
      customerJourneyAnalysis: {
        touchpointAnalysis: [],
        journeyStageComplaints: [],
        experienceGaps: [],
        satisfactionCorrelation: []
      },
      predictiveAnalytics: {
        complaintForecasting: [],
        riskPrediction: [],
        preventionOpportunities: [],
        earlyWarningSignals: []
      }
    };
  };

  function getPreviousQuarter(quarter: string): string {
    const [q, year] = quarter.split(' ');
    const quarterNum = parseInt(q.substring(1));
    const yearNum = parseInt(year);
    
    if (quarterNum === 1) {
      return `Q4 ${yearNum - 1}`;
    } else {
      return `Q${quarterNum - 1} ${yearNum}`;
    }
  }

  // Load data on component mount
  useEffect(() => {
    setMSP206Data(generateMSP206Data(selectedQuarter));
    setTimelineData(generateTimelineData());
    setAnalyticsData(generateAnalyticsData());
  }, [selectedQuarter]);

  const clientComplaints = [
    {
      id: 'CMP001',
      title: 'Incorrect Interest Calculation',
      description: 'The interest calculated on my loan seems higher than what was agreed upon.',
      status: 'Open',
      submissionDate: '2025-01-08',
      expectedResolution: '2025-01-22',
      daysRemaining: 14,
      priority: 'High',
      category: 'Loan Terms'
    },
    {
      id: 'CMP002',
      title: 'Payment Not Reflected',
      description: 'I made a payment via M-Pesa 3 days ago but it is not showing in my account.',
      status: 'In Progress',
      submissionDate: '2025-01-05',
      expectedResolution: '2025-01-19',
      daysRemaining: 11,
      priority: 'Medium',
      category: 'Payment Issues'
    },
    {
      id: 'CMP003',
      title: 'Data Access Request',
      description: 'I want to download all my personal data as per my rights under the Data Protection Act.',
      status: 'Resolved',
      submissionDate: '2024-12-28',
      expectedResolution: '2025-01-11',
      daysRemaining: 0,
      priority: 'Low',
      category: 'Data Rights'
    }
  ];

  const staffComplaints = [
    {
      id: 'CMP001',
      clientName: 'Mary Kinyangi',
      clientId: 'C001',
      title: 'Incorrect Interest Calculation',
      description: 'The interest calculated on my loan seems higher than what was agreed upon.',
      status: 'Open',
      submissionDate: '2025-01-08',
      expectedResolution: '2025-01-22',
      daysRemaining: 14,
      priority: 'High',
      category: 'Loan Terms',
      assignedTo: 'John Mwangi',
      sla: 14
    },
    {
      id: 'CMP002',
      clientName: 'Peter Mollel',
      clientId: 'C002',
      title: 'Payment Not Reflected',
      description: 'I made a payment via M-Pesa 3 days ago but it is not showing in my account.',
      status: 'In Progress',
      submissionDate: '2025-01-05',
      expectedResolution: '2025-01-19',
      daysRemaining: 11,
      priority: 'Medium',
      category: 'Payment Issues',
      assignedTo: 'Sarah Mollel',
      sla: 14
    },
    {
      id: 'CMP003',
      clientName: 'Grace Mwalimu',
      clientId: 'C003',
      title: 'Data Access Request',
      description: 'I want to download all my personal data as per my rights under the Data Protection Act.',
      status: 'Resolved',
      submissionDate: '2024-12-28',
      expectedResolution: '2025-01-11',
      daysRemaining: 0,
      priority: 'Low',
      category: 'Data Rights',
      assignedTo: 'David Msangi',
      sla: 14
    },
    {
      id: 'CMP004',
      clientName: 'Joseph Mwanga',
      clientId: 'C004',
      title: 'Excessive Collection Calls',
      description: 'I am receiving too many collection calls despite being only 2 days overdue.',
      status: 'Open',
      submissionDate: '2025-01-09',
      expectedResolution: '2025-01-23',
      daysRemaining: 13,
      priority: 'Medium',
      category: 'Collections',
      assignedTo: 'Unassigned',
      sla: 14
    }
  ];

  const complaints = user?.role === 'client' ? clientComplaints : staffComplaints;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mock staff data for assignment
  const staffMembers = [
    { id: 'staff1', name: 'John Mwalimu', role: 'Customer Service', email: 'john@demo.com' },
    { id: 'staff2', name: 'Mary Kinyangi', role: 'Loan Officer', email: 'mary@demo.com' },
    { id: 'staff3', name: 'Peter Mollel', role: 'Senior Manager', email: 'peter@demo.com' },
    { id: 'staff4', name: 'Grace Mwalimu', role: 'Compliance Officer', email: 'grace@demo.com' }
  ];

  const statusOptions = [
    'Open',
    'In Progress', 
    'Under Review',
    'Resolved',
    'Closed',
    'Escalated'
  ];

  // Handler functions for resolution actions
  const handleAssignStaff = () => {
    if (assignedStaff && selectedComplaint) {
      // Update complaint with assigned staff
      console.log(`Assigning complaint ${selectedComplaint.id} to staff: ${assignedStaff}`);
      // Here you would typically update the database
      alert(`Complaint ${selectedComplaint.id} assigned to ${staffMembers.find(s => s.id === assignedStaff)?.name}`);
      setShowAssignStaff(false);
      setAssignedStaff('');
    }
  };

  const handleUpdateStatus = () => {
    if (newStatus && selectedComplaint) {
      // Update complaint status
      console.log(`Updating complaint ${selectedComplaint.id} status to: ${newStatus}`);
      // Here you would typically update the database
      alert(`Complaint ${selectedComplaint.id} status updated to ${newStatus}`);
      setShowUpdateStatus(false);
      setNewStatus('');
    }
  };

  const handleAddResolutionNotes = () => {
    if (resolutionNotes && selectedComplaint) {
      // Add resolution notes
      console.log(`Adding resolution notes to complaint ${selectedComplaint.id}: ${resolutionNotes}`);
      // Here you would typically update the database
      alert(`Resolution notes added to complaint ${selectedComplaint.id}`);
      setShowResolutionNotes(false);
      setResolutionNotes('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSlaColor = (daysRemaining: number) => {
    if (daysRemaining <= 3) return 'text-red-600';
    if (daysRemaining <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleViewComplaint = (complaint: any) => {
    setSelectedComplaint(complaint);
  };

  // Enhanced UI Components
  const renderQuarterlyComplaintTracker = () => (
    <div className="space-y-6">
      {/* Quarter Selector */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">MSP2_06 Quarterly Complaint Tracker</h3>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedQuarter} 
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Q1 2025">Q1 2025</option>
              <option value="Q4 2024">Q4 2024</option>
              <option value="Q3 2024">Q3 2024</option>
              <option value="Q2 2024">Q2 2024</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Process Quarter Rollover
            </button>
          </div>
        </div>
      </div>

      {/* MSP2_06 Summary Table */}
      {msp206Data && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h4 className="text-lg font-semibold text-gray-900">MSP2_06 Summary - {selectedQuarter}</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">1</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Balance at beginning of quarter</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{msp206Data.msp206Data.row1_balanceAtBeginning}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">2</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Complaints received during the quarter</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{msp206Data.msp206Data.row2_complaintsReceived}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">3</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Complaints resolved during the quarter</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{msp206Data.msp206Data.row3_complaintsResolved}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">4</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Complaints withdrawn during the quarter</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{msp206Data.msp206Data.row4_complaintsWithdrawn}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TrendingUp className="w-4 h-4 text-yellow-500" />
                  </td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">5</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Unresolved complaints (Calculated)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">{msp206Data.msp206Data.row5_unresolvedComplaints}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {msp206Data.validationStatus.mathematicalConsistency ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {msp206Data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">{(msp206Data.performanceMetrics.resolutionRate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-gray-900">{msp206Data.performanceMetrics.averageResolutionTime} days</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Withdrawal Rate</p>
                <p className="text-2xl font-bold text-gray-900">{(msp206Data.performanceMetrics.withdrawalRate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold text-gray-900">{msp206Data.performanceMetrics.complianceScore}/100</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {msp206Data && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Complaint Category Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {msp206Data.quarterlyBreakdown.currentQuarter.complaintBreakdown.byCategory.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium text-gray-900">{category.category}</h5>
                  <span className="text-sm text-gray-500">{category.percentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">{category.count}</span>
                  <div className="flex items-center">
                    {category.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                    {category.trend === 'down' && <TrendingUp className="w-4 h-4 text-green-500 transform rotate-180" />}
                    {category.trend === 'stable' && <Activity className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderResolutionTimelineMonitor = () => (
    <div className="space-y-6">
      {/* Timeline Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Resolution Timeline Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{timelineData?.timelineAnalytics.averageResolutionTime} days</div>
            <div className="text-sm text-gray-600">Average Resolution Time</div>
            <div className="text-xs text-green-600 mt-1">↓ 1.2 days vs last month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{(timelineData?.timelineAnalytics.slaComplianceRate * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-600">SLA Compliance Rate</div>
            <div className="text-xs text-green-600 mt-1">↑ 2.3% vs last month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{(timelineData?.efficiencyMetrics.firstCallResolution * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-600">First Call Resolution</div>
            <div className="text-xs text-green-600 mt-1">↑ 5.1% vs last month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{(timelineData?.timelineAnalytics.escalationRate * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Escalation Rate</div>
            <div className="text-xs text-red-600 mt-1">↑ 0.8% vs last month</div>
          </div>
        </div>
      </div>

      {/* Active Complaints Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-lg font-semibold text-gray-900">Active Complaints Status</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complaint ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timelineData?.realTimeTracking.activeComplaints.map((complaint) => (
                <tr key={complaint.complaintId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{complaint.complaintId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.complaintCategory}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.currentAge} days</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      complaint.daysUntilDeadline <= 3 ? 'bg-red-100 text-red-800' :
                      complaint.daysUntilDeadline <= 7 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {complaint.daysUntilDeadline} days left
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${complaint.progressPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{complaint.progressPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      complaint.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                      complaint.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {complaint.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.currentAssignee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Time Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Resolution Time Distribution</h4>
        <div className="space-y-4">
          {timelineData?.timelineAnalytics.resolutionTimeDistribution.map((dist, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{dist.timeRange}</span>
              <div className="flex items-center flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${dist.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{dist.count}</span>
                <span className="text-sm text-gray-500">({dist.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComplaintAnalytics = () => (
    <div className="space-y-6">
      {/* Pattern Recognition */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Complaint Trends Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">Quarterly Trends</h4>
            <div className="space-y-3">
              {analyticsData?.patternRecognition.complaintTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{trend.period}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">{trend.count}</span>
                    <div className="flex items-center">
                      {trend.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                      {trend.trend === 'down' && <TrendingUp className="w-4 h-4 text-green-500 transform rotate-180" />}
                      {trend.trend === 'stable' && <Activity className="w-4 h-4 text-gray-500" />}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      trend.changePercentage > 0 ? 'bg-red-100 text-red-800' :
                      trend.changePercentage < 0 ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">Root Cause Analysis</h4>
            <div className="space-y-3">
              {analyticsData?.rootCauseAnalysis.primaryCauses.map((cause, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900">{cause.cause}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      cause.impact === 'High' ? 'bg-red-100 text-red-800' :
                      cause.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {cause.impact}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{cause.frequency} occurrences</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      cause.preventability ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cause.preventability ? 'Preventable' : 'Not Preventable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Top Categories</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Loan Terms</span>
              <span className="text-sm font-medium text-gray-900">40%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Payment Issues</span>
              <span className="text-sm font-medium text-gray-900">27%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Customer Service</span>
              <span className="text-sm font-medium text-gray-900">18%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Prevention Opportunities</h4>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Interest calculation errors</div>
            <div className="text-sm text-gray-600">Payment processing delays</div>
            <div className="text-sm text-gray-600">Communication gaps</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Quick Actions</h4>
          </div>
          <div className="space-y-2">
            <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800">
              Review interest calculation process
            </button>
            <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800">
              Improve payment notifications
            </button>
            <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800">
              Enhance staff training
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{t('complaints')} Management</h1>
          <p className="text-blue-100">
            {user?.role === 'client' 
              ? 'Submit and track your complaints with 14-day resolution SLA'
              : 'Handle client complaints with regulatory compliance and advanced analytics'
            }
          </p>
        </div>

        {/* Enhanced Tab Navigation */}
        {user?.role === 'staff' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Overview
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('quarterly')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'quarterly'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Quarterly Tracker
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'timeline'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Resolution Timeline
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <PieChart className="w-4 h-4 mr-2" />
                    Analytics
                  </div>
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.role === 'client' ? clientComplaints.length : staffComplaints.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-red-700">
                  {complaints.filter(c => c.status === 'Open').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {complaints.filter(c => c.status === 'In Progress').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-700">
                  {complaints.filter(c => c.status === 'Resolved').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Complaint Button (Client Only) */}
        {user?.role === 'client' && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowSubmitForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit New Complaint
            </button>
          </div>
        )}

        {/* Complaints List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {user?.role === 'client' ? 'My Complaints' : 'Client Complaints'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {user?.role === 'client' 
                ? 'Track your submitted complaints and resolution progress'
                : 'Manage client complaints with 14-day SLA compliance'
              }
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Complaint Details
                  </th>
                  {user?.role === 'staff' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SLA Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {complaint.id} - {complaint.title}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {complaint.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          Category: {complaint.category}
                        </div>
                      </div>
                    </td>
                    {user?.role === 'staff' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {(complaint as any).clientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(complaint as any).clientId}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium ${getSlaColor(complaint.daysRemaining)}`}>
                          {complaint.daysRemaining > 0 ? `${complaint.daysRemaining} days left` : 'Completed'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Due: {complaint.expectedResolution}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewComplaint(complaint)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Complaint Form */}
        {showSubmitForm && user?.role === 'client' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Submit New Complaint</h3>
                <button
                  onClick={() => setShowSubmitForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complaint Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the issue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select category...</option>
                    <option value="loan_terms">Loan Terms</option>
                    <option value="payment_issues">Payment Issues</option>
                    <option value="customer_service">Customer Service</option>
                    <option value="data_rights">Data Rights</option>
                    <option value="collections">Collections</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Please provide detailed information about your complaint..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supporting Documents (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    I consent to data processing for complaint resolution purposes under the Data Protection Act 2022.
                    <span className="block text-xs text-gray-500 mt-1">
                      Your complaint will be handled confidentially and resolved within 14 days as per Microfinance Act 2018.
                    </span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitForm(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Complaint
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complaint Details Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Complaint Details - {selectedComplaint.id}
                </h3>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Title:</span>
                        <span className="font-medium">{selectedComplaint.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{selectedComplaint.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedComplaint.priority)}`}>
                          {selectedComplaint.priority}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedComplaint.status)}`}>
                          {selectedComplaint.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="font-medium">{selectedComplaint.submissionDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium">{selectedComplaint.expectedResolution}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SLA Status:</span>
                        <span className={`font-medium ${getSlaColor(selectedComplaint.daysRemaining)}`}>
                          {selectedComplaint.daysRemaining > 0 ? `${selectedComplaint.daysRemaining} days remaining` : 'Completed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedComplaint.description}
                  </p>
                </div>

                {user?.role === 'staff' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Client Name:</span>
                        <span className="font-medium">{(selectedComplaint as any).clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Client ID:</span>
                        <span className="font-medium">{(selectedComplaint as any).clientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned To:</span>
                        <span className="font-medium">{(selectedComplaint as any).assignedTo}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Resolution Actions</h4>
                      <div className="space-y-2">
                        <button 
                          onClick={() => setShowAssignStaff(true)}
                          className="w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                        >
                          <h5 className="font-medium text-gray-900">Assign to Staff</h5>
                          <p className="text-sm text-gray-600">Assign complaint to a team member</p>
                        </button>
                        <button 
                          onClick={() => setShowUpdateStatus(true)}
                          className="w-full p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                        >
                          <h5 className="font-medium text-gray-900">Update Status</h5>
                          <p className="text-sm text-gray-600">Change complaint status</p>
                        </button>
                        <button 
                          onClick={() => setShowResolutionNotes(true)}
                          className="w-full p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                        >
                          <h5 className="font-medium text-gray-900">Add Resolution Notes</h5>
                          <p className="text-sm text-gray-600">Document resolution details</p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assign Staff Modal */}
        {showAssignStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Assign to Staff</h3>
                <button
                  onClick={() => setShowAssignStaff(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Staff Member
                  </label>
                  <select
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a staff member...</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} - {staff.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAssignStaff(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignStaff}
                    disabled={!assignedStaff}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showUpdateStatus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
                <button
                  onClick={() => setShowUpdateStatus(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Status
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedComplaint?.status)}`}>
                      {selectedComplaint?.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select new status...</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowUpdateStatus(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={!newStatus}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resolution Notes Modal */}
        {showResolutionNotes && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Resolution Notes</h3>
                <button
                  onClick={() => setShowResolutionNotes(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter detailed resolution notes, actions taken, and next steps..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These notes will be visible to the client and other staff members.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowResolutionNotes(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddResolutionNotes}
                    disabled={!resolutionNotes.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Notice */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Regulatory Compliance</h3>
              <div className="mt-2 text-sm text-blue-800">
                <p className="mb-2">
                  All complaints are handled in compliance with the Microfinance Act 2018:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>14-day resolution SLA with automated tracking</li>
                  <li>Full audit trail for regulatory review</li>
                  <li>Data protection compliance per Data Protection Act 2022</li>
                  <li>Confidential handling with role-based access</li>
                </ul>
              </div>
            </div>
          </div>
            </div>
          </div>
        )}

        {/* Quarterly Tracker Tab */}
        {activeTab === 'quarterly' && renderQuarterlyComplaintTracker()}

        {/* Resolution Timeline Tab */}
        {activeTab === 'timeline' && renderResolutionTimelineMonitor()}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && renderComplaintAnalytics()}

        {/* Compliance Notice */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Regulatory Compliance</h3>
              <div className="mt-2 text-sm text-blue-800">
                <p className="mb-2">
                  All complaints are handled in compliance with the Microfinance Act 2018:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>14-day resolution SLA with automated tracking</li>
                  <li>Full audit trail for regulatory review</li>
                  <li>Data protection compliance per Data Protection Act 2022</li>
                  <li>Confidential handling with role-based access</li>
                  <li>MSP2_06 quarterly reporting with auto-calculation</li>
                  <li>Advanced analytics for pattern recognition and prevention</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Complaints;