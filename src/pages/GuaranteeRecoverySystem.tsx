import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { GroupService, Group, GroupMember } from '../services/groupService';
import { GroupRecoveryService } from '../services/groupRecoveryService';
import {
  Shield, DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, Users, RefreshCw, Eye, FileText, Download, Send, UserCheck,
  Calculator, BarChart3, Target, Zap
} from 'lucide-react';

interface GuaranteeRecovery {
  id: string;
  group_id: string;
  member_id: string;
  member_name: string;
  recovery_amount: number;
  recovery_type: 'automatic' | 'manual' | 'group_contribution' | 'asset_sale';
  recovery_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  initiated_date: string;
  completed_date?: string;
  recovery_method: string;
  recovery_percentage: number;
  remaining_balance: number;
  group_impact: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface GroupGuaranteeStatus {
  group_id: string;
  group_name: string;
  total_guarantee_fund: number;
  available_guarantee: number;
  utilized_guarantee: number;
  utilization_rate: number;
  recovery_in_progress: number;
  total_recoveries: number;
  recovery_success_rate: number;
  last_recovery_date: string;
  health_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

interface RecoveryRule {
  id: string;
  rule_name: string;
  trigger_condition: string;
  recovery_action: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

const GuaranteeRecoverySystem: React.FC = () => {
  const { t, language } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [guaranteeRecoveries, setGuaranteeRecoveries] = useState<GuaranteeRecovery[]>([]);
  const [groupGuaranteeStatus, setGroupGuaranteeStatus] = useState<GroupGuaranteeStatus | null>(null);
  const [recoveryRules, setRecoveryRules] = useState<RecoveryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showBulkRecovery, setShowBulkRecovery] = useState(false);
  const [selectedRecovery, setSelectedRecovery] = useState<GuaranteeRecovery | null>(null);
  
  // Form states
  const [recoveryForm, setRecoveryForm] = useState({
    member_id: '',
    recovery_amount: '',
    recovery_type: '',
    recovery_method: '',
    priority: 'medium'
  });
  
  const [ruleForm, setRuleForm] = useState({
    rule_name: '',
    trigger_condition: '',
    recovery_action: '',
    priority: '1'
  });
  
  const [bulkRecoveryForm, setBulkRecoveryForm] = useState({
    recovery_type: '',
    recovery_method: '',
    priority: 'medium',
    selected_members: [] as string[]
  });

  useEffect(() => {
    loadGroups();
    loadRecoveryRules();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const result = await GroupService.getGroups();
      
      if (result.success && result.data) {
        setGroups(result.data);
        if (result.data.length > 0) {
          setSelectedGroup(result.data[0]);
          loadRecoveryData(result.data[0].id);
        }
      } else {
        setError(result.error || 'Failed to load groups');
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadRecoveryData = async (groupId: string) => {
    try {
      const result = await GroupRecoveryService.getGuaranteeRecoveries(groupId);
      
      if (result.success && result.data) {
        setRecoveries(result.data);
      } else {
        setError(result.error || 'Failed to load recovery data');
        setRecoveries([]);
      }
    } catch (error) {
      console.error('Error loading recovery data:', error);
      setError('Failed to load recovery data');
      setRecoveries([]);
    }
  };

  const loadRecoveryDataMock = async (groupId: string) => {
    try {
      // Mock data - fallback when no real data available
      const mockRecoveries: GuaranteeRecovery[] = [
        {
          id: '1',
          group_id: groupId,
          member_id: 'member_1',
          member_name: 'Sarah Mwangi',
          recovery_amount: 125000,
          recovery_type: 'automatic',
          recovery_status: 'completed',
          initiated_date: '2025-01-10',
          completed_date: '2025-01-15',
          recovery_method: 'Salary deduction',
          recovery_percentage: 100,
          remaining_balance: 0,
          group_impact: 'low',
          priority: 'medium'
        },
        {
          id: '2',
          group_id: groupId,
          member_id: 'member_2',
          member_name: 'John Kimani',
          recovery_amount: 200000,
          recovery_type: 'manual',
          recovery_status: 'in_progress',
          initiated_date: '2025-01-12',
          recovery_method: 'Asset sale',
          recovery_percentage: 60,
          remaining_balance: 80000,
          group_impact: 'high',
          priority: 'urgent'
        },
        {
          id: '3',
          group_id: groupId,
          member_id: 'member_3',
          member_name: 'Grace Mwalimu',
          recovery_amount: 75000,
          recovery_type: 'group_contribution',
          recovery_status: 'pending',
          initiated_date: '2025-01-14',
          recovery_method: 'Group fund contribution',
          recovery_percentage: 0,
          remaining_balance: 75000,
          group_impact: 'medium',
          priority: 'high'
        }
      ];
      
      const mockGroupStatus: GroupGuaranteeStatus = {
        group_id: groupId,
        group_name: 'Women Entrepreneurs Group',
        total_guarantee_fund: 2000000,
        available_guarantee: 1600000,
        utilized_guarantee: 400000,
        utilization_rate: 20,
        recovery_in_progress: 275000,
        total_recoveries: 125000,
        recovery_success_rate: 85,
        last_recovery_date: '2025-01-15',
        health_score: 75,
        risk_level: 'medium'
      };
      
      setGuaranteeRecoveries(mockRecoveries);
      setGroupGuaranteeStatus(mockGroupStatus);
    } catch (error) {
      console.error('Error loading recovery data:', error);
    }
  };

  const loadRecoveryRules = async () => {
    try {
      // Mock data - in real app, this would come from Supabase
      const mockRules: RecoveryRule[] = [
        {
          id: '1',
          rule_name: 'Automatic Salary Deduction',
          trigger_condition: 'Member defaults for 15+ days',
          recovery_action: 'Initiate salary deduction at 20% of monthly income',
          priority: 1,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          rule_name: 'Group Fund Utilization',
          trigger_condition: 'Member defaults for 30+ days',
          recovery_action: 'Utilize group guarantee fund',
          priority: 2,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '3',
          rule_name: 'Asset Sale Initiation',
          trigger_condition: 'Member defaults for 60+ days',
          recovery_action: 'Initiate asset sale process',
          priority: 3,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z'
        }
      ];
      
      setRecoveryRules(mockRules);
    } catch (error) {
      console.error('Error loading recovery rules:', error);
    }
  };

  const handleCreateRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newRecovery: GuaranteeRecovery = {
        id: Date.now().toString(),
        group_id: selectedGroup!.id,
        member_id: recoveryForm.member_id,
        member_name: 'Selected Member', // In real app, this would be fetched
        recovery_amount: parseFloat(recoveryForm.recovery_amount),
        recovery_type: recoveryForm.recovery_type as any,
        recovery_status: 'pending',
        initiated_date: new Date().toISOString().split('T')[0],
        recovery_method: recoveryForm.recovery_method,
        recovery_percentage: 0,
        remaining_balance: parseFloat(recoveryForm.recovery_amount),
        group_impact: 'medium',
        priority: recoveryForm.priority as any
      };
      
      setGuaranteeRecoveries(prev => [newRecovery, ...prev]);
      setShowRecoveryModal(false);
      setRecoveryForm({
        member_id: '',
        recovery_amount: '',
        recovery_type: '',
        recovery_method: '',
        priority: 'medium'
      });
      
      alert('Recovery action created successfully!');
    } catch (error) {
      console.error('Error creating recovery:', error);
      alert('Failed to create recovery. Please try again.');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newRule: RecoveryRule = {
        id: Date.now().toString(),
        rule_name: ruleForm.rule_name,
        trigger_condition: ruleForm.trigger_condition,
        recovery_action: ruleForm.recovery_action,
        priority: parseInt(ruleForm.priority),
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      setRecoveryRules(prev => [newRule, ...prev]);
      setShowRuleModal(false);
      setRuleForm({
        rule_name: '',
        trigger_condition: '',
        recovery_action: '',
        priority: '1'
      });
      
      alert('Recovery rule created successfully!');
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Failed to create rule. Please try again.');
    }
  };

  const handleBulkRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Mock bulk recovery - in real app, this would process multiple recoveries
      const bulkRecoveries = bulkRecoveryForm.selected_members.map(memberId => ({
        id: Date.now().toString() + Math.random(),
        group_id: selectedGroup!.id,
        member_id: memberId,
        member_name: 'Bulk Member',
        recovery_amount: 50000, // Mock amount
        recovery_type: bulkRecoveryForm.recovery_type as any,
        recovery_status: 'pending' as const,
        initiated_date: new Date().toISOString().split('T')[0],
        recovery_method: bulkRecoveryForm.recovery_method,
        recovery_percentage: 0,
        remaining_balance: 50000,
        group_impact: 'medium' as const,
        priority: bulkRecoveryForm.priority as any
      }));
      
      setGuaranteeRecoveries(prev => [...bulkRecoveries, ...prev]);
      setShowBulkRecovery(false);
      setBulkRecoveryForm({
        recovery_type: '',
        recovery_method: '',
        priority: 'medium',
        selected_members: []
      });
      
      alert(`Bulk recovery initiated for ${bulkRecoveryForm.selected_members.length} members!`);
    } catch (error) {
      console.error('Error initiating bulk recovery:', error);
      alert('Failed to initiate bulk recovery. Please try again.');
    }
  };

  const handleRecoveryAction = async (recoveryId: string, action: 'approve' | 'reject' | 'complete') => {
    try {
      const updatedRecoveries = guaranteeRecoveries.map(recovery =>
        recovery.id === recoveryId
          ? {
              ...recovery,
              recovery_status: action === 'approve' ? 'in_progress' as const :
                             action === 'complete' ? 'completed' as const :
                             'failed' as const,
              completed_date: action === 'complete' ? new Date().toISOString().split('T')[0] : undefined
            }
          : recovery
      );
      
      setGuaranteeRecoveries(updatedRecoveries);
      alert(`Recovery ${action}ed successfully!`);
    } catch (error) {
      console.error('Error updating recovery:', error);
      alert('Failed to update recovery. Please try again.');
    }
  };

  const runAutomaticRecovery = async () => {
    try {
      // Mock automatic recovery - in real app, this would run the recovery rules
      const recoverySteps = [
        'Scanning for members meeting recovery criteria',
        'Applying recovery rules automatically',
        'Initiating recovery actions',
        'Updating group guarantee status',
        'Sending notifications to affected members'
      ];
      
      console.log('Running automatic recovery:', recoverySteps);
      
      setTimeout(() => {
        alert('Automatic recovery completed! 3 new recovery actions initiated.');
      }, 3000);
    } catch (error) {
      console.error('Error running automatic recovery:', error);
      alert('Failed to run automatic recovery. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'urgent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading Guarantee Recovery System...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guarantee Recovery System</h1>
            <p className="text-gray-600">Automated guarantee recovery and fund management</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={runAutomaticRecovery}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Zap className="w-4 h-4 mr-2" />
              Run Auto Recovery
            </button>
            <button
              onClick={() => setShowRecoveryModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Recovery
            </button>
          </div>
        </div>

        {/* Group Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Group</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedGroup(group);
                  loadRecoveryData(group.id);
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedGroup?.id === group.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <h4 className="font-medium text-gray-900">{group.name}</h4>
                <p className="text-sm text-gray-600">{group.total_members} members</p>
                <p className="text-xs text-gray-500 mt-1">
                  Guarantee: {formatCurrency(group.current_guarantee_balance)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Group Guarantee Status */}
        {groupGuaranteeStatus && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Guarantee Fund</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(groupGuaranteeStatus.total_guarantee_fund)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Available Guarantee</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(groupGuaranteeStatus.available_guarantee)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Utilization Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {groupGuaranteeStatus.utilization_rate}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Recovery Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {groupGuaranteeStatus.recovery_success_rate}%
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getRiskColor(groupGuaranteeStatus.risk_level)}`}>
                    {groupGuaranteeStatus.risk_level}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recovery Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Recovery Actions - {selectedGroup?.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowBulkRecovery(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  Bulk Recovery
                </button>
                <button
                  onClick={() => setShowRuleModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  Manage Rules
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recovery Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guaranteeRecoveries.map((recovery) => (
                  <tr key={recovery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{recovery.member_name}</div>
                        <div className="text-sm text-gray-500">ID: {recovery.member_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          Amount: {formatCurrency(recovery.recovery_amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Method: {recovery.recovery_method}
                        </div>
                        <div className="text-sm text-gray-500">
                          Type: {recovery.recovery_type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(recovery.recovery_status)}`}>
                        {recovery.recovery_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {recovery.recovery_percentage}% Complete
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${recovery.recovery_percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Remaining: {formatCurrency(recovery.remaining_balance)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(recovery.priority)}`}>
                        {recovery.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {recovery.recovery_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleRecoveryAction(recovery.id, 'approve')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve Recovery"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRecoveryAction(recovery.id, 'reject')}
                              className="text-red-600 hover:text-red-900"
                              title="Reject Recovery"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {recovery.recovery_status === 'in_progress' && (
                          <button
                            onClick={() => handleRecoveryAction(recovery.id, 'complete')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Mark Complete"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedRecovery(recovery)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recovery Rules */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recovery Rules</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rule Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trigger Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recovery Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recoveryRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rule.rule_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.trigger_condition}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.recovery_action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rule.is_active ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                      }`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Recovery Modal */}
        {showRecoveryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Recovery Action</h3>
              
              <form onSubmit={handleCreateRecovery} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member ID *
                  </label>
                  <input
                    type="text"
                    value={recoveryForm.member_id}
                    onChange={(e) => setRecoveryForm(prev => ({ ...prev, member_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter member ID"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recovery Amount (TZS) *
                  </label>
                  <input
                    type="number"
                    value={recoveryForm.recovery_amount}
                    onChange={(e) => setRecoveryForm(prev => ({ ...prev, recovery_amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recovery Type *
                  </label>
                  <select
                    value={recoveryForm.recovery_type}
                    onChange={(e) => setRecoveryForm(prev => ({ ...prev, recovery_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Recovery Type</option>
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                    <option value="group_contribution">Group Contribution</option>
                    <option value="asset_sale">Asset Sale</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recovery Method *
                  </label>
                  <input
                    type="text"
                    value={recoveryForm.recovery_method}
                    onChange={(e) => setRecoveryForm(prev => ({ ...prev, recovery_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Salary deduction, Asset sale"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={recoveryForm.priority}
                    onChange={(e) => setRecoveryForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Recovery
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Rule Modal */}
        {showRuleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Recovery Rule</h3>
              
              <form onSubmit={handleCreateRule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={ruleForm.rule_name}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, rule_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter rule name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Condition *
                  </label>
                  <textarea
                    value={ruleForm.trigger_condition}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, trigger_condition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe when this rule should trigger..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recovery Action *
                  </label>
                  <textarea
                    value={ruleForm.recovery_action}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, recovery_action: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe what action to take..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={ruleForm.priority}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="1">1 (Highest)</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5 (Lowest)</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRuleModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Create Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Recovery Modal */}
        {showBulkRecovery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Recovery</h3>
              
              <form onSubmit={handleBulkRecovery} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recovery Type *
                  </label>
                  <select
                    value={bulkRecoveryForm.recovery_type}
                    onChange={(e) => setBulkRecoveryForm(prev => ({ ...prev, recovery_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Recovery Type</option>
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                    <option value="group_contribution">Group Contribution</option>
                    <option value="asset_sale">Asset Sale</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recovery Method *
                  </label>
                  <input
                    type="text"
                    value={bulkRecoveryForm.recovery_method}
                    onChange={(e) => setBulkRecoveryForm(prev => ({ ...prev, recovery_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Salary deduction, Asset sale"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={bulkRecoveryForm.priority}
                    onChange={(e) => setBulkRecoveryForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Members (Mock - in real app, this would be a multi-select)
                  </label>
                  <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
                    Member 1, Member 2, Member 3 (Mock selection)
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBulkRecovery(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Initiate Bulk Recovery
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GuaranteeRecoverySystem;


